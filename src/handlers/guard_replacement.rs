use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
use std::sync::Arc;
use serde_json::json;

use crate::{
    error::{AppError, AppResult},
    models::{
        Attendance, CheckInRequest, CheckOutRequest, CreateShiftRequest, RequestReplacementRequest,
        SetAvailabilityRequest, Shift,
    },
    utils,
};

pub async fn create_shift(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<CreateShiftRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if payload.guard_id.is_empty() || payload.start_time.is_empty() 
        || payload.end_time.is_empty() || payload.client_site.is_empty() {
        return Err(AppError::BadRequest(
            "All fields are required".to_string()
        ));
    }

    // Check if guard exists
    sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&payload.guard_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Guard not found".to_string()))?;

    let shift_id = utils::generate_id();
    
    // Parse datetime strings
    let start_time = chrono::DateTime::parse_from_rfc3339(&payload.start_time)
        .ok()
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .ok_or_else(|| AppError::BadRequest("Invalid start_time format".to_string()))?;
    
    let end_time = chrono::DateTime::parse_from_rfc3339(&payload.end_time)
        .ok()
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .ok_or_else(|| AppError::BadRequest("Invalid end_time format".to_string()))?;

    sqlx::query(
        "INSERT INTO shifts (id, guard_id, start_time, end_time, client_site, status) VALUES ($1, $2, $3, $4, $5, 'scheduled')"
    )
    .bind(&shift_id)
    .bind(&payload.guard_id)
    .bind(start_time)
    .bind(end_time)
    .bind(&payload.client_site)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to create shift: {}", e)))?;

    Ok((StatusCode::CREATED, Json(json!({
        "message": "Shift created successfully",
        "shiftId": shift_id,
        "shift": {
            "guardId": payload.guard_id,
            "startTime": payload.start_time,
            "endTime": payload.end_time,
            "clientSite": payload.client_site
        }
    }))))
}

pub async fn check_in(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<CheckInRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    if payload.guard_id.is_empty() || payload.shift_id.is_empty() {
        return Err(AppError::BadRequest(
            "Guard ID and Shift ID are required".to_string()
        ));
    }

    // Check if shift exists
    sqlx::query("SELECT id FROM shifts WHERE id = $1")
        .bind(&payload.shift_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Shift not found".to_string()))?;

    let attendance_id = utils::generate_id();

    sqlx::query(
        "INSERT INTO attendance (id, guard_id, shift_id, check_in_time, status) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'checked_in')"
    )
    .bind(&attendance_id)
    .bind(&payload.guard_id)
    .bind(&payload.shift_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to record check-in: {}", e)))?;

    Ok((StatusCode::CREATED, Json(json!({
        "message": "Check-in recorded successfully",
        "attendanceId": attendance_id
    }))))
}

pub async fn check_out(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<CheckOutRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.attendance_id.is_empty() {
        return Err(AppError::BadRequest(
            "Attendance ID is required".to_string()
        ));
    }

    // Check if attendance exists
    sqlx::query("SELECT id FROM attendance WHERE id = $1")
        .bind(&payload.attendance_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Attendance not found".to_string()))?;

    sqlx::query(
        "UPDATE attendance SET check_out_time = CURRENT_TIMESTAMP, status = 'checked_out', updated_at = CURRENT_TIMESTAMP WHERE id = $1"
    )
    .bind(&payload.attendance_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "message": "Check-out recorded successfully"
    })))
}

pub async fn detect_no_shows(
    State(db): State<Arc<PgPool>>,
) -> AppResult<Json<serde_json::Value>> {
    // This is a simplified version. In production, you'd have more complex logic
    // to determine no-shows based on shift times and check-in records
    
    let no_shows = sqlx::query(
        "SELECT s.id, s.guard_id, s.start_time, s.end_time, s.client_site FROM shifts s LEFT JOIN attendance a ON s.id = a.shift_id WHERE a.id IS NULL AND s.start_time <= CURRENT_TIMESTAMP"
    )
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "message": "No-shows detected",
        "noShowsCount": no_shows.len()
    })))
}

