# VDerm-X Project Setup and Run Script
# This script sets up and runs both backend and frontend

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    VDerm-X Project Setup & Run Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Step 1: Check Prerequisites
Write-Host "[Step 1/10] Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
if (Test-Command python) {
    $pythonVersion = python --version
    Write-Host "✓ Python installed: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found! Please install Python 3.8+ from https://python.org/" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "✓ MongoDB Atlas will be used (cloud database)" -ForegroundColor Green
Write-Host ""

# Step 2: Setup Backend Dependencies
Write-Host "[Step 2/10] Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    Write-Host "✓ Backend node_modules already exists" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
}
Set-Location ..
Write-Host ""

# Step 3: Check/Create Python Virtual Environment
Write-Host "[Step 3/10] Setting up Python Virtual Environment..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path ".venv") {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv .venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Virtual environment created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create virtual environment" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}
Set-Location ..
Write-Host ""

# Step 4: Activate Virtual Environment and Install Python Dependencies
Write-Host "[Step 4/10] Installing Python Dependencies..." -ForegroundColor Yellow
Set-Location backend
$activateScript = ".\.venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    # Execute in a new scope to activate venv
    & $activateScript
    
    # Check if requirements.txt exists, if not create it
    if (-not (Test-Path "requirements.txt")) {
        Write-Host "Creating requirements.txt..." -ForegroundColor Cyan
        @"
tensorflow==2.20.0
numpy==1.26.4
Pillow==10.2.0
"@ | Out-File -FilePath "requirements.txt" -Encoding utf8
    }
    
    Write-Host "Installing Python packages..." -ForegroundColor Cyan
    pip install -r requirements.txt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Python dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠ Some Python packages may have issues, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Virtual environment activation script not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host ""

# Step 5: Setup Environment Variables
Write-Host "[Step 5/10] Checking Environment Variables..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path ".env") {
    Write-Host "✓ Backend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Creating .env file from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Please update backend/.env with your MongoDB URI and Gemini API key" -ForegroundColor Cyan
    } else {
        Write-Host "✗ .env.example not found" -ForegroundColor Red
    }
}
Set-Location ..

Set-Location VDerm-X
if (Test-Path ".env") {
    Write-Host "✓ Frontend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Creating frontend .env file..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    }
}
Set-Location ..
Write-Host ""

# Step 6: Install Frontend Dependencies
Write-Host "[Step 6/10] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location VDerm-X
if (Test-Path "node_modules") {
    Write-Host "✓ Frontend node_modules already exists" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}
Set-Location ..
Write-Host ""

# Step 7: Kill any existing Node processes on ports 3000 and 8081
Write-Host "[Step 7/10] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    $connections = Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue
    if ($connections.LocalPort -contains 3000 -or $connections.LocalPort -contains 8081) {
        Stop-Process -Id $_.Id -Force
        Write-Host "✓ Stopped process on port $($connections.LocalPort)" -ForegroundColor Green
    }
}
Start-Sleep -Seconds 2
Write-Host ""

# Step 8: Start Backend Server
Write-Host "[Step 8/10] Starting Backend Server..." -ForegroundColor Yellow
Set-Location backend
Write-Host "Starting NestJS backend on http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; npm run start:dev" -WindowStyle Normal
Write-Host "✓ Backend server starting in new window..." -ForegroundColor Green
Set-Location ..
Start-Sleep -Seconds 5
Write-Host ""

# Step 9: Check if backend is running
Write-Host "[Step 9/10] Verifying Backend Status..." -ForegroundColor Yellow
$backendRunning = $false
$maxAttempts = 10
$attempt = 0

while (-not $backendRunning -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        $backendRunning = $true
        Write-Host "✓ Backend is running on port 3000" -ForegroundColor Green
    } catch {
        Write-Host "Waiting for backend to start... (Attempt $attempt/$maxAttempts)" -ForegroundColor Cyan
        Start-Sleep -Seconds 3
    }
}

if (-not $backendRunning) {
    Write-Host "⚠ Backend may still be starting. Check the backend window." -ForegroundColor Yellow
}
Write-Host ""

# Step 10: Start Frontend with Expo Tunnel
Write-Host "[Step 10/10] Starting Frontend with Expo Go (Tunnel Mode)..." -ForegroundColor Yellow
Set-Location VDerm-X
Write-Host "Starting Expo with tunnel mode for Expo Go app..." -ForegroundColor Cyan
Write-Host "Scan the QR code with Expo Go app on your phone" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx expo start --tunnel" -WindowStyle Normal
Write-Host "✓ Frontend starting in new window..." -ForegroundColor Green
Set-Location ..
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "            Setup Complete! 🎉" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: Scan QR code in Expo window" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check backend window - should show 'Nest application successfully started'" -ForegroundColor White
Write-Host "2. Check frontend window - scan QR code with Expo Go app" -ForegroundColor White
Write-Host "3. If backend .env needs updating, edit backend/.env and restart" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
