// Firebase Storage Rules Tests: Admin Role Access Control
// Tests OWASP ASVS V4.3.1 and admin-specific security requirements

import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  initializeFirebaseTestEnvironment,
  cleanupFirebaseTestEnvironment,
  TEST_USERS,
  TEST_FILES,
  createTestFilePath,
  createAuthenticatedContext,
  createFileMetadata
} from './setup';

describe('Firebase Storage Rules: Admin Role Access Control', () => {
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

  describe('OWASP ASVS V4.3.1: Administrative access verification', () => {
    test('should grant admin full access to all user files', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      
      const adminStorage = adminContext.storage();
      const userStorage = userContext.storage();
      
      // Regular user uploads a file
      const userFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'user-file.csv');
      const userFileRef = userStorage.ref(userFilePath);
      
      await expect(userFileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: TEST_FILES.validCsvSmall.contentType,
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
      
      // Admin can access any user's file
      const adminAccessToUserFile = adminStorage.ref(userFilePath);
      await expect(adminAccessToUserFile.getDownloadURL()).toBeAllowed();
      await expect(adminAccessToUserFile.delete()).toBeAllowed();
    });

    test('should verify admin email exactly matches required email', async () => {
      const fakeAdmin = {
        ...TEST_USERS.adminUser,
        email: 'fake-admin@example.com', // Wrong email
        role: 'admin'
      };
      
      const { uid, ...claims } = fakeAdmin;
      const fakeAdminContext = testEnv.authenticatedContext(uid, claims);
      const storage = fakeAdminContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      // Fake admin should not have access to other users' files
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });

    test('should require email verification for admin access', async () => {
      const unverifiedAdmin = {
        ...TEST_USERS.adminUser,
        email_verified: false
      };
      
      const { uid: adminUid, ...adminClaims } = unverifiedAdmin;
      const unverifiedAdminContext = testEnv.authenticatedContext(adminUid, adminClaims);
      const storage = unverifiedAdminContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });
  });

  describe('Admin file operations across all user directories', () => {
    test('should allow admin to create files in any user directory', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const storage = adminContext.storage();
      
      // Admin creates file in user1 directory
      const user1FilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'admin-created.csv');
      const user1FileRef = storage.ref(user1FilePath);
      
      await expect(user1FileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: TEST_FILES.validCsvSmall.contentType,
          customMetadata: createFileMetadata(TEST_USERS.adminUser.uid, { createdBy: 'admin' })
        }
      )).toBeAllowed();
      
      // Admin creates file in user2 directory
      const user2FilePath = createTestFilePath(TEST_USERS.regularUser2.uid, 'admin-audit.csv');
      const user2FileRef = storage.ref(user2FilePath);
      
      await expect(user2FileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: TEST_FILES.validCsvSmall.contentType,
          customMetadata: createFileMetadata(TEST_USERS.adminUser.uid, { purpose: 'audit' })
        }
      )).toBeAllowed();
    });

    test('should allow admin to read files from multiple user directories', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const user1Context = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const user2Context = createAuthenticatedContext(testEnv, TEST_USERS.regularUser2);
      
      const adminStorage = adminContext.storage();
      const user1Storage = user1Context.storage();
      const user2Storage = user2Context.storage();
      
      // Users upload files to their own directories
      const user1FilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'user1-data.csv');
      const user2FilePath = createTestFilePath(TEST_USERS.regularUser2.uid, 'user2-data.csv');
      
      await expect(user1Storage.ref(user1FilePath).put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { contentType: TEST_FILES.validCsvSmall.contentType }
      )).toBeAllowed();
      
      await expect(user2Storage.ref(user2FilePath).put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { contentType: TEST_FILES.validCsvSmall.contentType }
      )).toBeAllowed();
      
      // Admin can read both files
      await expect(adminStorage.ref(user1FilePath).getDownloadURL()).toBeAllowed();
      await expect(adminStorage.ref(user2FilePath).getDownloadURL()).toBeAllowed();
    });

    test('should allow admin to delete files from any user directory', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      
      const adminStorage = adminContext.storage();
      const userStorage = userContext.storage();
      
      // User uploads a file
      const userFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'to-be-deleted.csv');
      const userFileRef = userStorage.ref(userFilePath);
      
      await expect(userFileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { contentType: TEST_FILES.validCsvSmall.contentType }
      )).toBeAllowed();
      
      // Admin can delete the user's file
      const adminDeleteRef = adminStorage.ref(userFilePath);
      await expect(adminDeleteRef.delete()).toBeAllowed();
    });
  });

  describe('Admin role validation edge cases', () => {
    test('should reject admin access with case-sensitive email mismatch', async () => {
      const caseVariantAdmin = {
        ...TEST_USERS.adminUser,
        email: 'TAMZID257@GMAIL.COM' // Uppercase variant
      };
      
      const { uid, ...claims } = caseVariantAdmin;
      const caseVariantContext = testEnv.authenticatedContext(uid, claims);
      const storage = caseVariantContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      // Should be case-sensitive for security
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });

    test('should reject admin role claim without proper email', async () => {
      const roleOnlyFakeAdmin = {
        uid: 'fake-admin-uid',
        email: 'someone-else@example.com',
        role: 'admin', // Claims admin role but wrong email
        email_verified: true,
        replit_auth: true,
      };
      
      const { uid: fakeUid, ...fakeClaims } = roleOnlyFakeAdmin;
      const roleOnlyContext = testEnv.authenticatedContext(fakeUid, fakeClaims);
      const storage = roleOnlyContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });

    test('should handle admin token refresh correctly', async () => {
      const adminWithRefreshToken = {
        ...TEST_USERS.adminUser,
        exp: Math.floor(Date.now() / 1000) + 3600, // Valid expiration
        iat: Math.floor(Date.now() / 1000) - 60,   // Issued recently
        updated_at: Date.now() // Recently updated claims
      };
      
      const { uid: refreshUid, ...refreshClaims } = adminWithRefreshToken;
      const adminContext = testEnv.authenticatedContext(refreshUid, refreshClaims);
      const storage = adminContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'admin-access-test.csv');
      const fileRef = storage.ref(testPath);
      
      // Admin with fresh token should have access
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { contentType: TEST_FILES.validCsvSmall.contentType }
      )).toBeAllowed();
    });
  });

  describe('Admin audit and monitoring capabilities', () => {
    test('should allow admin to access files with audit metadata', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const storage = adminContext.storage();
      
      const auditFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'audit-log.csv');
      const auditFileRef = storage.ref(auditFilePath);
      
      await expect(auditFileRef.put(
        Buffer.from('audit,timestamp,action\n' + 'user1,2025-01-01,upload\n'),
        { 
          contentType: TEST_FILES.validCsvSmall.contentType,
          customMetadata: {
            auditTrail: 'true',
            adminAccess: 'true',
            purpose: 'security_audit',
            accessedBy: TEST_USERS.adminUser.email
          }
        }
      )).toBeAllowed();
    });
  });
});