use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// User role enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum UserRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "admin")]
    Admin,
    #[serde(rename = "superadmin")]
    Superadmin,
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::User => write!(f, "user"),
            UserRole::Admin => write!(f, "admin"),
            UserRole::Superadmin => write!(f, "superadmin"),
        }
    }
}

impl std::str::FromStr for UserRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "user" => Ok(UserRole::User),
            "admin" => Ok(UserRole::Admin),
            "superadmin" => Ok(UserRole::Superadmin),
            _ => Err(format!("Unknown role: {}", s)),
        }
    }
}

// User model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub role: String,
    pub full_name: String,
    pub phone_number: String,
    pub license_number: Option<String>,
    pub license_expiry_date: Option<DateTime<Utc>>,
    pub verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// User creation request
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    pub username: String,
    pub role: String,
    pub full_name: String,
    pub phone_number: String,
    pub license_number: Option<String>,
    pub license_expiry_date: Option<DateTime<Utc>>,
    pub admin_code: Option<String>,
}

// User response (without password)
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub username: String,
    pub role: String,
    pub full_name: String,
    pub phone_number: String,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        UserResponse {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            full_name: user.full_name,
            phone_number: user.phone_number,
        }
    }
}

// Verification model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Verification {
    pub id: String,
    pub user_id: String,
    pub code: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

// Firearm status enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FirearmStatus {
    Available,
    Allocated,
    Maintenance,
}

impl std::fmt::Display for FirearmStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FirearmStatus::Available => write!(f, "available"),
            FirearmStatus::Allocated => write!(f, "allocated"),
            FirearmStatus::Maintenance => write!(f, "maintenance"),
        }
    }
}

// Firearm model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Firearm {
    pub id: String,
    pub name: String,
    pub serial_number: String,
    pub model: String,
    pub caliber: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFirearmRequest {
    pub serial_number: String,
    pub model: String,
    pub caliber: String,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFirearmRequest {
    pub status: Option<String>,
    pub caliber: Option<String>,
}

// Firearm Allocation model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct FirearmAllocation {
    pub id: String,
    pub guard_id: String,
    pub firearm_id: String,
    pub allocation_date: DateTime<Utc>,
    pub return_date: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct IssueFirearmRequest {
    pub firearm_id: String,
    pub guard_id: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReturnFirearmRequest {
    pub allocation_id: String,
}

// Attendance model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Attendance {
    pub id: String,
    pub guard_id: String,
    pub shift_id: String,
    pub check_in_time: DateTime<Utc>,
    pub check_out_time: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Authentication requests
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub identifier: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct VerifyEmailRequest {
    pub email: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct ResendCodeRequest {
    pub email: String,
}

// Guard Replacement related models
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Shift {
    pub id: String,
    pub guard_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub client_site: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateShiftRequest {
    pub guard_id: String,
    pub start_time: String,
    pub end_time: String,
    pub client_site: String,
}

#[derive(Debug, Deserialize)]
pub struct CheckInRequest {
    pub guard_id: String,
    pub shift_id: String,
}

#[derive(Debug, Deserialize)]
pub struct CheckOutRequest {
    pub attendance_id: String,
}

#[derive(Debug, Deserialize)]
pub struct RequestReplacementRequest {
    pub original_guard_id: String,
    pub replacement_guard_id: String,
    pub shift_id: String,
}

#[derive(Debug, Deserialize)]
pub struct SetAvailabilityRequest {
    pub guard_id: String,
    pub is_available: bool,
    pub available_from: Option<DateTime<Utc>>,
    pub available_until: Option<DateTime<Utc>>,
}