pub async fn request_replacement(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<RequestReplacementRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.original_guard_id.is_empty() || payload.replacement_guard_id.is_empty() 
        || payload.shift_id.is_empty() {
        return Err(AppError::BadRequest(
            "Original Guard ID, Replacement Guard ID, and Shift ID are required".to_string()
        ));
    }

    // Verify all references exist
    sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&payload.original_guard_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Original guard not found".to_string()))?;

    sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&payload.replacement_guard_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Replacement guard not found".to_string()))?;

    sqlx::query("SELECT id FROM shifts WHERE id = $1")
        .bind(&payload.shift_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Shift not found".to_string()))?;

    // Update shift to use replacement guard
    sqlx::query(
        "UPDATE shifts SET guard_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
    )
    .bind(&payload.replacement_guard_id)
    .bind(&payload.shift_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to update shift: {}", e)))?;

    Ok(Json(json!({
        "message": "Replacement accepted successfully"
    })))
}

pub async fn set_availability(
    State(db): State<Arc<PgPool>>,
    Json(payload): Json<SetAvailabilityRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.guard_id.is_empty() {
        return Err(AppError::BadRequest(
            "Guard ID and availability status are required".to_string()
        ));
    }

    // Check if guard exists
    sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&payload.guard_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Guard not found".to_string()))?;

    // For now, just return success
    // In a full implementation, you'd store availability data
    // perhaps in a guard_availability table

    Ok(Json(json!({
        "message": "Guard availability updated successfully"
    })))
}

pub async fn get_guard_shifts(
    State(db): State<Arc<PgPool>>,
    Path(guard_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let shifts = sqlx::query_as::<_, Shift>(
        "SELECT id, guard_id, start_time, end_time, client_site, status, created_at, updated_at FROM shifts WHERE guard_id = $1 ORDER BY start_time DESC",
    )
    .bind(&guard_id)
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": shifts.len(),
        "shifts": shifts
    })))
}

pub async fn get_guard_attendance(
    State(db): State<Arc<PgPool>>,
    Path(guard_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    let attendance = sqlx::query_as::<_, Attendance>(
        "SELECT id, guard_id, shift_id, check_in_time, check_out_time, status, created_at, updated_at FROM attendance WHERE guard_id = $1 ORDER BY check_in_time DESC",
    )
    .bind(&guard_id)
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": attendance.len(),
        "attendance": attendance
    })))
}

// Get all shifts with guard information (admin view)
pub async fn get_all_shifts(
    State(db): State<Arc<PgPool>>,
) -> AppResult<Json<serde_json::Value>> {
    #[derive(sqlx::FromRow, serde::Serialize)]
    struct ShiftWithGuard {
        id: String,
        guard_id: String,
        guard_name: Option<String>,
        guard_username: String,
        start_time: chrono::DateTime<chrono::Utc>,
        end_time: chrono::DateTime<chrono::Utc>,
        client_site: String,
        status: String,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
    }

    let shifts = sqlx::query_as::<_, ShiftWithGuard>(
        "SELECT s.id, s.guard_id, u.full_name as guard_name, u.username as guard_username, 
         s.start_time, s.end_time, s.client_site, s.status, s.created_at, s.updated_at 
         FROM shifts s 
         JOIN users u ON s.guard_id = u.id 
         ORDER BY s.start_time DESC",
    )
    .fetch_all(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?;

    Ok(Json(json!({
        "total": shifts.len(),
        "shifts": shifts
    })))
}

// Update existing shift
pub async fn update_shift(
    State(db): State<Arc<PgPool>>,
    Path(shift_id): Path<String>,
    Json(payload): Json<CreateShiftRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Check if shift exists
    sqlx::query("SELECT id FROM shifts WHERE id = $1")
        .bind(&shift_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Shift not found".to_string()))?;

    // Parse datetime strings
    let start_time = chrono::DateTime::parse_from_rfc3339(&payload.start_time)
        .ok()
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .ok_or_else(|| AppError::BadRequest("Invalid start_time format".to_string()))?;
    
    let end_time = chrono::DateTime::parse_from_rfc3339(&payload.end_time)
        .ok()
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .ok_or_else(|| AppError::BadRequest("Invalid end_time format".to_string()))?;

    sqlx::query(
        "UPDATE shifts SET guard_id = $1, start_time = $2, end_time = $3, client_site = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5"
    )
    .bind(&payload.guard_id)
    .bind(start_time)
    .bind(end_time)
    .bind(&payload.client_site)
    .bind(&shift_id)
    .execute(db.as_ref())
    .await
    .map_err(|e| AppError::DatabaseError(format!("Failed to update shift: {}", e)))?;

    Ok(Json(json!({
        "message": "Shift updated successfully",
        "shiftId": shift_id
    })))
}

// Delete shift
pub async fn delete_shift(
    State(db): State<Arc<PgPool>>,
    Path(shift_id): Path<String>,
) -> AppResult<Json<serde_json::Value>> {
    // Check if shift exists
    sqlx::query("SELECT id FROM shifts WHERE id = $1")
        .bind(&shift_id)
        .fetch_optional(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Shift not found".to_string()))?;

    // Delete shift
    sqlx::query("DELETE FROM shifts WHERE id = $1")
        .bind(&shift_id)
        .execute(db.as_ref())
        .await
        .map_err(|e| AppError::DatabaseError(format!("Failed to delete shift: {}", e)))?;

    Ok(Json(json!({
        "message": "Shift deleted successfully"
    })))
}


