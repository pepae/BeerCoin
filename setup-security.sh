#!/bin/bash
# Security cleanup script for BeerCoin project
# This script helps secure existing wallet files and set up proper environment

echo "🔒 BeerCoin Security Setup Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the BeerCoin root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Check for existing sensitive files
echo "🔍 Checking for sensitive files..."
sensitive_files=()

# Check for wallet files
if find . -name "*.wallet.json" -type f 2>/dev/null | grep -q .; then
    echo "⚠️  Found wallet.json files:"
    find . -name "*.wallet.json" -type f
    sensitive_files+=("wallet.json files")
fi

if [ -f "test-wallets.json" ]; then
    echo "⚠️  Found test-wallets.json"
    sensitive_files+=("test-wallets.json")
fi

if [ -f ".env" ]; then
    echo "✅ Found .env file (this is good - it should contain your secrets)"
else
    echo "📝 No .env file found - you'll need to create one"
fi

echo ""

# Backup and secure sensitive files
if [ ${#sensitive_files[@]} -gt 0 ]; then
    echo "🚨 SECURITY ACTION REQUIRED!"
    echo "Found ${#sensitive_files[@]} types of sensitive files that should not be committed to git."
    echo ""
    
    read -p "Do you want to back up these files to a secure location? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create secure backup directory
        backup_dir="$HOME/.beercoin-secure-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        echo "📦 Creating secure backup in: $backup_dir"
        
        # Backup wallet files
        find . -name "*.wallet.json" -type f -exec cp {} "$backup_dir/" \; 2>/dev/null
        [ -f "test-wallets.json" ] && cp "test-wallets.json" "$backup_dir/"
        
        # Set secure permissions
        chmod 700 "$backup_dir"
        chmod 600 "$backup_dir"/*
        
        echo "✅ Backup created successfully!"
        echo "🔒 Permissions set to owner-only access"
        echo ""
        echo "📍 Backup location: $backup_dir"
        echo "   Make sure to copy this to a secure location (password manager, encrypted drive, etc.)"
    fi
fi

# Create .env from .wallet.json if it exists
if [ -f "beercoin-dapp/.wallet.json" ] && [ ! -f ".env" ]; then
    echo ""
    echo "🔧 Setting up .env file from existing wallet..."
    
    # Extract private key from wallet.json
    private_key=$(cat "beercoin-dapp/.wallet.json" | grep -o '"privateKey": *"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$private_key" ]; then
        cat > .env << EOF
# BeerCoin Environment Configuration
# Generated from existing wallet file on $(date)

# Wallet Configuration
PRIVATE_KEY=$private_key

# Network Configuration
NODE_ENV=development
DEBUG=true

# Contract Addresses (Gnosis Chain)
BEERCOIN_ADDRESS=0x5CcC0D40017aE800f7b432e9E76b4d31572A240B
DISTRIBUTOR_ADDRESS=0x9E6233c16288949728b94FF134db1453AFfa49B4
EOF
        
        chmod 600 .env
        echo "✅ Created .env file with your private key"
        echo "🔒 Set secure permissions (owner read/write only)"
    else
        echo "❌ Could not extract private key from wallet file"
    fi
fi

# Check git status
echo ""
echo "📊 Git Status Check..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Git repository detected"
    
    # Check if .gitignore exists and is proper
    if [ -f ".gitignore" ]; then
        if grep -q "\.wallet\.json" .gitignore && grep -q "\.env" .gitignore; then
            echo "✅ .gitignore properly configured for sensitive files"
        else
            echo "⚠️  .gitignore may need updates for sensitive files"
        fi
    else
        echo "❌ No .gitignore found - this is a security risk!"
    fi
    
    # Check if any sensitive files are staged
    if git diff --cached --name-only | grep -E '\.(wallet\.json|env)$|test-wallets\.json'; then
        echo "🚨 WARNING: Sensitive files are staged for commit!"
        echo "   Run: git reset HEAD <filename> to unstage them"
    fi
    
    # Check if any sensitive files are tracked
    if git ls-files | grep -E '\.(wallet\.json|env)$|test-wallets\.json'; then
        echo "🚨 WARNING: Sensitive files are tracked by git!"
        echo "   These should be removed from git history"
    fi
else
    echo "ℹ️  Not a git repository or git not available"
fi

echo ""
echo "📋 Security Checklist:"
echo "======================"
echo "□ Sensitive files backed up securely"
echo "□ .env file created with private key"
echo "□ .gitignore properly configured"
echo "□ No sensitive files committed to git"
echo "□ Proper file permissions set (600 for secrets)"
echo "□ Team members aware of security practices"
echo ""
echo "📖 Next Steps:"
echo "1. Review the SECURITY.md file for detailed guidelines"
echo "2. Ensure .env file contains your actual private key"
echo "3. Test scripts with: node test-registration-flow.js"
echo "4. Remove any sensitive files from git history if needed"
echo ""
echo "🎉 Security setup complete!"
echo "Remember: Never commit private keys or wallet files!"
