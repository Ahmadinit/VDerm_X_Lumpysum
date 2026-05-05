# VDerm-X Project Setup and Run Script
# This script sets up and runs both backend and frontend

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    VDerm-X Project Setup & Run Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

function Prepend-PathIfExists($pathValue) {
    if ((Test-Path $pathValue) -and ($env:PATH -notlike "*$pathValue*")) {
        $env:PATH = "$pathValue;$env:PATH"
    }
}

Write-Host "[Step 1/10] Checking & Installing Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Ensure winget exists
if (-not (Test-Command winget)) {
    Write-Host "winget not found. Please install App Installer from Microsoft Store." -ForegroundColor Red
    exit 1
}

# NODE 18 (FORCED)
Write-Host "Ensuring Node.js 18..." -ForegroundColor Cyan

$targetNodePackage = "OpenJS.NodeJS.18"

$nodeVersion = ""
if (Test-Command node) {
    $nodeVersion = (node --version)
}

if ($nodeVersion -notmatch "^v18") {
    Write-Host "Node 18 not active. Installing Node.js 18..." -ForegroundColor Yellow
    winget install $targetNodePackage --silent --accept-package-agreements --accept-source-agreements | Out-Null
}

Prepend-PathIfExists "$env:ProgramFiles\nodejs"
Prepend-PathIfExists "$env:ProgramFiles(x86)\nodejs"
Prepend-PathIfExists "$env:LOCALAPPDATA\Programs\nodejs"

$nodeCandidates = @()
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeCandidates += $nodeCmd.Source
}
$nodeCandidates += @(
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles(x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
)
$nodeCandidates = $nodeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

$nodeExe = $null
foreach ($candidate in $nodeCandidates) {
    $candidateVersion = (& $candidate --version 2>$null).Trim()
    if ($candidateVersion -match "^v18\.") {
        $nodeExe = $candidate
        $nodeVersion = $candidateVersion
        break
    }
}

if (-not $nodeExe) {
    Write-Host "Node 18 was not found after installation attempt" -ForegroundColor Red
    exit 1
}

$NODE18_PATH = Split-Path $nodeExe -Parent
$NPM_CMD = Join-Path $NODE18_PATH "npm.cmd"
$NPX_CMD = Join-Path $NODE18_PATH "npx.cmd"

if (-not (Test-Path $NPM_CMD)) {
    $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npmCmd) { $NPM_CMD = $npmCmd.Source }
}
if (-not (Test-Path $NPX_CMD)) {
    $npxCmd = Get-Command npx.cmd -ErrorAction SilentlyContinue
    if ($npxCmd) { $NPX_CMD = $npxCmd.Source }
}

if (-not (Test-Path $NPM_CMD)) {
    Write-Host "npm command not found after Node setup" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $NPX_CMD)) {
    Write-Host "npx command not found after Node setup" -ForegroundColor Red
    exit 1
}

$npmVersion = (& $NPM_CMD --version).Trim()
Write-Host "Node.js OK: $nodeVersion" -ForegroundColor Green
Write-Host "npm OK: $npmVersion" -ForegroundColor Green

Prepend-PathIfExists (Split-Path $NPM_CMD -Parent)
Write-Host "Using Node 18 tool path: $NODE18_PATH" -ForegroundColor Green

# Additional PATH setup for npm/node (fallback/safety)
$nodeInstalls = @(
    'C:\Program Files\nodejs',
    'C:\Program Files (x86)\nodejs',
    'C:\Users\This PC\AppData\Local\Programs\nodejs'
)

foreach ($path in $nodeInstalls) {
    if ((Test-Path "$path\npm.cmd") -and ($env:PATH -notlike "*$path*")) {
        $env:PATH = "$path;$env:PATH"
        Write-Host "Added Node.js path to environment: $path" -ForegroundColor Green
        break
    }
}

# PYTHON 3.10
Write-Host "Ensuring Python 3.10..." -ForegroundColor Cyan

$python310Path = $null

