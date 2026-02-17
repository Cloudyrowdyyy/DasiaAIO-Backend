use std::env;

pub struct Config {
    pub server_host: String,
    pub server_port: u16,
    pub database_url: String,
    pub gmail_user: String,
    pub gmail_password: String,
    pub admin_code: String,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        Ok(Config {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "5000".to_string())
                .parse()
                .map_err(|_| "SERVER_PORT must be a valid number".to_string())?,
            database_url: env::var("DATABASE_URL")
                .map_err(|_| "DATABASE_URL must be set".to_string())?,
            gmail_user: env::var("GMAIL_USER").unwrap_or_else(|_| "no-reply@example.com".to_string()),
            gmail_password: env::var("GMAIL_PASSWORD").unwrap_or_else(|_| "dummy-password".to_string()),
            admin_code: env::var("ADMIN_CODE").unwrap_or_else(|_| "122601".to_string()),
        })
    }
}
