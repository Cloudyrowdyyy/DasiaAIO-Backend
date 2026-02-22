use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use chrono::Duration;
use sqlx::{PgPool, Row};
use std::sync::Arc;
use serde_json::json;

use crate::{
    error::{AppError, AppResult},
    models::{CreateUserRequest, LoginRequest, VerifyEmailRequest, ResendCodeRequest, UserResponse},
    utils::{self, verify_password},
};

pub async fn register(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<CreateUserRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Register request received for user: {}", payload.email);

    // Validate required fields
    if payload.role == "admin" {
        if payload.email.is_empty() || payload.password.is_empty() || payload.username.is_empty() 
            || payload.full_name.is_empty() || payload.phone_number.is_empty() {
            return Err(AppError::BadRequest(
                "Email, password, username, full name, and phone number are required for admin accounts".to_string()
            ));
        }
    } else {
        if payload.email.is_empty() || payload.password.is_empty() || payload.username.is_empty() 
            || payload.full_name.is_empty() || payload.phone_number.is_empty() 
            || payload.license_number.is_none() || payload.license_expiry_date.is_none() {
            return Err(AppError::BadRequest(
                "All fields are required for regular user accounts".to_string()
            ));
        }
    }

    // Validate Gmail
    utils::validate_gmail(&payload.email)?;

    // Validate role
    if payload.role != "user" && payload.role != "admin" {
        return Err(AppError::BadRequest("Role must be 'user' or 'admin'".to_string()));
    }

    // Validate admin code
    if payload.role == "admin" {
        let admin_code = payload.admin_code.as_ref()
            .ok_or_else(|| AppError::BadRequest("Admin code is required".to_string()))?;
        if admin_code != "122601" {
            return Err(AppError::BadRequest("Invalid admin code".to_string()));
        }
    }

    // Check if user exists
    let existing_user = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    if existing_user.is_some() {
        return Err(AppError::Conflict("User already exists".to_string()));
    }

    // Hash password
    let hashed_password = utils::hash_password(&payload.password).await?;

    // Generate user ID and confirmation code
    let user_id = utils::generate_id();
    let confirmation_code = utils::generate_confirmation_code();
    let expires_at = chrono::Utc::now() + Duration::minutes(10);

    // Create user
    sqlx::query(
        r#"INSERT INTO users (id, email, username, password, role, full_name, phone_number, license_number, license_expiry_date, verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)"#
    )
    .bind(&user_id)
    .bind(&payload.email)
    .bind(&payload.username)
    .bind(&hashed_password)
    .bind(&payload.role)
    .bind(&payload.full_name)
    .bind(&payload.phone_number)
    .bind(&payload.license_number)
    .bind(&payload.license_expiry_date)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create user: {}", e)))?;

    // Create verification record
    let verification_id = utils::generate_id();
    sqlx::query(
        "INSERT INTO verifications (id, user_id, code, expires_at) VALUES ($1, $2, $3, $4)"
    )
    .bind(&verification_id)
    .bind(&user_id)
    .bind(&confirmation_code)
    .bind(expires_at)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create verification: {}", e)))?;

    // Attempt to send verification email — failure is non-fatal so the user
    // is always created even when SMTP isn't configured (dev / staging).
    let gmail_user = std::env::var("GMAIL_USER").unwrap_or_default();
    let gmail_password = std::env::var("GMAIL_PASSWORD").unwrap_or_default();
    let email_sent = if !gmail_user.is_empty() && !gmail_password.is_empty() {
        match utils::send_confirmation_email(
            &gmail_user,
            &gmail_password,
            &payload.email,
            &confirmation_code,
        ).await {
            Ok(_) => {
                tracing::info!("Verification email sent to {}", payload.email);
                true
            }
            Err(e) => {
                tracing::warn!("Failed to send verification email to {}: {}. User created but email not sent.", payload.email, e);
                false
            }
        }
    } else {
        tracing::warn!("GMAIL_USER / GMAIL_PASSWORD not set — skipping email, code logged to console.");
        tracing::info!("Verification code for {} : {}", payload.email, confirmation_code);
        false
    };

    // Include the confirmation code in the response when email was not sent
    // (allows test/simulation scripts to verify without a real inbox).
    let response_code: Option<&str> = if email_sent { None } else { Some(&confirmation_code) };

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "message": if email_sent {
                "Registration successful! Check your Gmail for confirmation code."
            } else {
                "Registration successful! Email not sent — use the confirmationCode field to verify."
            },
            "userId": user_id,
            "email": payload.email,
            "requiresVerification": true,
            "confirmationCode": response_code
        })),
    ))
}

