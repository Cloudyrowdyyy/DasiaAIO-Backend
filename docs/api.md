---
layout: default
title: API Reference
---

# API Reference

Base URL: `http://localhost:5000/api`

---

## Authentication Endpoints

### Register
```
POST /api/register
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "password123",
  "username": "username",
  "full_name": "Full Name",
  "phone_number": "+63-555-123-4567",
  "role": "user"
}
```

### Login
```
POST /api/login
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "password123"
}

Response:
{
  "id": "uuid",
  "email": "user@gmail.com",
  "role": "user"
}
```

### Verify Email
```
POST /api/verify
Content-Type: application/json

{
  "email": "user@gmail.com",
  "code": "123456"
}
```

---

## User Management

### Get All Users
```
GET /api/users
```

### Get User by ID
```
GET /api/user/:id
```

### Update User
```
PUT /api/user/:id
Content-Type: application/json

{
  "full_name": "New Name",
  "phone_number": "+63-555-999-9999"
}
```

### Delete User
```
DELETE /api/user/:id
```

---

## Firearm Management

### Get All Firearms
```
GET /api/firearms
```

### Add Firearm
```
POST /api/firearms
Content-Type: application/json

{
  "serialNumber": "SN123456",
  "model": "Glock 19",
  "type": "Pistol",
  "status": "available"
}
```

### Update Firearm
```
PUT /api/firearms/:id
Content-Type: application/json

{
  "status": "maintenance"
}
```

### Delete Firearm
```
DELETE /api/firearms/:id
```

---

## Allocations

### Issue Firearm
```
POST /api/firearm-allocation/issue
Content-Type: application/json

{
  "guardId": "uuid",
  "firearmId": "uuid"
}
```

### Return Firearm
```
POST /api/firearm-allocation/return
Content-Type: application/json

{
  "allocationId": "uuid"
}
```

### Get Active Allocations
```
GET /api/firearm-allocations/active
```

---

## Health Check
```
GET /api/health
```

---

[← Back to Home](/)
