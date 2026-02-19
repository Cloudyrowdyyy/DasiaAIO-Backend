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
        .route("/api/guard-replacement/shifts", get(handlers::guard_replacement::get_all_shifts))
        .route("/api/guard-replacement/shifts/:shift_id", put(handlers::guard_replacement::update_shift))
        .route("/api/guard-replacement/shifts/:shift_id", delete(handlers::guard_replacement::delete_shift))
        .route("/api/guard-replacement/guard/:guard_id/shifts", get(handlers::guard_replacement::get_guard_shifts))
        .route("/api/guard-replacement/attendance/check-in", post(handlers::guard_replacement::check_in))
        .route("/api/guard-replacement/attendance/check-out", post(handlers::guard_replacement::check_out))
        .route("/api/attendance/:guard_id", get(handlers::guard_replacement::get_guard_attendance))
        .route("/api/guard-replacement/detect-no-shows", post(handlers::guard_replacement::detect_no_shows))
        .route("/api/guard-replacement/request-replacement", post(handlers::guard_replacement::request_replacement))
        .route("/api/guard-replacement/set-availability", post(handlers::guard_replacement::set_availability))

        // Mission assignment routes (Integrated Workflow)
        .route("/api/missions/assign", post(handlers::missions::assign_mission))
        .route("/api/missions", get(handlers::missions::get_missions))

        // Guard permits routes
        .route("/api/guard-firearm-permits", post(handlers::permits::create_guard_permit))
        .route("/api/guard-firearm-permits/:guard_id", get(handlers::permits::get_guard_permits))

        // Support tickets routes
        .route("/api/support-tickets", post(handlers::support_tickets::create_ticket))
        .route("/api/support-tickets/:guard_id", get(handlers::support_tickets::get_guard_tickets))
        
        // Armored car routes
        .route("/api/armored-cars", post(handlers::armored_cars::add_armored_car))
        .route("/api/armored-cars", get(handlers::armored_cars::get_all_armored_cars))
        .route("/api/armored-cars/:id", get(handlers::armored_cars::get_armored_car_by_id))
        .route("/api/armored-cars/:id", put(handlers::armored_cars::update_armored_car))
        .route("/api/armored-cars/:id", delete(handlers::armored_cars::delete_armored_car))
        
        // Car allocation routes
        .route("/api/car-allocation/issue", post(handlers::armored_cars::issue_car))
        .route("/api/car-allocation/return", post(handlers::armored_cars::return_car))
        .route("/api/car-allocations/:car_id", get(handlers::armored_cars::get_car_allocations))
        .route("/api/car-allocations/active", get(handlers::armored_cars::get_active_car_allocations))
        
        // Car maintenance routes
        .route("/api/car-maintenance/schedule", post(handlers::armored_cars::schedule_maintenance))
        .route("/api/car-maintenance/:maintenance_id/complete", post(handlers::armored_cars::complete_maintenance))
        .route("/api/car-maintenance/:car_id", get(handlers::armored_cars::get_car_maintenance_records))
        
        // Driver assignment routes
        .route("/api/driver-assignment/assign", post(handlers::armored_cars::assign_driver))
        .route("/api/driver-assignment/:assignment_id/unassign", post(handlers::armored_cars::unassign_driver))
        .route("/api/car-drivers/:car_id", get(handlers::armored_cars::get_car_drivers))
        
        // Trip management routes
        .route("/api/trips", post(handlers::armored_cars::create_trip))
        .route("/api/trips/end", post(handlers::armored_cars::end_trip))
        .route("/api/trips/car/:car_id", get(handlers::armored_cars::get_car_trips))
        .route("/api/trips", get(handlers::armored_cars::get_all_trips))
        
        // Enhanced trip management routes
        .route("/api/trip-management/active", get(handlers::trip_management::get_active_trips))
        .route("/api/trip-management/:trip_id", get(handlers::trip_management::get_trip_details))
        .route("/api/trip-management/:trip_id/status", put(handlers::trip_management::update_trip_status))
        .route("/api/trip-management/assign-driver", post(handlers::trip_management::assign_driver_to_trip))
        .route("/api/trip-management/driver-assignments", get(handlers::trip_management::get_driver_assignments))
        
        // Analytics routes
        .route("/api/analytics", get(handlers::analytics::get_analytics))
        .route("/api/analytics/trends", get(handlers::analytics::get_performance_trends))
        .route("/api/analytics/mission-status", put(handlers::analytics::update_mission_status))
        
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