if (Test-Command py) {
    $pyList = py -0 2>$null
    if ($pyList -match "3\.10") {
        $python310Path = "py"
    }
}

if (-not $python310Path) {
    Write-Host "Python 3.10 not found. Installing..." -ForegroundColor Yellow
    
    winget install Python.Python.3.10 --silent --accept-package-agreements --accept-source-agreements | Out-Null

    if (Test-Command py) {
        $pyList = py -0 2>$null
        if ($pyList -match "3\.10") {
            $python310Path = "py"
        }
    }

    $possiblePaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
        "C:\Program Files\Python310\python.exe",
        "C:\Program Files (x86)\Python310\python.exe"
    )

    if (-not $python310Path) {
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $python310Path = $path
                break
            }
        }
    }

    if (-not $python310Path) {
        Write-Host "Failed to locate Python 3.10 after installation." -ForegroundColor Red
        exit 1
    }

    Write-Host "Python 3.10 installed" -ForegroundColor Green
} else {
    Write-Host "Python 3.10 already available" -ForegroundColor Green
}

$pyVersionOutput = if ($python310Path -eq "py") { (& py -3.10 --version 2>$null).Trim() } else { (& $python310Path --version 2>$null).Trim() }
if ($pyVersionOutput -notmatch "^Python 3\.10\.") {
    Write-Host "Expected Python 3.10.x, found '$pyVersionOutput'" -ForegroundColor Red
    exit 1
}

Write-Host "Python OK: $pyVersionOutput" -ForegroundColor Green
Write-Host "MongoDB Atlas will be used (cloud database)" -ForegroundColor Green
Write-Host ""

# Step 2: Backend Dependencies
Write-Host "[Step 2/10] Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
Write-Host "Force reinstalling backend dependencies..." -ForegroundColor Cyan
& $NPM_CMD install --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "Installing WebSocket packages for real-time chat..." -ForegroundColor Cyan
& $NPM_CMD install socket.io @nestjs/websockets @nestjs/platform-socket.io --save
if ($LASTEXITCODE -eq 0) {
    Write-Host "WebSocket packages installed successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: Some WebSocket packages may have failed, but continuing..." -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# Step 3: Python Virtual Environment
Write-Host "[Step 3/10] Setting up Python Virtual Environment..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path ".venv") {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    if ($python310Path -eq "py") {
        & py -3.10 -m venv .venv
    } else {
        & $python310Path -m venv .venv
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Virtual environment created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create virtual environment" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}
Set-Location ..
Write-Host ""

# Step 4: Python Dependencies
Write-Host "[Step 4/10] Installing Python Dependencies..." -ForegroundColor Yellow
Set-Location backend
$activateScript = ".\.venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
    
    if (-not (Test-Path "requirements.txt")) {
        Write-Host "Creating requirements.txt..." -ForegroundColor Cyan
        $reqContent = "tensorflow==2.20.0`nnumpy==1.26.4`nPillow==10.2.0"
        $reqContent | Out-File -FilePath "requirements.txt" -Encoding utf8
    }
    
    Write-Host "Checking Python packages..." -ForegroundColor Cyan
    if (Test-Path "requirements.txt") {
        $needsInstall = $false
        $requirements = @(Get-Content "requirements.txt" | Where-Object { $_ -and -not $_.StartsWith("#") })
        
        foreach ($req in $requirements) {
            $req = $req.Trim()
            if ($req -match "^([a-zA-Z0-9._-]+)==(.+)$") {
                $pkgName = $matches[1]
                $requiredVersion = $matches[2]
                
                $pipOutput = pip show $pkgName 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $versionLine = $pipOutput | Select-String "^Version:"
                    if ($versionLine) {
                        $installedVersion = $versionLine -replace "Version:\s*", ""
                        if ($installedVersion -eq $requiredVersion) {
                            Write-Host "  OK: $pkgName==$requiredVersion" -ForegroundColor Green
                        } else {
                            Write-Host "  Update: $pkgName ($requiredVersion required, $installedVersion installed)" -ForegroundColor Yellow
                            $needsInstall = $true
                        }
                    }
                } else {
                    Write-Host "  Install: $pkgName==$requiredVersion" -ForegroundColor Yellow
                    $needsInstall = $true
                }
            }
        }
        
        if ($needsInstall) {
            Write-Host "Installing missing/updated packages..." -ForegroundColor Cyan
            pip install -r requirements.txt --upgrade
            Write-Host "Python dependencies installed successfully" -ForegroundColor Green
        } else {
            Write-Host "All Python packages are correct" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Virtual environment activation script not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host ""

# Step 5: Environment Variables
Write-Host "[Step 5/10] Checking Environment Variables..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path ".env") {
    Write-Host "Backend .env file exists" -ForegroundColor Green
} else {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Please update backend/.env with MongoDB URI and Gemini API key" -ForegroundColor Cyan
    } else {
        Write-Host ".env.example not found" -ForegroundColor Red
    }
}
Set-Location ..

