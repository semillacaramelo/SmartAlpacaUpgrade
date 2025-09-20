# Smart Alpaca - Start Development Services for Windows
# This script starts PostgreSQL and Redis services required for development

param(
    [switch]$Install,
    [switch]$Force
)

Write-Host "[SMART ALPACA] Development Services Starter" -ForegroundColor Cyan
Write-Host "=" * 50

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to find PostgreSQL installation
function Get-PostgreSQLPath {
    # First check if psql is already in PATH
    $psqlInPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlInPath) {
        return "psql"
    }
    
    # Check common installation paths
    $commonPaths = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
    )
    
    foreach ($path in $commonPaths) {
        $psqlPath = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($psqlPath) {
            return $psqlPath.FullName
        }
    }
    
    return $null
}

# Function to start PostgreSQL service
function Start-PostgreSQLService {
    Write-Host "[INFO] Checking PostgreSQL..." -ForegroundColor Yellow
    
    # Check if PostgreSQL service exists
    $postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    
    if (-not $postgresService) {
        Write-Host "[ERROR] PostgreSQL service not found!" -ForegroundColor Red
        Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. Install with default settings" -ForegroundColor White
        Write-Host "3. Remember your postgres user password" -ForegroundColor White
        return $false
    }
    
    # Start PostgreSQL service
    foreach ($service in $postgresService) {
        if ($service.Status -eq "Stopped") {
            try {
                Write-Host "[STARTING] Starting $($service.Name)..." -ForegroundColor Green
                Start-Service $service.Name -ErrorAction Stop
                Write-Host "[OK] $($service.Name) started successfully" -ForegroundColor Green
            }
            catch {
                Write-Host "[ERROR] Failed to start $($service.Name): $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
        else {
            Write-Host "[OK] $($service.Name) is already running" -ForegroundColor Green
        }
    }
    
    # Test PostgreSQL connection
    $psqlPath = Get-PostgreSQLPath
    if ($psqlPath) {
        try {
            $env:PGPASSWORD = "postgres"  # Default password, user should change this
            $result = & $psqlPath -U postgres -c "SELECT version();" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] PostgreSQL connection test successful" -ForegroundColor Green
            }
            else {
                Write-Host "[WARNING] PostgreSQL is running but connection test failed" -ForegroundColor Yellow
                Write-Host "Please ensure you can connect with: $psqlPath -U postgres" -ForegroundColor White
            }
        }
        catch {
            Write-Host "[WARNING] Could not test PostgreSQL connection" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[WARNING] PostgreSQL psql utility not found" -ForegroundColor Yellow
    }
    
    return $true
}

# Function to start Redis service
function Start-RedisService {
    Write-Host "[INFO] Checking Redis..." -ForegroundColor Yellow
    
    # Check if Redis is installed as a service
    $redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
    
    if ($redisService) {
        # Redis installed as Windows service
        if ($redisService.Status -eq "Stopped") {
            try {
                Write-Host "[STARTING] Starting Redis service..." -ForegroundColor Green
                Start-Service "Redis" -ErrorAction Stop
                Write-Host "[OK] Redis service started successfully" -ForegroundColor Green
            }
            catch {
                Write-Host "[ERROR] Failed to start Redis service: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
        else {
            Write-Host "[OK] Redis service is already running" -ForegroundColor Green
        }
    }
    else {
        # Try to start Redis manually if redis-server.exe exists
        $redisPath = where.exe redis-server 2>$null
        if ($redisPath) {
            Write-Host "[STARTING] Starting Redis manually..." -ForegroundColor Green
            Start-Process -FilePath "redis-server" -WindowStyle Hidden
            Start-Sleep -Seconds 2
            Write-Host "[OK] Redis started manually" -ForegroundColor Green
        }
        else {
            Write-Host "[ERROR] Redis not found!" -ForegroundColor Red
            Write-Host "Please install Redis:" -ForegroundColor Yellow
            Write-Host "Option 1 - Using Chocolatey:" -ForegroundColor White
            Write-Host "  choco install redis-64" -ForegroundColor Gray
            Write-Host "Option 2 - Using Windows Subsystem for Linux (WSL):" -ForegroundColor White
            Write-Host "  wsl --install" -ForegroundColor Gray
            Write-Host "  wsl -d Ubuntu" -ForegroundColor Gray
            Write-Host "  sudo apt update; sudo apt install redis-server" -ForegroundColor Gray
            Write-Host "Option 3 - Download Redis for Windows:" -ForegroundColor White
            Write-Host "  https://github.com/microsoftarchive/redis/releases" -ForegroundColor Gray
            return $false
        }
    }
    
    # Test Redis connection
    try {
        $result = & redis-cli ping 2>$null
        if ($result -eq "PONG") {
            Write-Host "[OK] Redis connection test successful" -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] Redis connection test failed" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[WARNING] Could not test Redis connection (redis-cli not in PATH)" -ForegroundColor Yellow
    }
    
    return $true
}

# Function to check Node.js and npm
function Test-NodeJS {
    Write-Host "[INFO] Checking Node.js..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = & node --version 2>$null
        $npmVersion = & npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-Host "[OK] Node.js $nodeVersion installed" -ForegroundColor Green
            Write-Host "[OK] npm $npmVersion installed" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
        Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
        return $false
    }
    
    return $false
}

# Function to show service status
function Show-ServiceStatus {
    Write-Host "`n[STATUS] Service Status:" -ForegroundColor Cyan
    Write-Host "-" * 30
    
    # PostgreSQL
    $postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($postgresService) {
        foreach ($service in $postgresService) {
            $status = if ($service.Status -eq "Running") { "[OK] Running" } else { "[ERROR] Stopped" }
            $color = if ($service.Status -eq "Running") { "Green" } else { "Red" }
            Write-Host "PostgreSQL ($($service.Name)): $status" -ForegroundColor $color
        }
    }
    else {
        Write-Host "PostgreSQL: [ERROR] Not installed" -ForegroundColor Red
    }
    
    # Redis
    $redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
    if ($redisService) {
        $status = if ($redisService.Status -eq "Running") { "[OK] Running" } else { "[ERROR] Stopped" }
        $color = if ($redisService.Status -eq "Running") { "Green" } else { "Red" }
        Write-Host "Redis (Service): $status" -ForegroundColor $color
    }
    else {
        # Check if Redis is running as a process
        $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
        if ($redisProcess) {
            Write-Host "Redis (Process): [OK] Running" -ForegroundColor Green
        }
        else {
            Write-Host "Redis: [ERROR] Not running" -ForegroundColor Red
        }
    }
    
    # Node.js
    try {
        $nodeVersion = & node --version 2>$null
        if ($nodeVersion) {
            Write-Host "Node.js: [OK] $nodeVersion" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Node.js: [ERROR] Not installed" -ForegroundColor Red
    }
}

# Function to create development database
function Initialize-Database {
    Write-Host "`n[DATABASE] Initializing development database..." -ForegroundColor Yellow
    
    $psqlPath = Get-PostgreSQLPath
    if ($psqlPath) {
        try {
            # Check if database exists
            $env:PGPASSWORD = "postgres"
            $dbExists = & $psqlPath -U postgres -lqt 2>$null | Select-String "smart_alpaca"
            
            if (-not $dbExists) {
                Write-Host "Creating smart_alpaca database..." -ForegroundColor Green
                & $psqlPath -U postgres -c "CREATE DATABASE smart_alpaca;" 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Database created successfully" -ForegroundColor Green
                }
                else {
                    Write-Host "[ERROR] Failed to create database" -ForegroundColor Red
                }
            }
            else {
                Write-Host "[OK] Database smart_alpaca already exists" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "[WARNING] Could not initialize database" -ForegroundColor Yellow
            Write-Host "Please create database manually:" -ForegroundColor White
            Write-Host "1. Open pgAdmin or command line" -ForegroundColor Gray
            Write-Host "2. Connect as postgres user" -ForegroundColor Gray
            Write-Host "3. Run: CREATE DATABASE smart_alpaca;" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "[WARNING] PostgreSQL psql utility not found" -ForegroundColor Yellow
        Write-Host "Please ensure PostgreSQL is properly installed" -ForegroundColor White
    }
}

# Main execution
Write-Host "`n[INFO] Checking prerequisites..." -ForegroundColor Cyan

# Check if we need admin privileges
if (-not (Test-Administrator)) {
    Write-Host "[WARNING] Running without administrator privileges" -ForegroundColor Yellow
    Write-Host "Some services may require admin rights to start" -ForegroundColor White
}

# Check Node.js
$nodeOK = Test-NodeJS

# Start services
$postgresOK = Start-PostgreSQLService
$redisOK = Start-RedisService

# Initialize database if PostgreSQL is running
if ($postgresOK) {
    Initialize-Database
}

# Show final status
Show-ServiceStatus

Write-Host "`n[NEXT STEPS] Next Steps:" -ForegroundColor Cyan
Write-Host "-" * 15

if ($nodeOK -and $postgresOK -and $redisOK) {
    Write-Host "[OK] All services are ready!" -ForegroundColor Green
    Write-Host "You can now run:" -ForegroundColor White
    Write-Host "  npm install" -ForegroundColor Gray
    Write-Host "  npm run db:push" -ForegroundColor Gray
    Write-Host "  npm run dev" -ForegroundColor Gray
}
else {
    Write-Host "[ERROR] Some services need attention:" -ForegroundColor Red
    if (-not $nodeOK) { Write-Host "  - Install Node.js" -ForegroundColor White }
    if (-not $postgresOK) { Write-Host "  - Install/Start PostgreSQL" -ForegroundColor White }
    if (-not $redisOK) { Write-Host "  - Install/Start Redis" -ForegroundColor White }
}

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  Check services: .\scripts\start-services.ps1" -ForegroundColor Gray
Write-Host "  Stop PostgreSQL: Stop-Service postgresql*" -ForegroundColor Gray
Write-Host "  Stop Redis: Stop-Service Redis (or kill redis-server process)" -ForegroundColor Gray

Write-Host "`nEnvironment Setup:" -ForegroundColor Cyan
Write-Host "  Copy .env.example to .env and configure your API keys" -ForegroundColor White
Write-Host "  Default DATABASE_URL: postgresql://postgres:postgres@localhost:5432/smart_alpaca" -ForegroundColor Gray