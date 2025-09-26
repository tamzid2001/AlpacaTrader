#!/bin/bash

# Firebase Storage Security Rules Deployment Script
# This script deploys Firebase Storage security rules with proper validation

set -e  # Exit on any error

echo "🔥 Firebase Storage Security Rules Deployment"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to Firebase${NC}"
    echo "Please login first:"
    firebase login
fi

# Check if storage.rules file exists
if [ ! -f "storage.rules" ]; then
    echo -e "${RED}❌ storage.rules file not found${NC}"
    echo "Make sure you are in the project root directory with storage.rules file"
    exit 1
fi

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ firebase.json configuration file not found${NC}"
    echo "Make sure firebase.json is configured properly"
    exit 1
fi

# Validate storage rules syntax
echo -e "${BLUE}📋 Validating Firebase Storage rules syntax...${NC}"
if firebase deploy --only storage --dry-run; then
    echo -e "${GREEN}✅ Storage rules syntax is valid${NC}"
else
    echo -e "${RED}❌ Storage rules syntax validation failed${NC}"
    echo "Please fix the syntax errors in storage.rules file"
    exit 1
fi

# Run Firebase Rules Unit Tests (if available)
if [ -f "jest.config.js" ] && [ -d "tests" ]; then
    echo -e "${BLUE}🧪 Running Firebase Storage Rules unit tests...${NC}"
    if npm test 2>/dev/null || yarn test 2>/dev/null; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed. Continue deployment? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  No test configuration found. Skipping tests.${NC}"
fi

# Confirm deployment
echo -e "${BLUE}📤 Ready to deploy Firebase Storage security rules${NC}"
echo "This will:"
echo "  • Deploy storage.rules to your Firebase project"
echo "  • Apply OWASP ASVS V4 compliant access controls"
echo "  • Enable role-based access control (RBAC)"
echo "  • Enforce file type and size validation"
echo ""
echo -e "${YELLOW}Continue with deployment? (y/N)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy storage rules
echo -e "${BLUE}🚀 Deploying Firebase Storage security rules...${NC}"
if firebase deploy --only storage; then
    echo -e "${GREEN}✅ Firebase Storage rules deployed successfully!${NC}"
    echo ""
    echo "🔐 Security Features Deployed:"
    echo "  ✅ User-based access control (users can only access their own files)"
    echo "  ✅ Admin role access (tamzid257@gmail.com has full access)"
    echo "  ✅ File type validation (CSV files only)"
    echo "  ✅ File size limits (100MB maximum)"
    echo "  ✅ Path security (prevents traversal attacks)"
    echo "  ✅ Metadata validation requirements"
    echo "  ✅ OWASP ASVS V4 compliance"
    echo ""
    echo "📊 Next Steps:"
    echo "  1. Monitor Firebase Console for rule violations"
    echo "  2. Check application logs for authentication issues"
    echo "  3. Test file upload/download functionality"
    echo "  4. Review security audit logs"
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the error messages above and try again"
    exit 1
fi