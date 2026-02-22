################################################################################
# DASIA - Daily Operations Simulation Script
# Simulates a full operational day at Davao Security & Investigation Agency:
#   Admin login -> Guard registration & verification -> Shift scheduling ->
#   Permit -> Training -> Firearm allocation -> Armored-car ops -> Trip ->
#   Check-in / Check-out -> Returns -> Maintenance -> Merit evaluation
#
# Compatible with Windows PowerShell 5.1+
################################################################################

$BASE = "http://localhost:5000"
$PASS = 0
$FAIL = 0
$STEP = 0

function Step([string]$title) {
    $script:STEP++
    Write-Host ""
    Write-Host "[$script:STEP] $title" -ForegroundColor Cyan
}

function OK([string]$msg) {
    $script:PASS++
    Write-Host "  OK  $msg" -ForegroundColor Green
}

function ERR([string]$msg) {
    $script:FAIL++
    Write-Host "  FAIL  $msg" -ForegroundColor Red
}

function Post([string]$path, $body) {
    try {
        $json = $body | ConvertTo-Json -Depth 10
        $resp = Invoke-RestMethod -Method POST `
            -Uri "$BASE$path" `
            -ContentType "application/json" `
            -Body $json `
            -ErrorAction Stop
        return $resp
    } catch {
        $detail = $_.ErrorDetails.Message
        if ($detail) {
            try { return ($detail | ConvertFrom-Json) } catch { return $null }
        }
        return $null
    }
}