pub async fn verify_email(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<VerifyEmailRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.email.is_empty() || payload.code.is_empty() {
        return Err(AppError::BadRequest(
            "Email and code are required".to_string()
        ));
    }

    // Find verification record
    let verification = sqlx::query(
        "SELECT id, user_id, expires_at FROM verifications WHERE code = $1"
    )
    .bind(&payload.code)
    .fetch_optional(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::BadRequest("Invalid confirmation code".to_string()))?;

    // Check if code expired
    if chrono::Utc::now() > verification.try_get::<chrono::DateTime<chrono::Utc>, _>("expires_at").unwrap() {
        let ver_id: String = verification.try_get("id").unwrap();
        sqlx::query("DELETE FROM verifications WHERE id = $1")
            .bind(&ver_id)
            .execute(db.as_ref())
            .await
            .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;
        return Err(AppError::BadRequest("Confirmation code expired".to_string()));
    }

    // Mark user as verified
    let user_id: String = verification.try_get("user_id").unwrap();
    sqlx::query(
        "UPDATE users SET verified = TRUE WHERE id = $1"
    )
    .bind(&user_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    // Delete verification record
    let ver_id: String = verification.try_get("id").unwrap();
    sqlx::query("DELETE FROM verifications WHERE id = $1")
        .bind(&ver_id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "message": "Email verified successfully! You can now login."
    })))
}

pub async fn resend_verification_code(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<ResendCodeRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.email.is_empty() {
        return Err(AppError::BadRequest("Email is required".to_string()));
    }

    // Find user
    let user = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    // Generate new code
    let confirmation_code = utils::generate_confirmation_code();
    let expires_at = chrono::Utc::now() + Duration::minutes(10);

    // Delete old verification
    let user_id: String = user.try_get("id").unwrap();
    sqlx::query("DELETE FROM verifications WHERE user_id = $1")
        .bind(&user_id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    // Create new verification
    let verification_id = utils::generate_id();
    sqlx::query(
        "INSERT INTO verifications (id, user_id, code, expires_at) VALUES ($1, $2, $3, $4)"
    )
    .bind(&verification_id)
    .bind(&user_id)
    .bind(&confirmation_code)
    .bind(expires_at)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    let gmail_user = std::env::var("GMAIL_USER").unwrap_or_else(|_| "no-reply@example.com".to_string());
    let gmail_password = std::env::var("GMAIL_PASSWORD").unwrap_or_else(|_| "dummy-password".to_string());
    utils::send_confirmation_email(
        &gmail_user,
        &gmail_password,
        &payload.email,
        &confirmation_code,
    ).await?;

    Ok(Json(json!({
        "message": "Verification code resent to your email"
    })))
}

pub async fn login(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<LoginRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.identifier.is_empty() || payload.password.is_empty() {
        return Err(AppError::BadRequest(
            "Email, username, phone number, and password are required".to_string()
        ));
    }

    // Find user by email, username, or phone
    let user = sqlx::query(
        r#"SELECT id, email, username, password, role, full_name, phone_number, license_number, license_expiry_date, profile_photo, verified, created_at, updated_at FROM users 
           WHERE email = $1 OR username = $1 OR phone_number = $1"#
    )
    .bind(&payload.identifier)
    .fetch_optional(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::BadRequest("Invalid credentials".to_string()))?;

    // Check if user is verified
    let verified: bool = user.try_get("verified").unwrap_or(false);
    if !verified {
        return Err(AppError::BadRequest(
            "Please verify your email first".to_string()
        ));
    }

    // Verify password
    let password_hash: String = user.try_get("password").unwrap();
    let password_valid = verify_password(&payload.password, &password_hash).await?;
    if !password_valid {
        return Err(AppError::BadRequest("Invalid credentials".to_string()));
    }

    let id: String = user.try_get("id").unwrap();
    let email: String = user.try_get("email").unwrap();
    let username: String = user.try_get("username").unwrap();
    let role: String = user.try_get("role").unwrap();
    let full_name: Option<String> = user.try_get("full_name").ok();
    let phone_number: Option<String> = user.try_get("phone_number").ok();
    let license_number: Option<String> = user.try_get("license_number").ok();
    let profile_photo: Option<String> = user.try_get("profile_photo").ok();

    Ok(Json(json!({
        "message": "Login successful",
        "user": {
            "id": id,
            "email": email,
            "username": username,
            "role": role,
            "fullName": full_name,
            "phoneNumber": phone_number,
            "licenseNumber": license_number,
            "profilePhoto": profile_photo,
        }
    })))
}



