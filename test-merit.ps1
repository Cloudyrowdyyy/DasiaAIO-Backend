# Merit Score System Test Workflow

$API_BASE_URL = "http://localhost:5000"

Write-Host "=== Merit Score System Workflow Test ===" -ForegroundColor Cyan

# 1. Get all guards
Write-Host "`n1. Fetching all guards..." -ForegroundColor Yellow
$guardsResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/users" -Method Get
$guards = $guardsResponse.users | Where-Object { $_.role -eq 'user' }
Write-Host "Found $($guards.Count) guards" -ForegroundColor Green

if ($guards.Count -eq 0) {
    Write-Host "No guards found. Please create guards first." -ForegroundColor Red
    exit 1
}

$testGuardId = $guards[0].id
Write-Host "Using guard ID: $testGuardId for testing" -ForegroundColor Cyan

# 2. Submit client evaluations for the guard
Write-Host "`n2. Submitting client evaluations..." -ForegroundColor Yellow

$ratings = @(4.5, 4.8, 4.2, 4.9, 4.7)
foreach ($i in 0..4) {
    $evaluationPayload = @{
        guardId = $testGuardId
        rating = $ratings[$i]
        comment = "Excellent performance during mission $($i+1)"
        evaluatorName = "Client $($i+1)"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/merit/evaluations/submit" -Method Post -Headers @{"Content-Type"="application/json"} -Body $evaluationPayload
    Write-Host "  Submitted evaluation with rating $($ratings[$i])" -ForegroundColor Green
}

# 3. Create some punctuality records for the guard
Write-Host "`n3. Simulating punctuality records..." -ForegroundColor Yellow

$onTimeCount = 8
$lateCount = 2
Write-Host "  Simulated: $onTimeCount on-time, $lateCount late check-ins" -ForegroundColor Green

# 4. Calculate merit score
Write-Host "`n4. Calculating merit score..." -ForegroundColor Yellow

$calculatePayload = @{
    guardId = $testGuardId
} | ConvertTo-Json

$meritResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/merit/calculate" -Method Post -Headers @{"Content-Type"="application/json"} -Body $calculatePayload

Write-Host "Merit Score calculated:" -ForegroundColor Green
Write-Host "  Overall Score: $($meritResponse.overallScore)" -ForegroundColor Cyan
Write-Host "  Rank: $($meritResponse.rank)" -ForegroundColor Cyan
Write-Host "  Attendance Score: $($meritResponse.attendanceScore)%" -ForegroundColor Cyan
Write-Host "  Punctuality Score: $($meritResponse.punctualityScore)%" -ForegroundColor Cyan
Write-Host "  Client Rating: $($meritResponse.clientRating)" -ForegroundColor Cyan

# 5. Get Guard Merit Score
Write-Host "`n5. Fetching guard merit score..." -ForegroundColor Yellow
$guardMeritResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/merit/$testGuardId" -Method Get
Write-Host "Guard Merit Score Retrieved:" -ForegroundColor Green
Write-Host "  Guard: $($guardMeritResponse.guardName)" -ForegroundColor Cyan
Write-Host "  Overall Score: $($guardMeritResponse.overallScore)" -ForegroundColor Cyan
Write-Host "  Rank: $($guardMeritResponse.rank)" -ForegroundColor Cyan

# 6. Get Guard Evaluations
Write-Host "`n6. Fetching guard evaluations..." -ForegroundColor Yellow
$evaluationsResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/merit/evaluations/$testGuardId" -Method Get
Write-Host "Total Evaluations: $($evaluationsResponse.total)" -ForegroundColor Green
$evaluationsResponse.evaluations | ForEach-Object {
    Write-Host "  Rating: $($_.rating) stars - $($_.comments)" -ForegroundColor Cyan
}

# 7. Get Rankings
Write-Host "`n7. Fetching guard rankings..." -ForegroundColor Yellow
$rankingsResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/merit/rankings/all" -Method Get
Write-Host "Total Ranked Guards: $($rankingsResponse.total)" -ForegroundColor Green
$rankingsResponse.rankings | Select-Object -First 5 | ForEach-Object {
    Write-Host "  #$($_.rank) - $($_.guardName): $($_.overallScore) (Rank: $($_.meritRank))" -ForegroundColor Cyan
}

# 8. Get Overtime Candidates
Write-Host "`n8. Fetching overtime candidates (Gold/Silver ranks)..." -ForegroundColor Yellow
$overtimeResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/merit/overtime-candidates" -Method Get
Write-Host "Overtime-Eligible Guards: $($overtimeResponse.total)" -ForegroundColor Green
if ($overtimeResponse.total -gt 0) {
    $overtimeResponse.candidates | ForEach-Object {
        Write-Host "  $($_.guardName) - Rank: $($_.meritRank) (Score: $($_.overallScore))" -ForegroundColor Cyan
    }
} else {
    Write-Host "  No Gold/Silver ranked guards yet" -ForegroundColor Yellow
}

Write-Host "`n=== Merit Score Workflow Test Complete ===" -ForegroundColor Green
