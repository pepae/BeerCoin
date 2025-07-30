# 🔒 BeerCoin Security Guide

## ⚠️ CRITICAL SECURITY NOTICE

This document outlines essential security practices for the BeerCoin project. **FAILURE TO FOLLOW THESE GUIDELINES COULD RESULT IN LOSS OF FUNDS.**

## 🔐 Private Key Security

### DO NOT COMMIT THESE FILES:
- `.env` files
- `.wallet.json` files
- `test-wallets.json`
- Any file containing private keys or mnemonics
- Files with names containing "private", "secret", "key", or "wallet"

### ✅ SAFE PRACTICES:

1. **Use Environment Variables**
   ```bash
   # Set your private key as an environment variable
   export PRIVATE_KEY=0xYourPrivateKeyHere
   
   # Or create a .env file (which is gitignored)
   echo "PRIVATE_KEY=0xYourPrivateKeyHere" > .env
   ```

2. **Secure Storage**
   - Store private keys in password managers
   - Use hardware wallets for production funds
   - Never share private keys via email, chat, or other insecure channels

3. **Access Control**
   - Limit access to production private keys
   - Use separate wallets for development and production
   - Regularly rotate development keys

### ❌ DANGEROUS PRACTICES:
- Hardcoding private keys in source code
- Committing wallet files to version control
- Sharing private keys in plain text
- Using production keys for testing

## 🛡️ Repository Security

### Files Protected by .gitignore:
```
# Private keys and wallet files
*.wallet.json
.wallet.json
test-wallets.json
*.privatekey
*.mnemonic

# Environment files
.env
.env.local
.env.*.local

# Build outputs
node_modules/
dist/
cache/
artifacts/

# Logs and temporary files
*.log
tmp/
temp/
```

### Checking for Exposed Secrets:
```bash
# Check git history for accidentally committed secrets
git log --grep="private"
git log --grep="secret"
git log --grep="key"

# Search current files for potential secrets
grep -r "private" . --exclude-dir=node_modules
grep -r "0x[a-fA-F0-9]{64}" . --exclude-dir=node_modules
```

## 🔧 Development Setup

### 1. Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd BeerCoin

# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

### 2. Environment Configuration
```bash
# Example .env file content
PRIVATE_KEY=0xYourActualPrivateKeyHere
NODE_ENV=development
DEBUG=true
```

### 3. Running Scripts Safely
```bash
# All scripts now use environment variables
node test-registration-flow.js
node register-joe.js
node create-trusted-user.js
```

## 🚨 Emergency Response

### If Private Keys Are Exposed:

1. **IMMEDIATELY** transfer all funds to a new wallet
2. **STOP** using the compromised wallet
3. **ROTATE** all associated keys and passwords
4. **REVIEW** git history to ensure no other secrets are exposed
5. **UPDATE** all team members about the incident

### Git History Cleanup (if needed):
```bash
# WARNING: This rewrites history and should be used carefully
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .wallet.json' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team first!)
git push origin --force --all
```

## 📊 Security Monitoring

### Regular Security Checks:
1. **Weekly**: Review committed files for accidental secrets
2. **Monthly**: Audit wallet balances and transaction history
3. **Quarterly**: Rotate development keys and passwords

### Automated Checks:
```bash
# Add to your CI/CD pipeline
npm install --save-dev git-secrets
git secrets --scan
```

## 🏗️ Production Deployment

### Environment Separation:
- **Development**: Use test networks and disposable keys
- **Staging**: Mirror production setup with test funds
- **Production**: Use secure key management and monitoring

### Key Management for Production:
- Use cloud key management services (AWS KMS, Azure Key Vault)
- Implement multi-signature wallets for high-value operations
- Set up monitoring and alerting for unusual transactions

## 📚 Additional Resources

- [Ethereum Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Git Secrets Documentation](https://github.com/awslabs/git-secrets)

## 🆘 Support

If you suspect a security issue:
1. **DO NOT** post about it publicly
2. Contact the development team immediately
3. Follow the emergency response procedures above

---

**Remember: Security is everyone's responsibility. When in doubt, ask for help!**