Set-Location VDerm-X
if (Test-Path ".env") {
    Write-Host "Frontend .env file exists" -ForegroundColor Green
} else {
    Write-Host "Creating frontend .env file..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    }
}
Set-Location ..
Write-Host ""

# Step 6: Frontend Dependencies
Write-Host "[Step 6/10] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location VDerm-X
Write-Host "Force reinstalling frontend dependencies..." -ForegroundColor Cyan
& $NPM_CMD install --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Installing compatible package versions..." -ForegroundColor Cyan
& $NPM_CMD install expo-asset expo-font @react-native-async-storage/async-storage@1.23.1 expo@~52.0.49 expo-image-picker@~16.0.6 expo-status-bar@~2.0.1 react-native@0.76.9 react-native-screens@~4.4.0 socket.io-client@^4.7.0 --save
if ($LASTEXITCODE -eq 0) {
    Write-Host "Package versions updated successfully" -ForegroundColor Green
} else {
    Write-Host "Some package version updates failed, but continuing..." -ForegroundColor Yellow
}

$frontendPackageJson = "package.json"
if (Test-Path $frontendPackageJson) {
    $package = Get-Content $frontendPackageJson -Raw | ConvertFrom-Json
    $expoVersion = $package.dependencies.expo
    if ($expoVersion -notmatch "52") {
        Write-Host "Expo SDK 52 is required. Installing expo@~52.0.0..." -ForegroundColor Yellow
        & $NPM_CMD install expo@~52.0.0
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to enforce Expo SDK 52" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    }

    $resolvedExpoVersion = (& $NPM_CMD list expo --depth=0 2>$null) -join "`n"
    if ($resolvedExpoVersion -notmatch "expo@52") {
        Write-Host "Expo SDK 52 verification failed" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Write-Host "Expo SDK 52 verified" -ForegroundColor Green
}
Set-Location ..
Write-Host ""

# Step 7: Cleanup processes
Write-Host "[Step 7/10] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    $connections = Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue
    if ($connections.LocalPort -contains 3000 -or $connections.LocalPort -contains 8081) {
        Stop-Process -Id $_.Id -Force
        Write-Host "Stopped process on port $($connections.LocalPort)" -ForegroundColor Green
    }
}
Start-Sleep -Seconds 2
Write-Host ""

# Step 8: Start Backend Server
Write-Host "[Step 8/10] Starting Backend Server..." -ForegroundColor Yellow
Set-Location backend
Write-Host "Starting NestJS backend on http://localhost:3000" -ForegroundColor Cyan
$backendStartCommand = "cd '$PWD'; .\.venv\Scripts\Activate.ps1; `$NPM_CMD='$NPM_CMD'; & `"`$NPM_CMD`" run start:dev"
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $backendStartCommand) -WindowStyle Normal
Write-Host "Backend server starting in new window..." -ForegroundColor Green
Set-Location ..
Start-Sleep -Seconds 5
Write-Host ""

