use sqlx::postgres::{PgPool, PgPoolOptions};
use crate::error::{AppError, AppResult};

pub async fn init_db_pool(database_url: &str) -> AppResult<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to connect to database: {}", e)))?;

    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> AppResult<()> {
    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            full_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            license_number VARCHAR(50),
            license_expiry_date TIMESTAMP WITH TIME ZONE,
            verified BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create users table: {}", e)))?;

    // Create verifications table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS verifications (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create verifications table: {}", e)))?;

    // Create firearms table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS firearms (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            serial_number VARCHAR(255) NOT NULL UNIQUE,
            model VARCHAR(255) NOT NULL,
            caliber VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'available',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create firearms table: {}", e)))?;

    // Create firearm_allocations table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS firearm_allocations (
            id VARCHAR(36) PRIMARY KEY,
            guard_id VARCHAR(36) NOT NULL,
            firearm_id VARCHAR(36) NOT NULL,
            allocation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            return_date TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (firearm_id) REFERENCES firearms(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create firearm_allocations table: {}", e)))?;

    // Create shifts table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS shifts (
            id VARCHAR(36) PRIMARY KEY,
            guard_id VARCHAR(36) NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            client_site VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create shifts table: {}", e)))?;

    // Create attendance table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS attendance (
            id VARCHAR(36) PRIMARY KEY,
            guard_id VARCHAR(36) NOT NULL,
            shift_id VARCHAR(36) NOT NULL,
            check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
            check_out_time TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) NOT NULL DEFAULT 'checked_in',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create attendance table: {}", e)))?;

    // Create armored_cars table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS armored_cars (
            id VARCHAR(36) PRIMARY KEY,
            license_plate VARCHAR(50) NOT NULL UNIQUE,
            vin VARCHAR(100) NOT NULL UNIQUE,
            model VARCHAR(255) NOT NULL,
            manufacturer VARCHAR(255) NOT NULL,
            capacity_kg INTEGER NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'available',
            registration_expiry TIMESTAMP WITH TIME ZONE,
            insurance_expiry TIMESTAMP WITH TIME ZONE,
            last_maintenance_date TIMESTAMP WITH TIME ZONE,
            mileage INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create armored_cars table: {}", e)))?;

    // Create car_allocations table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS car_allocations (
            id VARCHAR(36) PRIMARY KEY,
            car_id VARCHAR(36) NOT NULL,
            client_id VARCHAR(255) NOT NULL,
            allocation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            return_date TIMESTAMP WITH TIME ZONE,
            expected_return_date TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            notes VARCHAR(1000),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES armored_cars(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create car_allocations table: {}", e)))?;

    // Create car_maintenance table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS car_maintenance (
            id VARCHAR(36) PRIMARY KEY,
            car_id VARCHAR(36) NOT NULL,
            maintenance_type VARCHAR(100) NOT NULL,
            description VARCHAR(1000) NOT NULL,
            cost DECIMAL(10, 2),
            scheduled_date TIMESTAMP WITH TIME ZONE,
            completion_date TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
            notes VARCHAR(1000),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES armored_cars(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create car_maintenance table: {}", e)))?;

    // Create driver_assignments table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS driver_assignments (
            id VARCHAR(36) PRIMARY KEY,
            car_id VARCHAR(36) NOT NULL,
            guard_id VARCHAR(36) NOT NULL,
            assignment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            end_date TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES armored_cars(id) ON DELETE CASCADE,
            FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create driver_assignments table: {}", e)))?;

    // Create trips table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS trips (
            id VARCHAR(36) PRIMARY KEY,
            car_id VARCHAR(36) NOT NULL,
            driver_id VARCHAR(36) NOT NULL,
            allocation_id VARCHAR(36),
            start_location VARCHAR(500) NOT NULL,
            end_location VARCHAR(500),
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE,
            distance_km DECIMAL(10, 2),
            status VARCHAR(50) NOT NULL DEFAULT 'in_transit',
            mission_details VARCHAR(1000),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES armored_cars(id) ON DELETE CASCADE,
            FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (allocation_id) REFERENCES car_allocations(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create trips table: {}", e)))?;

    // Create guard_firearm_permits table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS guard_firearm_permits (
            id VARCHAR(36) PRIMARY KEY,
            guard_id VARCHAR(36) NOT NULL,
            firearm_id VARCHAR(36),
            permit_type VARCHAR(100) NOT NULL,
            issued_date TIMESTAMP WITH TIME ZONE NOT NULL,
            expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (firearm_id) REFERENCES firearms(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create guard_firearm_permits table: {}", e)))?;

    // Create support_tickets table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(36) PRIMARY KEY,
            guard_id VARCHAR(36) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'open',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guard_id) REFERENCES users(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create support_tickets table: {}", e)))?;

    Ok(())
}
