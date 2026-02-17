mod db;
mod handlers;
mod models;
mod routes;
mod utils;
mod error;
mod config;

use axum::{
    extract::DefaultBodyLimit,
    http::{header, Method},
    routing::{get, post, put, delete},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv::dotenv().ok();
    let config = config::Config::from_env()?;

    // Initialize database pool
    let db_pool = db::init_db_pool(&config.database_url).await?;
    tracing::info!("✓ Connected to PostgreSQL");

    // Run migrations
    db::run_migrations(&db_pool).await?;
    tracing::info!("✓ Database migrations completed");

    let db = Arc::new(db_pool);

    // CORS configuration
    let cors_layer = CorsLayer::very_permissive();

    // Build router
    let app = Router::new()
        // Auth routes
        .route("/api/register", post(handlers::auth::register))
        .route("/api/login", post(handlers::auth::login))
        .route("/api/verify", post(handlers::auth::verify_email))
        .route("/api/resend-code", post(handlers::auth::resend_verification_code))
        
        // User routes
        .route("/api/users", get(handlers::users::get_all_users))
        .route("/api/user/:id", get(handlers::users::get_user_by_id))
        .route("/api/user/:id", put(handlers::users::update_user))
        .route("/api/user/:id", delete(handlers::users::delete_user))
        
        // Firearm routes
        .route("/api/firearms", post(handlers::firearms::add_firearm))
        .route("/api/firearms", get(handlers::firearms::get_all_firearms))
        .route("/api/firearms/:id", get(handlers::firearms::get_firearm_by_id))
        .route("/api/firearms/:id", put(handlers::firearms::update_firearm))
        .route("/api/firearms/:id", delete(handlers::firearms::delete_firearm))
        
        // Firearm allocation routes
        .route("/api/firearm-allocation/issue", post(handlers::firearm_allocation::issue_firearm))
        .route("/api/firearm-allocation/return", post(handlers::firearm_allocation::return_firearm))
        .route("/api/guard-allocations/:guard_id", get(handlers::firearm_allocation::get_guard_allocations))
        .route("/api/firearm-allocations/active", get(handlers::firearm_allocation::get_active_allocations))
        
        // Guard replacement routes
        .route("/api/guard-replacement/shifts", post(handlers::guard_replacement::create_shift))
        .route("/api/guard-replacement/attendance/check-in", post(handlers::guard_replacement::check_in))
        .route("/api/guard-replacement/attendance/check-out", post(handlers::guard_replacement::check_out))
        .route("/api/guard-replacement/detect-no-shows", post(handlers::guard_replacement::detect_no_shows))
        .route("/api/guard-replacement/request-replacement", post(handlers::guard_replacement::request_replacement))
        .route("/api/guard-replacement/set-availability", post(handlers::guard_replacement::set_availability))
        
        // Health check
        .route("/api/health", get(handlers::health::health_check))
        
        .layer(cors_layer)
        .layer(TraceLayer::new_for_http())
        .layer(DefaultBodyLimit::max(1024 * 1024)) // 1MB limit
        .with_state(db);

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", config.server_host, config.server_port))
        .await?;
    
    tracing::info!("✓ Server running on http://{}:{}", config.server_host, config.server_port);
    
    axum::serve(listener, app).await?;

    Ok(())
}
