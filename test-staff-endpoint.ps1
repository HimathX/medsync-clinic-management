# Test Staff Login Endpoint
# PowerShell script to test /staff/login

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Staff Login Endpoint Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running" -ForegroundColor Red
    Write-Host "   Start with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Doctor Login
Write-Host "Test 1: Doctor Login" -ForegroundColor Yellow
Write-Host "   Email: kasun.rajapaksha@medsync.lk" -ForegroundColor Gray
Write-Host "   Password: doctor123" -ForegroundColor Gray

$doctorLogin = @{
    email = "kasun.rajapaksha@medsync.lk"
    password = "doctor123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/staff/login" `
        -Method POST `
        -Body $doctorLogin `
        -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Name: $($response.full_name)" -ForegroundColor White
    Write-Host "   Type: $($response.user_type)" -ForegroundColor White
    Write-Host "   Role: $($response.role)" -ForegroundColor White
    Write-Host "   User ID: $($response.user_id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Manager Login
Write-Host "Test 2: Manager Login" -ForegroundColor Yellow
Write-Host "   Email: samantha.perera@medsync.lk" -ForegroundColor Gray
Write-Host "   Password: manager123" -ForegroundColor Gray

$managerLogin = @{
    email = "samantha.perera@medsync.lk"
    password = "manager123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/staff/login" `
        -Method POST `
        -Body $managerLogin `
        -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Name: $($response.full_name)" -ForegroundColor White
    Write-Host "   Type: $($response.user_type)" -ForegroundColor White
    Write-Host "   Role: $($response.role)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Nurse Login
Write-Host "Test 3: Nurse Login" -ForegroundColor Yellow
Write-Host "   Email: nimali.wijesinghe@medsync.lk" -ForegroundColor Gray
Write-Host "   Password: nurse123" -ForegroundColor Gray

$nurseLogin = @{
    email = "nimali.wijesinghe@medsync.lk"
    password = "nurse123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/staff/login" `
        -Method POST `
        -Body $nurseLogin `
        -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Name: $($response.full_name)" -ForegroundColor White
    Write-Host "   Type: $($response.user_type)" -ForegroundColor White
    Write-Host "   Role: $($response.role)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Invalid Password
Write-Host "Test 4: Invalid Password (Should Fail)" -ForegroundColor Yellow
Write-Host "   Email: kasun.rajapaksha@medsync.lk" -ForegroundColor Gray
Write-Host "   Password: wrongpassword" -ForegroundColor Gray

$invalidLogin = @{
    email = "kasun.rajapaksha@medsync.lk"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/staff/login" `
        -Method POST `
        -Body $invalidLogin `
        -ContentType "application/json"
    
    Write-Host "❌ Unexpected success - security issue!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Correctly rejected invalid password" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 5: Patient Email (Should Fail)
Write-Host "Test 5: Patient Email on Staff Login (Should Fail)" -ForegroundColor Yellow
Write-Host "   Email: amara.bandara@email.com" -ForegroundColor Gray
Write-Host "   Password: patient123" -ForegroundColor Gray

$patientLogin = @{
    email = "amara.bandara@email.com"
    password = "patient123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/staff/login" `
        -Method POST `
        -Body $patientLogin `
        -ContentType "application/json"
    
    Write-Host "❌ Unexpected success - patient should not login here!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Correctly blocked patient from staff login" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All tests completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update frontend to use /staff/login for staff" -ForegroundColor White
Write-Host "2. Keep /auth/login for patients (unchanged)" -ForegroundColor White
Write-Host "3. Check STAFF_LOGIN_README.md for integration" -ForegroundColor White
