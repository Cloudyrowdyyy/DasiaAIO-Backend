use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;

use crate::{
    error::{AppError, AppResult},
    models::{CreateGuardFirearmPermitRequest, GuardFirearmPermit},
    utils,
};

pub async fn get_guard_permits(
    State(db): State<Arc<PgPool>>,
    Path(guard_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let permits = sqlx::query_as::<_, GuardFirearmPermit>(
        "SELECT id, guard_id, firearm_id, permit_type, issued_date, expiry_date, status, created_at, updated_at FROM guard_firearm_permits WHERE guard_id = $1 ORDER BY issued_date DESC",
    )
    .bind(&guard_id)
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": permits.len(),
        "permits": permits
    })))
}

pub async fn create_guard_permit(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<CreateGuardFirearmPermitRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if payload.guard_id.is_empty() || payload.permit_type.is_empty() {
        return Err(AppError::BadRequest(
            "Guard ID and permit type are required".to_string(),
        ));
    }

    let id = utils::generate_id();
    let status = payload.status.as_deref().unwrap_or("active");

    sqlx::query(
        "INSERT INTO guard_firearm_permits (id, guard_id, firearm_id, permit_type, issued_date, expiry_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(&id)
    .bind(&payload.guard_id)
    .bind(&payload.firearm_id)
    .bind(&payload.permit_type)
    .bind(&payload.issued_date)
    .bind(&payload.expiry_date)
    .bind(status)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create permit: {}", e)))?;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "message": "Permit created successfully",
            "permitId": id
        })),
    ))
}
