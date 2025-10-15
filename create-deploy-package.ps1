# Coze API Deploy Package Script
Write-Host "=== Creating Coze API Deploy Package ===" -ForegroundColor Green

# Check required files
$requiredFiles = @("dist", "database", ".env", "package.json", "package-lock.json", "ecosystem.config.js", "nginx.conf")
$missingFiles = @()

Write-Host "Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "Missing: $file" -ForegroundColor Red
    } else {
        Write-Host "Found: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Error: Missing required files" -ForegroundColor Red
    exit 1
}

# Create temp directory and package name
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tempDir = "deploy-temp-$timestamp"
$deployPackage = "coze-freeapi-deploy-$timestamp.zip"

Write-Host "Creating temp directory: $tempDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files
Write-Host "Copying deployment files..." -ForegroundColor Yellow
Copy-Item -Path "dist" -Destination "$tempDir\dist" -Recurse -Force
Copy-Item -Path "database" -Destination "$tempDir\database" -Recurse -Force
Copy-Item -Path ".env" -Destination "$tempDir\.env" -Force
Copy-Item -Path "package.json" -Destination "$tempDir\package.json" -Force
Copy-Item -Path "package-lock.json" -Destination "$tempDir\package-lock.json" -Force
Copy-Item -Path "ecosystem.config.js" -Destination "$tempDir\ecosystem.config.js" -Force
Copy-Item -Path "nginx.conf" -Destination "$tempDir\nginx.conf" -Force

# Create deployment instructions
$deployInstructions = @"
# Coze API Service - Baota Panel Deployment Guide

## Deployment Steps

### 1. Upload Files
Extract this package to /www/wwwroot/coze-freeapi/ directory in Baota Panel

### 2. Install Dependencies
npm install --production --omit=dev

### 3. Configure Environment Variables
Edit .env file with database connection info

### 4. Create Database
Create database in Baota MySQL manager and import database/init.sql

### 5. Configure Node.js Project
Startup file: /www/wwwroot/coze-freeapi/dist/api/app.js

### 6. Start Service
Click start button in Node project management page

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$deployInstructions | Out-File -FilePath "$tempDir\DEPLOY.md" -Encoding UTF8

# Create zip package
Write-Host "Creating deployment package: $deployPackage" -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $deployPackage -Force

# Get file size
$packageSize = [math]::Round((Get-Item $deployPackage).Length / 1MB, 2)

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host ""
Write-Host "=== Deploy Package Created Successfully ===" -ForegroundColor Green
Write-Host "Filename: $deployPackage" -ForegroundColor Cyan
Write-Host "Size: $packageSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package Contents:" -ForegroundColor Yellow
Write-Host "  - dist/ (frontend and backend build files)"
Write-Host "  - database/ (database scripts)"
Write-Host "  - .env (environment config)"
Write-Host "  - package.json & package-lock.json (dependencies)"
Write-Host "  - ecosystem.config.js (PM2 config)"
Write-Host "  - nginx.conf (Nginx config)"
Write-Host "  - DEPLOY.md (deployment instructions)"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Upload $deployPackage to server"
Write-Host "2. Extract to /www/wwwroot/coze-freeapi/"
Write-Host "3. Follow DEPLOY.md instructions"
Write-Host ""
Write-Host "Deployment package creation completed!" -ForegroundColor Green