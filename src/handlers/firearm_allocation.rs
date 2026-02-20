use axum::{
    extract::{State, Path},
    http::StatusCode,
    Json,
};
use sqlx::{PgPool, Row};
use std::sync::Arc;
use serde_json::json;

use crate::{
    error::{AppError, AppResult},
    models::{FirearmAllocation, GuardAllocationView, IssueFirearmRequest, ReturnFirearmRequest},
    utils,
};

pub async fn issue_firearm(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<IssueFirearmRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if payload.firearm_id.is_empty() || payload.guard_id.is_empty() {
        return Err(AppError::BadRequest(
            "Firearm ID and Guard ID are required".to_string()
        ));
    }

    // Check if firearm exists
    let _firearm = sqlx::query("SELECT id FROM firearms WHERE id = $1")
        .bind(&payload.firearm_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Firearm not found".to_string()))?;

    // Check if guard exists
    let _guard = sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&payload.guard_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Guard not found".to_string()))?;

    let allocation_id = utils::generate_id();

    // Create allocation
    sqlx::query(
        "INSERT INTO firearm_allocations (id, guard_id, firearm_id, allocation_date, status) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'active')"
    )
    .bind(&allocation_id)
    .bind(&payload.guard_id)
    .bind(&payload.firearm_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create allocation: {}", e)))?;

    // Update firearm status
    sqlx::query(
        "UPDATE firearms SET status = 'allocated', updated_at = CURRENT_TIMESTAMP WHERE id = $1"
    )
    .bind(&payload.firearm_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to update firearm: {}", e)))?;

    Ok((StatusCode::CREATED, Json(json!({
        "message": "Firearm allocated successfully",
        "allocationId": allocation_id
    }))))
}

pub async fn return_firearm(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<ReturnFirearmRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.allocation_id.is_empty() {
        return Err(AppError::BadRequest(
            "Allocation ID is required".to_string()
        ));
    }

    // Get the allocation
    let allocation = sqlx::query(
        "SELECT firearm_id FROM firearm_allocations WHERE id = $1"
    )
    .bind(&payload.allocation_id)
    .fetch_optional(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
    .ok_or_else(|| AppError::NotFound("Allocation not found".to_string()))?;

    // Update allocation
    sqlx::query(
        "UPDATE firearm_allocations SET return_date = CURRENT_TIMESTAMP, status = 'returned', updated_at = CURRENT_TIMESTAMP WHERE id = $1"
    )
    .bind(&payload.allocation_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    // Update firearm status back to available
    let firearm_id: String = allocation.get("firearm_id");
    sqlx::query(
        "UPDATE firearms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1"
    )
    .bind(&firearm_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "message": "Firearm returned successfully"
    })))
}

pub async fn get_guard_allocations(
    State(db): State<Arc<PgPool>>,
    Path(guard_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let allocations = sqlx::query_as::<_, GuardAllocationView>(
        r#"
        SELECT fa.id, fa.guard_id, fa.firearm_id, fa.allocation_date, fa.return_date, fa.status, fa.created_at, fa.updated_at,
               f.model AS firearm_model, f.caliber AS firearm_caliber, f.serial_number AS firearm_serial_number
        FROM firearm_allocations fa
        JOIN firearms f ON f.id = fa.firearm_id
        WHERE fa.guard_id = $1 AND fa.status = 'active'
        ORDER BY fa.allocation_date DESC
        "#,
    )
    .bind(&guard_id)
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": allocations.len(),
        "allocations": allocations
    })))
}

pub async fn get_active_allocations(
    State(db): State<Arc<PgPool>>,
) -> AppResult<Json<serde_json::Value>> {
    let allocations = sqlx::query_as::<_, FirearmAllocation>(
        "SELECT id, guard_id, firearm_id, allocation_date, return_date, status, created_at, updated_at FROM firearm_allocations WHERE status = 'active'"
    )
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": allocations.len(),
        "allocations": allocations
    })))
}

pub async fn get_all_allocations(
    State(db): State<Arc<PgPool>>,
) -> AppResult<Json<serde_json::Value>> {
    let allocations = sqlx::query_as::<_, FirearmAllocation>(
        "SELECT id, guard_id, firearm_id, allocation_date, return_date, status, created_at, updated_at FROM firearm_allocations ORDER BY allocation_date DESC"
    )
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": allocations.len(),
        "allocations": allocations
    })))
}

