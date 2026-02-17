use crate::error::{AppError, AppResult};
use regex::Regex;

pub fn generate_confirmation_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    format!("{:06}", rng.gen_range(0..1000000))
}

pub async fn hash_password(password: &str) -> AppResult<String> {
    let hashed = bcrypt::hash(password, 10)
        .map_err(|e| AppError::InternalServerError(format!("Failed to hash password: {}", e)))?;
    Ok(hashed)
}

pub async fn verify_password(password: &str, hash: &str) -> AppResult<bool> {
    let valid = bcrypt::verify(password, hash)
        .map_err(|e| AppError::InternalServerError(format!("Failed to verify password: {}", e)))?;
    Ok(valid)
}

pub fn validate_gmail(email: &str) -> AppResult<()> {
    if !email.ends_with("@gmail.com") {
        return Err(AppError::ValidationError(
            "You must use a Gmail account (email must end with @gmail.com)".to_string()
        ));
    }
    Ok(())
}

pub fn validate_email(email: &str) -> AppResult<()> {
    let email_regex = Regex::new(
        r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
    ).unwrap();
    
    if !email_regex.is_match(email) {
        return Err(AppError::ValidationError("Invalid email format".to_string()));
    }
    Ok(())
}

pub async fn send_confirmation_email(
    _gmail_user: &str,
    _gmail_password: &str,
    to_email: &str,
    code: &str,
) -> AppResult<()> {
    // Email sending is simplified - just log for now
    // In production, integrate with actual email service
    tracing::info!("✓ Verification code for {}: {}", to_email, code);
    Ok(())
}

pub fn generate_id() -> String {
    uuid::Uuid::new_v4().to_string()
}
