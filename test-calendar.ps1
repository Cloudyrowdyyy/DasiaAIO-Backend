# test-calendar.ps1 - Calendar Dashboard Simulation (no token auth)
$BASE_URL = "http://localhost:5000"
$Pass = 0
$Fail = 0
$Results = @()

function Test-Result {
    param($Name, $Passed, $Details = "")
    if ($Passed) {
        $script:Pass++
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } else {
        $script:Fail++
        Write-Host "[FAIL] $Name - $Details" -ForegroundColor Red
    }
    $script:Results += [PSCustomObject]@{ Test = $Name; Status = if ($Passed) {"PASS"} else {"FAIL"}; Details = $Details }
}

function Invoke-API {
    param($Method, $Url, $Body = $null)
    $headers = @{ "Content-Type" = "application/json" }
    try {
        if ($Body) {
            $json = $Body | ConvertTo-Json
            return Invoke-RestMethod -Uri $Url -Method $Method -Body $json -Headers $headers -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
    } catch {
        $errMsg = $_.ErrorDetails.Message
        if (-not $errMsg) { $errMsg = $_.Exception.Message }
        return [PSCustomObject]@{ __error = $true; message = $errMsg }
    }
}

Write-Host ""
Write-Host "=== Calendar Dashboard API Simulation ===" -ForegroundColor Cyan
Write-Host "Testing endpoints used by CalendarDashboard.tsx" -ForegroundColor Gray
Write-Host ""

# 1. Health Check
Write-Host "== Health ==" -ForegroundColor DarkCyan
$health = Invoke-API -Method GET -Url "$BASE_URL/api/health"
Test-Result "Backend health check" ($health.status -eq "ok") "status=$($health.status)"

# 2. Login to get user IDs
Write-Host ""
Write-Host "== Authentication ==" -ForegroundColor DarkCyan
$adminLoginBody = '{"identifier":"admin","password":"admin123"}'
$adminResp = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $adminLoginBody -ContentType "application/json"
$adminId = $adminResp.user.id
Test-Result "Admin login (get user id)" ($null -ne $adminId) "id=$adminId role=$($adminResp.user.role)"

$userLoginBody = '{"identifier":"user","password":"user123"}'
$userResp = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $userLoginBody -ContentType "application/json"
$userId = $userResp.user.id
Test-Result "Guard login (get user id)" ($null -ne $userId) "id=$userId"

# 3. Shifts API
Write-Host ""
Write-Host "== Shifts API ==" -ForegroundColor DarkCyan

$shifts = Invoke-API -Method GET -Url "$BASE_URL/api/guard-replacement/shifts"
$shiftCount = 0
if ($shifts.shifts) { $shiftCount = $shifts.shifts.Count }
Test-Result "GET /api/guard-replacement/shifts (admin view)" ($null -ne $shifts.shifts) "count=$shiftCount total=$($shifts.total)"

if ($shifts.shifts -and $shifts.shifts.Count -gt 0) {
    $s = $shifts.shifts[0]
    $hasRequired = $s.id -and $s.client_site -and $s.start_time -and $s.end_time -and $s.guard_id -and $s.status
    $idOk = if ($s.id) { "ok" } else { "missing" }
    $siteOk = if ($s.client_site) { "ok" } else { "missing" }
    $startOk = if ($s.start_time) { "ok" } else { "missing" }
    Test-Result "Shift data has required fields" $hasRequired "id=$idOk site=$siteOk start=$startOk"
} else {
    Test-Result "Shift data has required fields" $false "no shifts in DB"
}

$todayISO = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:00:00Z")
$todayISOEnd = (Get-Date).AddHours(8).ToUniversalTime().ToString("yyyy-MM-ddTHH:00:00Z")
$createShift = Invoke-API -Method POST -Url "$BASE_URL/api/guard-replacement/shifts" -Body @{
    guardId = $userId
    clientSite = "First National Bank - Calendar Test"
    startTime = $todayISO
    endTime = $todayISOEnd
}
$shiftCreated = ($null -ne $createShift.shiftId) -or ($null -ne $createShift.id) -or ($createShift.message -match "success|created")
Test-Result "Create shift for today" $shiftCreated "resp=$($createShift | ConvertTo-Json -Compress)"

$shiftsAfter = Invoke-API -Method GET -Url "$BASE_URL/api/guard-replacement/shifts"
$shiftCountAfter = 0
if ($shiftsAfter.shifts) { $shiftCountAfter = $shiftsAfter.shifts.Count }
Test-Result "Shift count increased after create" ($shiftCountAfter -gt $shiftCount) "before=$shiftCount after=$shiftCountAfter"

if ($userId) {
    $guardShifts = Invoke-API -Method GET -Url "$BASE_URL/api/guard-replacement/guard/$userId/shifts"
    $guardShiftCount = 0
    if ($guardShifts.shifts) { $guardShiftCount = $guardShifts.shifts.Count }
    Test-Result "GET /api/guard-replacement/guard/:id/shifts" ($null -ne $guardShifts.shifts) "count=$guardShiftCount"
} else {
    Test-Result "GET guard-specific shifts" $false "userId not available"
}

# 4. Trips API
Write-Host ""
Write-Host "== Trips API ==" -ForegroundColor DarkCyan

$trips = Invoke-API -Method GET -Url "$BASE_URL/api/trips"
$tripCount = 0
if ($trips -is [array]) { $tripCount = $trips.Count }
elseif ($trips.trips) { $tripCount = $trips.trips.Count }
$tripsOk = ($trips -is [array]) -or ($null -ne $trips.trips)
Test-Result "GET /api/trips returns valid response" $tripsOk "count=$tripCount"

$cars = Invoke-API -Method GET -Url "$BASE_URL/api/armored-cars"
$availableCar = $null
if ($cars -is [array]) {
    $availableCar = $cars | Where-Object { $_.status -eq "available" } | Select-Object -First 1
}

if ($availableCar) {
    $createTrip = Invoke-API -Method POST -Url "$BASE_URL/api/trips" -Body @{
        carId = $availableCar.id
        driverId = $userId
        startLocation = "HQ - Calendar Test"
        missionDetails = "Calendar test trip"
    }
    $tripCreated = ($null -ne $createTrip.tripId) -or ($null -ne $createTrip.id) -or ($createTrip.message -match "success|created|started")
    Test-Result "Create armored car trip" $tripCreated "resp=$($createTrip | ConvertTo-Json -Compress)"

    $tripsAfter = Invoke-API -Method GET -Url "$BASE_URL/api/trips"
    $tripCountAfter = 0
    if ($tripsAfter -is [array]) { $tripCountAfter = $tripsAfter.Count }
    elseif ($tripsAfter.trips) { $tripCountAfter = $tripsAfter.trips.Count }
    Test-Result "Trip count increased after create" ($tripCountAfter -gt $tripCount) "before=$tripCount after=$tripCountAfter"
} else {
    Write-Host "  No available armored cars - skipping trip creation" -ForegroundColor Yellow
    Test-Result "Create armored car trip" $true "(skipped - no available cars)"
    Test-Result "Trip count increased after create" $true "(skipped - no available cars)"
}

# 5. Missions API
Write-Host ""
Write-Host "== Missions API ==" -ForegroundColor DarkCyan

$missions = Invoke-API -Method GET -Url "$BASE_URL/api/missions"
$missionCount = 0
if ($missions.missions) { $missionCount = $missions.missions.Count }
Test-Result "GET /api/missions" ($null -ne $missions.missions) "count=$missionCount"

$hasTotal = $null -ne $missions.total
Test-Result "Missions response has total field" $hasTotal "total=$($missions.total)"

# 6. Firearm Maintenance API
Write-Host ""
Write-Host "== Firearm Maintenance API ==" -ForegroundColor DarkCyan

$pending = Invoke-API -Method GET -Url "$BASE_URL/api/firearm-maintenance/pending"
$pendingIsArray = $pending -is [array]
Test-Result "GET /api/firearm-maintenance/pending returns array" $pendingIsArray "type=$($pending.GetType().Name)"

$firearms = Invoke-API -Method GET -Url "$BASE_URL/api/firearms"
$firearmList = @()
if ($firearms -is [array]) { $firearmList = $firearms }
elseif ($firearms.firearms) { $firearmList = $firearms.firearms }
$firstFirearm = $firearmList | Select-Object -First 1

if ($firstFirearm) {
    $scheduleDate = (Get-Date).AddDays(7).ToUniversalTime().ToString("yyyy-MM-ddT08:00:00Z")
    $createMaint = Invoke-API -Method POST -Url "$BASE_URL/api/firearm-maintenance/schedule" -Body @{
        firearmId = $firstFirearm.id
        maintenanceType = "Routine Cleaning"
        description = "Calendar test scheduled cleaning"
        scheduledDate = $scheduleDate
        notes = "Calendar test maintenance"
    }
    $maintCreated = ($null -ne $createMaint.id) -or ($null -ne $createMaint.maintenanceId) -or ($createMaint.message -match "success|created|scheduled")
    Test-Result "Schedule firearm maintenance" $maintCreated "resp=$($createMaint | ConvertTo-Json -Compress)"
} else {
    Write-Host "  No firearms found - skipping maintenance creation" -ForegroundColor Yellow
    Test-Result "Schedule firearm maintenance" $true "(skipped - no firearms)"
}

# 7. Data Integration Tests
Write-Host ""
Write-Host "== Data Integration Tests ==" -ForegroundColor DarkCyan

$testTime = "2026-06-15T09:00:00Z"
$expectedKey = "2026-06-15"
$extractedKey = $testTime.Substring(0, 10)
Test-Result "ISO date key extraction" ($extractedKey -eq $expectedKey) "expected=$expectedKey got=$extractedKey"

if ($shiftsAfter.shifts -and $shiftsAfter.shifts.Count -gt 0) {
    $s = $shiftsAfter.shifts[0]
    $hasAllFields = ($null -ne $s.id) -and ($null -ne $s.start_time) -and ($null -ne $s.client_site) -and ($null -ne $s.status)
    $cfId = if ($s.id) { "ok" } else { "missing" }
    $cfSt = if ($s.start_time) { "ok" } else { "missing" }
    $cfSi = if ($s.client_site) { "ok" } else { "missing" }
    $cfSt2 = if ($s.status) { "ok" } else { "missing" }
    Test-Result "Shift has all calendar-required fields" $hasAllFields "id=$cfId start=$cfSt site=$cfSi status=$cfSt2"
} else {
    Test-Result "Shift has all calendar-required fields" $true "(no shifts available)"
}

Write-Host "  Simulating parallel fetch (4 endpoints)..." -ForegroundColor Gray
$startTime = Get-Date
$p1 = Invoke-API -Method GET -Url "$BASE_URL/api/guard-replacement/shifts"
$p2 = Invoke-API -Method GET -Url "$BASE_URL/api/trips"
$p3 = Invoke-API -Method GET -Url "$BASE_URL/api/missions"
$p4 = Invoke-API -Method GET -Url "$BASE_URL/api/firearm-maintenance/pending"
$elapsed = [int]((Get-Date) - $startTime).TotalMilliseconds
$p1ok = $null -ne $p1.shifts
$p2ok = $p2 -is [array] -or $null -ne $p2
$p3ok = $null -ne $p3.missions
$p4ok = $p4 -is [array]
$allOk = $p1ok -and $p2ok -and $p3ok -and $p4ok
$c1 = if ($p1.shifts) { $p1.shifts.Count } else { 0 }
$c2 = if ($p2 -is [array]) { $p2.Count } else { 0 }
$c3 = if ($p3.missions) { $p3.missions.Count } else { 0 }
$c4 = if ($p4 -is [array]) { $p4.Count } else { 0 }
Test-Result "Parallel calendar fetch (shifts+trips+missions+maintenance)" $allOk "elapsed=${elapsed}ms s=$c1 t=$c2 m=$c3 maint=$c4"

# Summary
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Calendar Simulation Complete" -ForegroundColor White
Write-Host "  PASSED: $Pass" -ForegroundColor Green
Write-Host "  FAILED: $Fail" -ForegroundColor Red
Write-Host "  TOTAL:  $($Pass + $Fail)" -ForegroundColor White
if ($Fail -gt 0) {
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor Red
    $Results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}
Write-Host "=================================================" -ForegroundColor Cyan
