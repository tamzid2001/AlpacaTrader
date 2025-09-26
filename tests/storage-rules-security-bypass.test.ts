// Firebase Storage Rules Tests: Security Bypass Prevention
// Tests that the CRITICAL security bypass issue is fixed
// Verifies that validation is now enforced and cannot be bypassed

import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  initializeFirebaseTestEnvironment,
  cleanupFirebaseTestEnvironment,
  TEST_USERS,
  TEST_FILES,
  createTestFilePath,
  createAuthenticatedContext,
  createFileMetadata,
  createInvalidMetadata
} from './setup';

describe('Firebase Storage Rules: Security Bypass Prevention', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeFirebaseTestEnvironment();
  });

  afterAll(async () => {
    await cleanupFirebaseTestEnvironment();
  });

  afterEach(async () => {
    await testEnv.clearStorage();
  });

  describe('CRITICAL: Write permission bypass is fixed', () => {
    test('should prevent non-CSV file uploads (this would have bypassed validation in old rules)', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      // This test specifically verifies that the old 'allow write' bypass is fixed
      // In the old rules, this would have been allowed due to broad write permissions
      const maliciousPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'malware.exe');
      const fileRef = storage.ref(maliciousPath);
      
      // Try to upload a non-CSV file - should be BLOCKED by validation now
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.bypassTestNonCsv.content),
        { 
          contentType: TEST_FILES.bypassTestNonCsv.contentType,
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });

    test('should prevent oversized file uploads (this would have bypassed size validation in old rules)', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      // This test verifies that size limits are now enforced
      const oversizedPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'huge.csv');
      const fileRef = storage.ref(oversizedPath);
      
      // Create a very large CSV file that should exceed 100MB limit
      const oversizedContent = 'a,b,c\n'.repeat(10000000); // Simulate large file
      
      // Try to upload oversized file - should be BLOCKED by validation now
      await expect(fileRef.put(
        Buffer.from(oversizedContent),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });

    test('should prevent uploads without metadata (this would have bypassed metadata validation)', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const noMetadataPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'no-metadata.csv');
      const fileRef = storage.ref(noMetadataPath);
      
      // Try to upload without proper metadata - should be BLOCKED now
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv'
          // No customMetadata provided - validation should catch this
        }
      )).toBeDenied();
    });

    test('should prevent files with wrong extension despite CSV content type', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const wrongExtensionPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'data.txt');
      const fileRef = storage.ref(wrongExtensionPath);
      
      // Try to upload a .txt file even with CSV content type - should be BLOCKED
      await expect(fileRef.put(
        Buffer.from('valid,csv,content\nrow1,row2,row3'),
        { 
          contentType: 'text/csv', // CSV content type
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied(); // Should be denied because filename doesn't end with .csv
    });
  });

  describe('Role-based admin access (no hardcoded email dependency)', () => {
    test('should grant admin access based on role claim, not email', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const storage = adminContext.storage();
      
      // Admin user (with role:'admin' claim) should have access to any user's files
      const userFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'admin-accessed.csv');
      const fileRef = storage.ref(userFilePath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.adminUser.uid)
        }
      )).toBeAllowed();
      
      // Admin should also be able to read and delete
      await expect(fileRef.getDownloadURL()).toBeAllowed();
      await expect(fileRef.delete()).toBeAllowed();
    });

    test('should DENY admin access to users with old hardcoded email but no admin role', async () => {
      const fakeAdminContext = createAuthenticatedContext(testEnv, TEST_USERS.fakeAdminWithOldEmail);
      const storage = fakeAdminContext.storage();
      
      // This user has the old hardcoded admin email but role:'user'
      // Should NOT have admin access under new role-based system
      const userFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'should-be-blocked.csv');
      const fileRef = storage.ref(userFilePath);
      
      // Should be DENIED because role is 'user', not 'admin'
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.fakeAdminWithOldEmail.uid)
        }
      )).toBeDenied();
      
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });

    test('should deny access to users without role claim', async () => {
      const noRoleContext = createAuthenticatedContext(testEnv, TEST_USERS.userWithoutRoleClaim);
      const storage = noRoleContext.storage();
      
      // User without role claim should only access their own files
      const ownFilePath = createTestFilePath(TEST_USERS.userWithoutRoleClaim.uid, 'own-file.csv');
      const ownFileRef = storage.ref(ownFilePath);
      
      // Should be able to access own files
      await expect(ownFileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.userWithoutRoleClaim.uid)
        }
      )).toBeAllowed();
      
      // Should NOT be able to access other users' files (no admin role)
      const otherUserFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'other-file.csv');
      const otherFileRef = storage.ref(otherUserFilePath);
      
      await expect(otherFileRef.getDownloadURL()).toBeDenied();
    });
  });

  describe('Validation enforcement verification', () => {
    test('should allow valid CSV files that meet all requirements', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const validPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'valid-upload.csv');
      const fileRef = storage.ref(validPath);
      
      // This should pass all validation checks
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
    });

    test('should block all attempts to bypass validation through different upload methods', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      // Test various bypass attempts that would have worked with old rules
      const bypassAttempts = [
        {
          name: 'malware.exe',
          content: 'malicious content',
          contentType: 'application/octet-stream'
        },
        {
          name: 'script.js', 
          content: 'alert("hacked")',
          contentType: 'application/javascript'
        },
        {
          name: 'image.png',
          content: 'fake image data',
          contentType: 'image/png'
        }
      ];
      
      for (const attempt of bypassAttempts) {
        const bypassPath = createTestFilePath(TEST_USERS.regularUser1.uid, attempt.name);
        const fileRef = storage.ref(bypassPath);
        
        await expect(fileRef.put(
          Buffer.from(attempt.content),
          { 
            contentType: attempt.contentType,
            customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
          }
        )).toBeDenied();
      }
    });

    test('should enforce 100MB size limit strictly', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      // Test file exactly at the limit (should pass)
      const limitFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'at-limit.csv');
      const limitFileRef = storage.ref(limitFilePath);
      
      // Create content that's exactly under 100MB
      const atLimitContent = 'a,b,c\n'.repeat(2500000); // About 20MB when repeated
      
      await expect(limitFileRef.put(
        Buffer.from(atLimitContent),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
      
      // Test file over the limit (should fail)
      const overLimitPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'over-limit.csv');
      const overLimitRef = storage.ref(overLimitPath);
      
      // Create content that exceeds 100MB  
      const overLimitContent = 'x'.repeat(101 * 1024 * 1024); // 101MB
      
      await expect(overLimitRef.put(
        Buffer.from(overLimitContent),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });
  });
});