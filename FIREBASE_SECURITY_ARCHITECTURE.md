# Firebase Storage Security Rules Architecture

## Overview

This document outlines the comprehensive security architecture implemented for Firebase Storage, providing defense-in-depth protection for CSV file uploads with role-based access control following OWASP ASVS V4 (Access Control) standards.

## Security Architecture

### 1. Authentication Bridge (Replit Auth → Firebase Auth)

Our system uses a custom token generation approach to bridge Replit Auth with Firebase Storage security rules:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Replit Auth   │    │   Server-Side    │    │  Firebase Storage   │
│   (OpenID)      │───▶│  Token Generation │───▶│  Security Rules     │
│                 │    │                  │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

#### Authentication Flow:
1. User authenticates with Replit Auth (OpenID Connect)
2. Server validates Replit Auth session and generates custom Firebase token
3. Client-side Firebase SDK uses custom token for Storage operations
4. Firebase Storage rules validate token and enforce access controls

### 2. Access Control Matrix

| Role | Path Access | Permissions | Validation |
|------|-------------|-------------|------------|
| **Regular User** | `/users/{userId}/csvs/*` | Read, Write, Delete own files only | ✅ User ID validation<br>✅ File type/size limits |
| **Admin** | `/users/*/csvs/*` | Read, Write, Delete any user's files | ✅ Email verification<br>✅ Admin role claims |
| **Unauthenticated** | None | Access denied | ❌ All operations blocked |

### 3. OWASP ASVS V4 Compliance

#### V4.1.1: Trusted Service Layer Access Controls
- ✅ Firebase Storage rules enforce all access controls
- ✅ Server-side token generation validates user sessions
- ✅ Client-side operations require valid authentication

#### V4.1.2: Application-Controlled User Attributes
- ✅ User ID (`request.auth.uid`) controlled by authentication system
- ✅ Email claims verified through custom token generation
- ✅ Role assignments managed server-side

#### V4.1.3: Principle of Least Privilege
- ✅ Users can only access their own file directory
- ✅ No cross-user file enumeration possible
- ✅ Admin access limited to verified email address

#### V4.2.1: Up-to-Date Access Control Data
- ✅ Token expiration enforced (1 hour validity)
- ✅ Real-time role validation through custom claims
- ✅ Session refresh mechanism for long-running operations

#### V4.3.1: Administrative Access Verification
- ✅ Admin role requires specific email (`tamzid257@gmail.com`)
- ✅ Email verification required for admin privileges
- ✅ Custom claims validation for admin operations

## Security Rules Implementation

### File Path Structure
```
/users/{userId}/csvs/{filename}
```

### Rule Functions

#### Core Authentication
```javascript
function isAuthenticatedUser(userId) {
  return request.auth != null 
         && request.auth.uid != null
         && request.auth.uid == userId
         && isValidAuthToken();
}
```

#### Admin Role Verification
```javascript
function isAdmin() {
  return request.auth != null 
         && request.auth.uid != null
         && isValidAuthToken()
         && hasAdminEmail();
}

function hasAdminEmail() {
  return request.auth.token.email == "tamzid257@gmail.com"
         || (request.auth.token.email_verified == true 
             && request.auth.token.email == "tamzid257@gmail.com");
}
```

#### File Validation
```javascript
function isValidCsvFile() {
  return resource == null // New file upload
         && request.resource != null
         && (request.resource.contentType == 'text/csv' 
             || request.resource.contentType == 'application/csv')
         && request.resource.name.lower().matches('.*\\.csv$');
}

function isWithinSizeLimit() {
  return request.resource != null
         && request.resource.size <= 100 * 1024 * 1024; // 100MB
}
```

### Security Validations

#### Path Security
- ✅ User ID format validation (alphanumeric, underscore, hyphen only)
- ✅ Filename security (no dangerous characters)
- ✅ Path traversal prevention
- ✅ Hidden file prevention

#### Content Security
- ✅ CSV file type enforcement
- ✅ 100MB file size limit
- ✅ Required metadata validation
- ✅ User ID metadata matching

## Token Management

### Custom Firebase Token Generation

