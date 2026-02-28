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
    gmail_user: &str,
    gmail_password: &str,
    to_email: &str,
    code: &str,
) -> AppResult<()> {
    use lettre::message::header::ContentType;
    use lettre::message::SinglePart;
    use lettre::transport::smtp::authentication::Credentials;
    use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

    let html_body = format!(
        r#"
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">Davao Security & Investigation Agency</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
            </div>
            <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with Davao Security & Investigation Agency.
                    Please use the following verification code to confirm your email address:
                </p>
                <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                    <code style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px;">{}</code>
                </div>
                <p style="color: #666; font-size: 14px;">
                    This code will expire in 10 minutes. If you did not request this verification code, please ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2024 Davao Security & Investigation Agency. All rights reserved.
                </p>
            </div>
        </div>
        "#,
        code
    );

    let email = Message::builder()
        .from(gmail_user.parse().map_err(|e| AppError::InternalServerError(format!("Invalid sender email: {}", e)))?)
        .to(to_email.parse().map_err(|e| AppError::InternalServerError(format!("Invalid recipient email: {}", e)))?)
        .subject("Davao Security - Email Verification Code")
        .singlepart(
            SinglePart::builder()
                .header(ContentType::TEXT_HTML)
                .body(html_body)
        )
        .map_err(|e| AppError::InternalServerError(format!("Email build error: {}", e)))?;

    let credentials = Credentials::new(gmail_user.to_string(), gmail_password.to_string());

    let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay("smtp.gmail.com")
        .map_err(|e| AppError::InternalServerError(format!("SMTP client error: {}", e)))?
        .credentials(credentials)
        .build();

    match mailer.send(email).await {
        Ok(_) => {
            tracing::info!("Verification email sent successfully to {}", to_email);
            Ok(())
        }
        Err(e) => {
            tracing::error!("Failed to send verification email to {}: {}", to_email, e);
            Err(AppError::InternalServerError(format!("Failed to send email: {}", e)))
        }
    }
}

pub fn generate_id() -> String {
    uuid::Uuid::new_v4().to_string()
}
