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
        // Railway injects the assigned port as `PORT`.
        // `SERVER_PORT` is our own alias (set in railway.json as `$PORT`).
        // Check in order: PORT → SERVER_PORT → default 5000.
        let port_str = env::var("PORT")
            .or_else(|_| env::var("SERVER_PORT"))
            .unwrap_or_else(|_| "5000".to_string());

        Ok(Config {
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            server_port: port_str
                .parse()
                .map_err(|_| format!("PORT '{}' must be a valid number", port_str))?,
            database_url: env::var("DATABASE_PRIVATE_URL")
                .or_else(|_| env::var("DATABASE_URL"))
                .map_err(|_| "DATABASE_URL (or DATABASE_PRIVATE_URL) must be set. On Railway, add DATABASE_URL = ${{Postgres.DATABASE_URL}} to the backend service variables.".to_string())?,
            gmail_user: env::var("GMAIL_USER").unwrap_or_else(|_| "no-reply@example.com".to_string()),
            gmail_password: env::var("GMAIL_PASSWORD").unwrap_or_else(|_| "dummy-password".to_string()),
            admin_code: env::var("ADMIN_CODE").unwrap_or_else(|_| "122601".to_string()),
        })
    }
}