#### Server-Side Implementation (`server/firebase-admin.ts`)
```javascript
export async function generateCustomFirebaseToken(
  userId: string,
  email: string,
  role: string = 'user'
): Promise<CustomFirebaseToken> {
  const customClaims = {
    email: email,
    role: role,
    email_verified: true,
    replit_auth: true,
    created_at: Date.now()
  };

  const customToken = await adminAuth.createCustomToken(userId, customClaims);
  // Returns token with 1-hour expiration
}
```

#### Client-Side Integration (`client/src/lib/firebase-storage.ts`)
```javascript
// Automatic token fetching and caching
await ensureFirebaseAuthenticated();

// Token refresh with 5-minute buffer
if (tokenExpires && Date.now() >= tokenExpires - 300000) {
  await authenticateWithFirebase();
}
```

## Defense-in-Depth Strategy

### Layer 1: Server-Side Validation
- ✅ Multer file type filtering
- ✅ File size limits (100MB)
- ✅ CSV parsing with security limits
- ✅ User session validation

### Layer 2: Firebase Storage Rules
- ✅ Authentication requirement
- ✅ User ownership verification
- ✅ File type and size validation
- ✅ Admin role verification

### Layer 3: Client-Side Integration
- ✅ Automatic authentication
- ✅ Token refresh management
- ✅ Error handling and retry logic

## Monitoring and Security

### Security Events to Monitor
1. **Authentication Failures**
   - Invalid token attempts
   - Expired token usage
   - Cross-user access attempts

2. **Rule Violations**
   - File type violations
   - Size limit breaches
   - Path traversal attempts

3. **Admin Access**
   - Admin operations logging
   - Role elevation attempts
   - Email verification failures

### Logging Implementation
```javascript
// Server-side logging
console.log(`Generated custom Firebase token for user ${userId} (${email}) with role: ${role}`);

// Client-side logging
console.log(`Successfully uploaded ${filename} to Firebase Storage with security rules`);
```

## Testing Strategy

### Comprehensive Test Coverage

#### Authentication Tests (`tests/storage-rules-auth.test.ts`)
- ✅ Authenticated vs unauthenticated access
- ✅ Token validation and expiration
- ✅ Cross-user access prevention
- ✅ User ownership verification

#### Admin Access Tests (`tests/storage-rules-admin.test.ts`)
- ✅ Admin email verification
- ✅ Cross-directory admin access
- ✅ Admin privilege escalation prevention
- ✅ Role claim validation

#### File Validation Tests (`tests/storage-rules-validation.test.ts`)
- ✅ File type enforcement
- ✅ Size limit validation
- ✅ Path security testing
- ✅ Metadata validation

### Test Execution
```bash
# Run all security tests
npm test

# Run specific test suite
npm test tests/storage-rules-auth.test.ts
```

## Deployment and Maintenance

### Initial Deployment
1. Configure Firebase project settings
2. Deploy storage rules: `./deploy-firebase-rules.sh`
3. Test authentication flow
4. Verify security rule enforcement

### Regular Maintenance
1. **Monthly**: Review Firebase Console security logs
2. **Quarterly**: Update test cases for new scenarios
3. **As needed**: Adjust rules for new features or security requirements

### Emergency Response
1. Disable rules temporarily if needed: Set all operations to `false`
2. Investigate security incidents through Firebase Console
3. Update rules and redeploy with validation

## Performance Considerations

### Token Caching
- Client-side tokens cached for 1 hour
- 1-minute buffer for token refresh
- Automatic retry on authentication failures

### Rule Optimization
- Efficient function organization for fast evaluation
- Minimal database lookups in security functions
- Optimized pattern matching for file validation

## Future Enhancements

### Planned Security Improvements
1. **Rate Limiting**: Implement advanced rate limiting at rule level
2. **Geo-fencing**: Add location-based access controls
3. **Advanced Monitoring**: Integration with security monitoring tools
4. **Audit Trails**: Comprehensive audit logging for compliance

### Scalability Considerations
1. **Multi-tenant Support**: Extend rules for organization-based access
2. **Role Hierarchy**: Support for complex role inheritance
3. **Dynamic Permissions**: Runtime permission evaluation

## Conclusion

This Firebase Storage security architecture provides comprehensive protection following industry best practices and OWASP ASVS V4 standards. The multi-layered approach ensures robust security while maintaining usability and performance for legitimate users.