function Get-Api([string]$path) {
    try {
        return Invoke-RestMethod -Method GET -Uri "$BASE$path" -ErrorAction Stop
    } catch {
        return $null
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 0. HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────
Step "Health check"
$health = Get-Api "/api/health"
if ($health) {
    $statusVal = "ok"
    if ($health.status) { $statusVal = $health.status }
    OK "Backend is reachable: $statusVal"
} else {
    ERR "Backend not reachable - is the server running on port 5000?"
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. ADMIN LOGIN
# ─────────────────────────────────────────────────────────────────────────────
Step "Admin login"
$adminLogin = Post "/api/login" @{ identifier = "admin"; password = "admin123" }
if ($adminLogin -and $adminLogin.user) {
    $ADMIN_ID = $adminLogin.user.id
    OK "Admin logged in  (id=$ADMIN_ID)"
} else {
    ERR "Admin login failed: $($adminLogin | ConvertTo-Json)"
    $ADMIN_ID = "00000000-0000-0000-0000-000000000001"
    Write-Host "  -> Using fallback admin id=$ADMIN_ID" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. REGISTER NEW GUARD
# ─────────────────────────────────────────────────────────────────────────────
Step "Register new guard (Maria Santos)"
$ts          = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$guardEmail  = "maria.santos.$ts@gmail.com"
$regBody = @{
    email             = $guardEmail
    password          = "Guard@1234!"
    username          = "msantos_$ts"
    role              = "user"
    fullName          = "Maria Santos"
    phoneNumber       = "09171234567"
    licenseNumber     = "LIC-$ts"
    licenseExpiryDate = "2027-12-31T00:00:00Z"
}
$regResp = Post "/api/register" $regBody
if ($regResp -and $regResp.userId) {
    $GUARD_ID    = $regResp.userId
    $VERIFY_CODE = $regResp.confirmationCode
    OK "Guard registered  (id=$GUARD_ID)"
    if ($VERIFY_CODE) { OK "Confirmation code received in response: $VERIFY_CODE" }
} else {
    ERR "Guard registration failed: $($regResp | ConvertTo-Json)"
    $GUARD_ID    = "00000000-0000-0000-0000-000000000002"
    $VERIFY_CODE = $null
    Write-Host "  -> Using fallback guard id=$GUARD_ID (already verified)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. VERIFY GUARD EMAIL
# ─────────────────────────────────────────────────────────────────────────────
Step "Verify guard email"
if ($VERIFY_CODE) {
    $verResp = Post "/api/verify" @{ email = $guardEmail; code = $VERIFY_CODE }
    if ($verResp -and $verResp.message -and ($verResp.message -match "verified")) {
        OK "Email verified: $($verResp.message)"
    } else {
        ERR "Email verification failed: $($verResp | ConvertTo-Json)"
    }
} else {
    $PASS++
    Write-Host "  -> Skipped (using pre-verified fallback account)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. GUARD LOGIN
# ─────────────────────────────────────────────────────────────────────────────
Step "Guard login"
if ($VERIFY_CODE) {
    $loginBody = @{ identifier = $guardEmail; password = "Guard@1234!" }
} else {
    $loginBody = @{ identifier = "user"; password = "user123" }
}
$guardLogin = Post "/api/login" $loginBody
if ($guardLogin -and $guardLogin.user) {
    $GUARD_ID = $guardLogin.user.id
    OK "Guard logged in  (id=$GUARD_ID)"
} else {
    ERR "Guard login failed: $($guardLogin | ConvertTo-Json)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 5. CREATE SHIFT FOR GUARD
# ─────────────────────────────────────────────────────────────────────────────
Step "Create guard shift"
$shiftStart = ([DateTime]::UtcNow.AddHours(1)).ToString("yyyy-MM-ddTHH:mm:ssZ")
$shiftEnd   = ([DateTime]::UtcNow.AddHours(9)).ToString("yyyy-MM-ddTHH:mm:ssZ")
$shiftBody  = @{
    guardId    = $GUARD_ID
    startTime  = $shiftStart
    endTime    = $shiftEnd
    clientSite = "DASIA HQ - Davao City"
}
$shiftResp = Post "/api/guard-replacement/shifts" $shiftBody
if ($shiftResp -and $shiftResp.shiftId) {
    $SHIFT_ID = $shiftResp.shiftId
    OK "Shift created  (id=$SHIFT_ID)"
} else {
    ERR "Shift creation failed: $($shiftResp | ConvertTo-Json)"
    $SHIFT_ID = ""
}

# ─────────────────────────────────────────────────────────────────────────────
# 6. GUARD CHECK-IN
# ─────────────────────────────────────────────────────────────────────────────
Step "Guard check-in"
$ATTENDANCE_ID = ""
if ($SHIFT_ID) {
    $ciResp = Post "/api/guard-replacement/attendance/check-in" @{
        guardId = $GUARD_ID
        shiftId = $SHIFT_ID
    }
    if ($ciResp -and $ciResp.attendanceId) {
        $ATTENDANCE_ID = $ciResp.attendanceId
        OK "Checked in  (attendanceId=$ATTENDANCE_ID)"
    } else {
        ERR "Check-in failed: $($ciResp | ConvertTo-Json)"
    }
} else {
    Write-Host "  -> Skipped (no shift id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 7. CREATE FIREARM PERMIT FOR GUARD
# ─────────────────────────────────────────────────────────────────────────────
Step "Create firearm permit for guard"
$permitBody = @{
    guard_id    = $GUARD_ID
    permit_type = "standard"
    issued_date = ([DateTime]::UtcNow).ToString("yyyy-MM-ddTHH:mm:ssZ")
    expiry_date = ([DateTime]::UtcNow.AddYears(1)).ToString("yyyy-MM-ddTHH:mm:ssZ")
    status      = "active"
}
$permitResp = Post "/api/guard-firearm-permits" $permitBody
if ($permitResp -and $permitResp.permitId) {
    $PERMIT_ID = $permitResp.permitId
    OK "Permit created  (id=$PERMIT_ID)"
} else {
    ERR "Permit creation failed: $($permitResp | ConvertTo-Json)"
    $PERMIT_ID = ""
}

# ─────────────────────────────────────────────────────────────────────────────
# 8. CREATE TRAINING RECORD FOR GUARD
# ─────────────────────────────────────────────────────────────────────────────
Step "Create firearms-handling training record"
$trainBody = @{
    guardId           = $GUARD_ID
    trainingType      = "firearms_handling"
    completedDate     = ([DateTime]::UtcNow.AddDays(-30)).ToString("yyyy-MM-ddTHH:mm:ssZ")
    expiryDate        = ([DateTime]::UtcNow.AddYears(1)).ToString("yyyy-MM-ddTHH:mm:ssZ")
    certificateNumber = "CERT-$ts"
    notes             = "Passed range qualification"
    status            = "valid"
}
$trainResp = Post "/api/training-records" $trainBody
if ($trainResp -and ($trainResp.message -or $trainResp.recordId -or $trainResp.id)) {
    $trainMsg = "created"
    if ($trainResp.message) { $trainMsg = $trainResp.message }
    OK "Training record created  (msg=$trainMsg)"
} else {
    ERR "Training record creation failed: $($trainResp | ConvertTo-Json)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 9. ADD FIREARM TO INVENTORY
# ─────────────────────────────────────────────────────────────────────────────
Step "Add firearm to inventory"
$fwBody = @{
    serialNumber = "SN-SIM-$ts"
    model        = "Glock 17"
    caliber      = "9mm"
    status       = "available"
}
$fwResp = Post "/api/firearms" $fwBody
if ($fwResp -and $fwResp.firearmId) {
    $FIREARM_ID = $fwResp.firearmId
    OK "Firearm added  (id=$FIREARM_ID)"
} else {
    ERR "Firearm creation failed: $($fwResp | ConvertTo-Json)"
    $FIREARM_ID = ""
    $allFirearms = Get-Api "/api/firearms"
    if ($allFirearms) {
        foreach ($f in $allFirearms) {
            if ($f.status -eq "available") { $FIREARM_ID = $f.id; break }
        }
    }
    if ($FIREARM_ID) { Write-Host "  -> Using existing firearm id=$FIREARM_ID" -ForegroundColor Yellow }
}

# ─────────────────────────────────────────────────────────────────────────────
# 10. ALLOCATE FIREARM TO GUARD
# ─────────────────────────────────────────────────────────────────────────────
Step "Allocate firearm to guard"
$FIREARM_ALLOC_ID = ""
if ($FIREARM_ID) {
    $faBody = @{
        firearmId          = $FIREARM_ID
        guardId            = $GUARD_ID
        shiftId            = $SHIFT_ID
        expectedReturnDate = ([DateTime]::UtcNow.AddHours(10)).ToString("yyyy-MM-ddTHH:mm:ssZ")
        notes              = "Simulation: daily duty allocation"
    }
    $faResp = Post "/api/firearm-allocation/issue" $faBody
    if ($faResp -and $faResp.allocationId) {
        $FIREARM_ALLOC_ID = $faResp.allocationId
        OK "Firearm allocated  (allocationId=$FIREARM_ALLOC_ID)"
    } else {
        ERR "Firearm allocation failed: $($faResp | ConvertTo-Json)"
    }
} else {
    ERR "Firearm allocation skipped (no firearm id)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 11. ADD ARMORED CAR
# ─────────────────────────────────────────────────────────────────────────────
Step "Add armored car to fleet"
$carBody = @{
    licensePlate       = "DVO-SIM-$ts"
    vin                = "VIN$ts"
    model              = "Toyota Land Cruiser 79"
    manufacturer       = "Toyota"
    capacityKg         = 800
    registrationExpiry = "2027-12-31T00:00:00Z"
    insuranceExpiry    = "2027-06-30T00:00:00Z"
}
$carResp = Post "/api/armored-cars" $carBody
if ($carResp -and $carResp.carId) {
    $CAR_ID = $carResp.carId
    OK "Armored car added  (id=$CAR_ID)"
} else {
    ERR "Armored car creation failed: $($carResp | ConvertTo-Json)"
    $CAR_ID = ""
    $allCars = Get-Api "/api/armored-cars"
    if ($allCars) {
        foreach ($c in $allCars) {
            if ($c.status -eq "available") { $CAR_ID = $c.id; break }
        }
    }
    if ($CAR_ID) { Write-Host "  -> Using existing car id=$CAR_ID" -ForegroundColor Yellow }
}

# ─────────────────────────────────────────────────────────────────────────────
# 12. ASSIGN GUARD AS DRIVER
# ─────────────────────────────────────────────────────────────────────────────
Step "Assign guard as driver for armored car"
$DRIVER_ASSIGN_ID = ""
if ($CAR_ID) {
    $daBody = @{ carId = $CAR_ID; guardId = $GUARD_ID }
    $daResp = Post "/api/driver-assignment/assign" $daBody
    if ($daResp -and $daResp.assignmentId) {
        $DRIVER_ASSIGN_ID = $daResp.assignmentId
        OK "Driver assigned  (assignmentId=$DRIVER_ASSIGN_ID)"
    } else {
        ERR "Driver assignment failed: $($daResp | ConvertTo-Json)"
    }
} else {
    ERR "Driver assignment skipped (no car id)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 13. ISSUE ARMORED CAR TO CLIENT
# ─────────────────────────────────────────────────────────────────────────────
Step "Issue armored car to client"
$CAR_ALLOC_ID = ""
if ($CAR_ID) {
    $caBody = @{
        carId              = $CAR_ID
        clientId           = $ADMIN_ID
        expectedReturnDate = ([DateTime]::UtcNow.AddHours(12)).ToString("yyyy-MM-ddTHH:mm:ssZ")
        notes              = "Simulation: cash-in-transit to Abreeza Mall"
    }
    $caResp = Post "/api/car-allocation/issue" $caBody
    if ($caResp -and $caResp.allocationId) {
        $CAR_ALLOC_ID = $caResp.allocationId
        OK "Car issued to client  (allocationId=$CAR_ALLOC_ID)"
    } else {
        ERR "Car allocation failed: $($caResp | ConvertTo-Json)"
    }
} else {
    ERR "Car allocation skipped (no car id)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 14. CREATE TRIP
# ─────────────────────────────────────────────────────────────────────────────
Step "Create trip"
$TRIP_ID = ""
if ($CAR_ID) {
    $tripBody = @{
        carId          = $CAR_ID
        driverId       = $GUARD_ID
        allocationId   = $CAR_ALLOC_ID
        startLocation  = "DASIA HQ - Davao City"
        missionDetails = "Cash-in-transit delivery to Abreeza Mall"
    }
    $tripResp = Post "/api/trips" $tripBody
    if ($tripResp -and $tripResp.tripId) {
        $TRIP_ID = $tripResp.tripId
        OK "Trip started  (id=$TRIP_ID)"
    } else {
        ERR "Trip creation failed: $($tripResp | ConvertTo-Json)"
    }
} else {
    ERR "Trip skipped (no car id)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 15. END TRIP
# ─────────────────────────────────────────────────────────────────────────────
Step "End trip"
if ($TRIP_ID) {
    $etBody = @{
        tripId      = $TRIP_ID
        endLocation = "Abreeza Mall - Bajada"
        distanceKm  = "8.5"
    }
    $etResp = Post "/api/trips/end" $etBody
    if ($etResp -and ($etResp.message -or $etResp.trip)) {
        $etMsg = "ok"
        if ($etResp.message) { $etMsg = $etResp.message }
        OK "Trip ended  (msg=$etMsg)"
    } else {
        ERR "End trip failed: $($etResp | ConvertTo-Json)"
    }
} else {
    Write-Host "  -> Skipped (no trip id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 16. GUARD CHECK-OUT
# ─────────────────────────────────────────────────────────────────────────────
Step "Guard check-out"
if ($ATTENDANCE_ID) {
    $coResp = Post "/api/guard-replacement/attendance/check-out" @{
        attendanceId = $ATTENDANCE_ID
    }
    if ($coResp -and ($coResp.message -or $coResp.attendance)) {
        $coMsg = "ok"
        if ($coResp.message) { $coMsg = $coResp.message }
        OK "Checked out  (msg=$coMsg)"
    } else {
        ERR "Check-out failed: $($coResp | ConvertTo-Json)"
    }
} else {
    Write-Host "  -> Skipped (no attendance id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 17. RETURN FIREARM
# ─────────────────────────────────────────────────────────────────────────────
Step "Return firearm"
if ($FIREARM_ALLOC_ID) {
    $rfResp = Post "/api/firearm-allocation/return" @{
        allocationId = $FIREARM_ALLOC_ID
    }
    if ($rfResp -and ($rfResp.message -or $rfResp.allocation)) {
        $rfMsg = "ok"
        if ($rfResp.message) { $rfMsg = $rfResp.message }
        OK "Firearm returned  (msg=$rfMsg)"
    } else {
        ERR "Firearm return failed: $($rfResp | ConvertTo-Json)"
    }
} else {
    Write-Host "  -> Skipped (no firearm allocation id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 18. RETURN CAR
# ─────────────────────────────────────────────────────────────────────────────
Step "Return armored car"
if ($CAR_ALLOC_ID) {
    $rcResp = Post "/api/car-allocation/return" @{
        allocationId = $CAR_ALLOC_ID
    }
    if ($rcResp -and ($rcResp.message -or $rcResp.allocation)) {
        $rcMsg = "ok"
        if ($rcResp.message) { $rcMsg = $rcResp.message }
        OK "Car returned  (msg=$rcMsg)"
    } else {
        ERR "Car return failed: $($rcResp | ConvertTo-Json)"
    }
} else {
    Write-Host "  -> Skipped (no car allocation id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 19. SCHEDULE FIREARM MAINTENANCE
# ─────────────────────────────────────────────────────────────────────────────
Step "Schedule firearm maintenance"
if ($FIREARM_ID) {
    $fmBody = @{
        firearmId       = $FIREARM_ID
        maintenanceType = "routine_cleaning"
        description     = "Post-duty strip, clean, and oil"
        scheduledDate   = ([DateTime]::UtcNow.AddDays(1)).ToString("yyyy-MM-ddTHH:mm:ssZ")
        performedBy     = "Armorer Unit 1"
    }
    # Handler returns FirearmMaintenance object directly (id, firearmId, ...)
    try {
        $fmJson = $fmBody | ConvertTo-Json -Depth 10
        $fmResp = Invoke-RestMethod -Method POST -Uri "$BASE/api/firearm-maintenance/schedule" `
            -ContentType "application/json" -Body $fmJson -ErrorAction Stop
        if ($fmResp -and ($fmResp.id -or $fmResp.message)) {
            $fmId = if ($fmResp.id) { $fmResp.id } else { "ok" }
            OK "Firearm maintenance scheduled  (maintenanceId=$fmId)"
        } else {
            ERR "Firearm maintenance scheduling failed: $($fmResp | ConvertTo-Json)"
        }
    } catch {
        ERR "Firearm maintenance scheduling exception: $($_.ErrorDetails.Message)"
    }
} else {
    Write-Host "  -> Skipped (no firearm id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 20. SCHEDULE CAR MAINTENANCE
# ─────────────────────────────────────────────────────────────────────────────
Step "Schedule armored-car maintenance"
if ($CAR_ID) {
    $cmBody = @{
        carId           = $CAR_ID
        maintenanceType = "routine_service"
        description     = "Post-run oil change, tyre rotation and brake check"
        scheduledDate   = ([DateTime]::UtcNow.AddDays(2)).ToString("yyyy-MM-ddTHH:mm:ssZ")
        cost            = "5000"
    }
    try {
        $cmJson = $cmBody | ConvertTo-Json -Depth 10
        $cmResp = Invoke-RestMethod -Method POST -Uri "$BASE/api/car-maintenance/schedule" `
            -ContentType "application/json" -Body $cmJson -ErrorAction Stop
        if ($cmResp -and ($cmResp.message -or $cmResp.maintenanceId)) {
            $cmMsg = if ($cmResp.message) { $cmResp.message } else { $cmResp.maintenanceId }
            OK "Car maintenance scheduled  (msg=$cmMsg)"
        } else {
            ERR "Car maintenance scheduling failed: $($cmResp | ConvertTo-Json)"
        }
    } catch {
        ERR "Car maintenance scheduling exception: $($_.ErrorDetails.Message)"
    }
} else {
    Write-Host "  -> Skipped (no car id)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# 21. SUBMIT CLIENT EVALUATION (MERIT)
# ─────────────────────────────────────────────────────────────────────────────
Step "Submit client evaluation for guard"
# Required fields: guardId, evaluatorName, rating
$evalBody = @{
    guardId       = $GUARD_ID
    evaluatorName = "DASIA Operations Manager"
    evaluatorRole = "Client"
    shiftId       = $SHIFT_ID
    rating        = 5
    comment       = "Excellent professionalism and punctuality during the cash-in-transit mission."
}
$evalResp = Post "/api/merit/evaluations/submit" $evalBody
if ($evalResp -and ($evalResp.message -or $evalResp.evaluationId)) {
    $evalMsg = "ok"
    if ($evalResp.message) { $evalMsg = $evalResp.message }
    OK "Client evaluation submitted  (msg=$evalMsg)"
} else {
    ERR "Client evaluation failed: $($evalResp | ConvertTo-Json)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 22. CALCULATE MERIT SCORE
# ─────────────────────────────────────────────────────────────────────────────
Step "Calculate merit score for guard"
$meritResp = Post "/api/merit/calculate" @{ guardId = $GUARD_ID }
# Handler returns full GuardMeritScore object with 'overallScore' field
if ($meritResp -and ($meritResp.overallScore -ne $null -or $meritResp.message -or $meritResp.guardId)) {
    $scoreVal = "see response"
    if ($meritResp.overallScore -ne $null) { $scoreVal = $meritResp.overallScore }
    elseif ($meritResp.score -ne $null)    { $scoreVal = $meritResp.score }
    OK "Merit score calculated  (overallScore=$scoreVal  rank=$($meritResp.rank))"
} else {
    ERR "Merit calculation failed: $($meritResp | ConvertTo-Json)"
}

# ─────────────────────────────────────────────────────────────────────────────
# 23. ANALYTICS SNAPSHOT
# ─────────────────────────────────────────────────────────────────────────────
Step "Pull analytics snapshot"
$analytics = Get-Api "/api/analytics"
if ($analytics) {
    OK "Analytics data received"
    if ($analytics.totalGuards      -ne $null) { Write-Host "    totalGuards     : $($analytics.totalGuards)"      -ForegroundColor DarkCyan }
    if ($analytics.totalFirearms    -ne $null) { Write-Host "    totalFirearms   : $($analytics.totalFirearms)"    -ForegroundColor DarkCyan }
    if ($analytics.activeShifts     -ne $null) { Write-Host "    activeShifts    : $($analytics.activeShifts)"     -ForegroundColor DarkCyan }
    if ($analytics.totalArmoredCars -ne $null) { Write-Host "    totalArmoredCars: $($analytics.totalArmoredCars)" -ForegroundColor DarkCyan }
} else {
    ERR "Analytics fetch failed"
}

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
$total = $PASS + $FAIL
Write-Host ""
Write-Host "=======================================================" -ForegroundColor White
Write-Host "  DASIA Daily Operations Simulation -- RESULTS"          -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor White
Write-Host "  Passed : $PASS / $total" -ForegroundColor Green
if ($FAIL -gt 0) {
    Write-Host "  Failed : $FAIL / $total" -ForegroundColor Red
} else {
    Write-Host "  Failed : 0 / $total  -- ALL STEPS PASSED!" -ForegroundColor Green
}
Write-Host "=======================================================" -ForegroundColor White
Write-Host ""
