# PowerShell Security setup script for BeerCoin project
# This script helps secure existing wallet files and set up proper environment

Write-Host "🔒 BeerCoin Security Setup Script" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the BeerCoin root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Current directory: $PWD" -ForegroundColor Blue
Write-Host ""

# Check for existing sensitive files
Write-Host "🔍 Checking for sensitive files..." -ForegroundColor Cyan
$sensitiveFiles = @()

# Check for wallet files
$walletFiles = Get-ChildItem -Recurse -Filter "*.wallet.json" -ErrorAction SilentlyContinue
if ($walletFiles) {
    Write-Host "⚠️  Found wallet.json files:" -ForegroundColor Yellow
    $walletFiles | ForEach-Object { Write-Host "   $($_.FullName)" }
    $sensitiveFiles += "wallet.json files"
}

if (Test-Path "test-wallets.json") {
    Write-Host "⚠️  Found test-wallets.json" -ForegroundColor Yellow
    $sensitiveFiles += "test-wallets.json"
}

if (Test-Path ".env") {
    Write-Host "✅ Found .env file (this is good - it should contain your secrets)" -ForegroundColor Green
} else {
    Write-Host "📝 No .env file found - you'll need to create one" -ForegroundColor Blue
}

Write-Host ""

# Backup and secure sensitive files
if ($sensitiveFiles.Count -gt 0) {
    Write-Host "🚨 SECURITY ACTION REQUIRED!" -ForegroundColor Red
    Write-Host "Found $($sensitiveFiles.Count) types of sensitive files that should not be committed to git." -ForegroundColor Yellow
    Write-Host ""
    
    $response = Read-Host "Do you want to back up these files to a secure location? (y/n)"
    
    if ($response -match "^[Yy]$") {
        # Create secure backup directory
        $backupDir = "$env:USERPROFILE\.beercoin-secure-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        Write-Host "📦 Creating secure backup in: $backupDir" -ForegroundColor Blue
        
        # Backup wallet files
        Get-ChildItem -Recurse -Filter "*.wallet.json" -ErrorAction SilentlyContinue | 
            ForEach-Object { Copy-Item $_.FullName -Destination $backupDir }
        
        if (Test-Path "test-wallets.json") {
            Copy-Item "test-wallets.json" -Destination $backupDir
        }
        
        Write-Host "✅ Backup created successfully!" -ForegroundColor Green
        Write-Host "📍 Backup location: $backupDir" -ForegroundColor Blue
        Write-Host "   Make sure to copy this to a secure location (password manager, encrypted drive, etc.)" -ForegroundColor Yellow
    }
}

# Create .env from .wallet.json if it exists
if ((Test-Path "beercoin-dapp\.wallet.json") -and (-not (Test-Path ".env"))) {
    Write-Host ""
    Write-Host "🔧 Setting up .env file from existing wallet..." -ForegroundColor Cyan
    
    try {
        # Read wallet file and extract private key
        $walletContent = Get-Content "beercoin-dapp\.wallet.json" | ConvertFrom-Json
        $privateKey = $walletContent.privateKey
        
        if ($privateKey) {
            $envContent = @"
# BeerCoin Environment Configuration
# Generated from existing wallet file on $(Get-Date)

# Wallet Configuration
PRIVATE_KEY=$privateKey

# Network Configuration
NODE_ENV=development
DEBUG=true

# Contract Addresses (Gnosis Chain)
BEERCOIN_ADDRESS=0x5CcC0D40017aE800f7b432e9E76b4d31572A240B
DISTRIBUTOR_ADDRESS=0x9E6233c16288949728b94FF134db1453AFfa49B4
"@
            
            Set-Content -Path ".env" -Value $envContent
            Write-Host "✅ Created .env file with your private key" -ForegroundColor Green
        } else {
            Write-Host "❌ Could not extract private key from wallet file" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error reading wallet file: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check git status
Write-Host ""
Write-Host "📊 Git Status Check..." -ForegroundColor Cyan

try {
    git rev-parse --git-dir 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git repository detected" -ForegroundColor Green
        
        # Check if .gitignore exists and is proper
        if (Test-Path ".gitignore") {
            $gitignoreContent = Get-Content ".gitignore" -Raw
            if ($gitignoreContent -match "\.wallet\.json" -and $gitignoreContent -match "\.env") {
                Write-Host "✅ .gitignore properly configured for sensitive files" -ForegroundColor Green
            } else {
                Write-Host "⚠️  .gitignore may need updates for sensitive files" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ No .gitignore found - this is a security risk!" -ForegroundColor Red
        }
        
        # Check if any sensitive files are staged
        $stagedFiles = git diff --cached --name-only
        $sensitiveStagedFiles = $stagedFiles | Where-Object { $_ -match '\.(wallet\.json|env)$|test-wallets\.json' }
        if ($sensitiveStagedFiles) {
            Write-Host "🚨 WARNING: Sensitive files are staged for commit!" -ForegroundColor Red
            Write-Host "   Run: git reset HEAD <filename> to unstage them" -ForegroundColor Yellow
        }
        
        # Check if any sensitive files are tracked
        $trackedFiles = git ls-files
        $sensitiveTrackedFiles = $trackedFiles | Where-Object { $_ -match '\.(wallet\.json|env)$|test-wallets\.json' }
        if ($sensitiveTrackedFiles) {
            Write-Host "🚨 WARNING: Sensitive files are tracked by git!" -ForegroundColor Red
            Write-Host "   These should be removed from git history" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  Not a git repository or git not available" -ForegroundColor Blue
    }
} catch {
    Write-Host "ℹ️  Git not available or not a git repository" -ForegroundColor Blue
}

Write-Host ""
Write-Host "📋 Security Checklist:" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host "□ Sensitive files backed up securely"
Write-Host "□ .env file created with private key"
Write-Host "□ .gitignore properly configured"
Write-Host "□ No sensitive files committed to git"
Write-Host "□ Proper file permissions set"
Write-Host "□ Team members aware of security practices"
Write-Host ""
Write-Host "📖 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review the SECURITY.md file for detailed guidelines"
Write-Host "2. Ensure .env file contains your actual private key"
Write-Host "3. Test scripts with: node test-registration-flow.js"
Write-Host "4. Remove any sensitive files from git history if needed"
Write-Host ""
Write-Host "🎉 Security setup complete!" -ForegroundColor Green
Write-Host "Remember: Never commit private keys or wallet files!" -ForegroundColor Red
