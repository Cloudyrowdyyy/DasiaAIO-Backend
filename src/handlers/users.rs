use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use std::sync::Arc;
use serde_json::json;

use crate::{
    error::{AppError, AppResult},
    models::{UserResponse, User},
};

pub async fn get_all_users(
    State(db): State<Arc<PgPool>>,
) -> AppResult<Json<serde_json::Value>> {
    let users = sqlx::query_as::<_, User>(
        "SELECT id, email, username, password, role, full_name, phone_number, license_number, license_expiry_date, verified, created_at, updated_at FROM users"
    )
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    let user_responses: Vec<UserResponse> = users.into_iter().map(|u| u.into()).collect();

    Ok(Json(json!({
        "total": user_responses.len(),
        "users": user_responses
    })))
}

pub async fn get_user_by_id(
    State(db): State<Arc<PgPool>>,
    Path(id): Path<String>,
) -> AppResult<Json<UserResponse>> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, username, password, role, full_name, phone_number, license_number, license_expiry_date, verified, created_at, updated_at FROM users WHERE id = $1"
    )
    .bind(&id)
    .fetch_optional(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user.into()))
}

pub async fn update_user(
    State(db): State<Arc<PgPool>>,
    Path(id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> AppResult<Json<serde_json::Value>> {
    // Check if user exists
    sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let full_name = payload.get("fullName").and_then(|v| v.as_str());
    let phone_number = payload.get("phoneNumber").and_then(|v| v.as_str());
    let license_number = payload.get("licenseNumber").and_then(|v| v.as_str());
    let license_expiry_date = payload.get("licenseExpiryDate").and_then(|v| v.as_str());

    // Build query based on provided fields
    if let Some(full_name) = full_name {
        sqlx::query(
            "UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
        )
        .bind(full_name)
        .bind(&id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;
    }

    if let Some(phone_number) = phone_number {
        sqlx::query(
            "UPDATE users SET phone_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
        )
        .bind(phone_number)
        .bind(&id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;
    }

    if let Some(license_number) = license_number {
        sqlx::query(
            "UPDATE users SET license_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
        )
        .bind(license_number)
        .bind(&id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;
    }

    if let Some(license_expiry_date) = license_expiry_date {
        let expiry_date = chrono::DateTime::parse_from_rfc3339(license_expiry_date)
            .ok()
            .map(|dt| dt.with_timezone(&chrono::Utc));
        
        if let Some(expiry_date) = expiry_date {
            sqlx::query(
                "UPDATE users SET license_expiry_date = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
            )
            .bind(expiry_date)
            .bind(&id)
            .execute(db.as_ref())
            .await
            .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;
        }
    }

    Ok(Json(json!({
        "message": "User updated successfully"
    })))
}

pub async fn delete_user(
    State(db): State<Arc<PgPool>>,
    Path(id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    // Check if user exists
    sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(&id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "message": "User deleted successfully"
    })))
}