# Step 9: Verify Backend
Write-Host "[Step 9/10] Verifying Backend Status..." -ForegroundColor Yellow
$backendRunning = $false
$maxAttempts = 10
$attempt = 0

while (-not $backendRunning -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        $backendRunning = $true
        Write-Host "Backend is running on port 3000" -ForegroundColor Green
    } catch {
        Write-Host "Waiting for backend to start... (Attempt $attempt/$maxAttempts)" -ForegroundColor Cyan
        Start-Sleep -Seconds 3
    }
}

if (-not $backendRunning) {
    Write-Host "Backend may still be starting. Check the backend window." -ForegroundColor Yellow
}
Write-Host ""

# Step 10: Create Backend URL
Write-Host "[Step 10/11] Creating Backend URL for frontend..." -ForegroundColor Yellow
$publicUrl = $null

$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokCmd) {
    Write-Host "ngrok not found, attempting install..." -ForegroundColor Yellow
    winget install Ngrok.Ngrok --silent --accept-package-agreements --accept-source-agreements | Out-Null
    $ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
} else {
    Write-Host "ngrok already available, skipping installation" -ForegroundColor Green
}

if ($ngrokCmd) {
    Write-Host "Starting backend ngrok tunnel in separate window..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @("-NoExit", "-Command", "ngrok http 3000") -WindowStyle Normal

    for ($i = 0; $i -lt 30; $i++) {
        try {
            $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method GET -TimeoutSec 2
            $publicUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
            if ($publicUrl) { break }
        } catch {}
        Start-Sleep -Seconds 1
    }
}

if (-not $publicUrl) {
    Write-Host "Could not acquire ngrok URL, falling back to LAN/local URL..." -ForegroundColor Yellow
    $localIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike "169.254.*" -and
            $_.IPAddress -ne "127.0.0.1" -and
            $_.InterfaceAlias -notlike "*Loopback*"
        } |
        Select-Object -First 1 -ExpandProperty IPAddress

    if ($localIp) {
        $publicUrl = "http://$localIp`:3000"
    } else {
        $publicUrl = "http://localhost:3000"
    }
}

Write-Host "Backend URL selected: $publicUrl" -ForegroundColor Green

$configPath = Join-Path $PWD "VDerm-X\src\config.ts"
$configContent = "// Auto-generated by run-project.ps1`nexport const BASE_URL = '$publicUrl';"
$configContent | Set-Content -Path $configPath -Encoding utf8
Write-Host "Updated frontend BASE_URL in VDerm-X/src/config.ts" -ForegroundColor Green
Write-Host ""

# Step 11: Start Frontend
Write-Host "[Step 11/11] Starting Frontend with Expo Go (Tunnel with LAN fallback)..." -ForegroundColor Yellow
Set-Location VDerm-X
Write-Host "Starting Expo with tunnel mode for Expo Go app..." -ForegroundColor Cyan
Write-Host "Scan the QR code with Expo Go app on your phone" -ForegroundColor Cyan
$frontendStartCommand = "cd '$PWD'; `$NPX_CMD='$NPX_CMD'; & `"`$NPX_CMD`" expo start --tunnel; if (`$LASTEXITCODE -ne 0) { Write-Host 'Tunnel failed. Falling back to LAN mode...' -ForegroundColor Yellow; & `"`$NPX_CMD`" expo start --lan }"
Start-Process powershell -ArgumentList @("-NoExit", "-Command", $frontendStartCommand) -WindowStyle Normal
Write-Host "Frontend starting in new window..." -ForegroundColor Green
Set-Location ..
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "            Setup Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: Scan QR code in Expo window" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check backend window - should show Nest application successfully started" -ForegroundColor White
Write-Host "2. Check frontend window - scan QR code with Expo Go app" -ForegroundColor White
Write-Host "3. If backend .env needs updating, edit backend/.env and restart" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey('NoExit,IncludeKeyDown')
