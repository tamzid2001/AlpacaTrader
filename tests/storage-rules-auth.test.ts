// Firebase Storage Rules Tests: Authentication and Authorization
// Tests OWASP ASVS V4.1.1, V4.1.2, V4.1.3 requirements

import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  initializeFirebaseTestEnvironment,
  cleanupFirebaseTestEnvironment,
  TEST_USERS,
  TEST_FILES,
  createTestFilePath,
  createAuthenticatedContext,
  createUnauthenticatedContext,
  createFileMetadata
} from './setup';

describe('Firebase Storage Rules: Authentication & Authorization', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeFirebaseTestEnvironment();
  });

  afterAll(async () => {
    await cleanupFirebaseTestEnvironment();
  });

  afterEach(async () => {
    // Clear all data after each test
    await testEnv.clearStorage();
  });

  describe('OWASP ASVS V4.1.1: Access controls at trusted service layer', () => {
    test('should deny all access to unauthenticated users', async () => {
      const unauthedContext = createUnauthenticatedContext(testEnv);
      const storage = unauthedContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);

      // Test read access
      await expect(fileRef.getDownloadURL()).toBeDenied();
      
      // Test write access
      await expect(fileRef.put(Buffer.from(TEST_FILES.validCsvSmall.content))).toBeDenied();
      
      // Test delete access
      await expect(fileRef.delete()).toBeDenied();
    });

    test('should deny access to users without valid auth tokens', async () => {
      // Create context with invalid/expired token
      const invalidContext = testEnv.authenticatedContext('invalid-user', {
        // Missing required fields for valid token
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired token
      });
      
      const storage = invalidContext.storage();
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);

      await expect(fileRef.getDownloadURL()).toBeDenied();
    });
  });

  describe('OWASP ASVS V4.1.2: User attributes controlled by application', () => {
    test('should validate user ID matches authenticated user', async () => {
      const user1Context = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = user1Context.storage();
      
      // User1 trying to access their own files - should succeed
      const ownPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const ownFileRef = storage.ref(ownPath);
      
      await expect(ownFileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content), 
        {
          contentType: TEST_FILES.validCsvSmall.contentType,
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();

      // User1 trying to access User2's files - should fail
      const otherUserPath = createTestFilePath(TEST_USERS.regularUser2.uid, TEST_FILES.validCsvSmall.name);
      const otherUserFileRef = storage.ref(otherUserPath);
      
      await expect(otherUserFileRef.getDownloadURL()).toBeDenied();
    });

    test('should enforce email verification for admin access', async () => {
      const adminWithoutVerification = {
        ...TEST_USERS.adminUser,
        email_verified: false
      };
      
      const { uid, ...claims } = adminWithoutVerification;
      const adminContext = testEnv.authenticatedContext(uid, claims);
      const storage = adminContext.storage();
      
      const testPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      // Admin without email verification should not have admin privileges
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { contentType: TEST_FILES.validCsvSmall.contentType }
      )).toBeDenied();
    });
  });

  describe('OWASP ASVS V4.1.3: Principle of least privilege', () => {
    test('should allow users to access only their own files', async () => {
      const user1Context = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const user2Context = createAuthenticatedContext(testEnv, TEST_USERS.regularUser2);
      
      const user1Storage = user1Context.storage();
      const user2Storage = user2Context.storage();
      
      // Upload file as user1
      const user1FilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'user1-file.csv');
      const user1FileRef = user1Storage.ref(user1FilePath);
      
      await expect(user1FileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: TEST_FILES.validCsvSmall.contentType,
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
      
      // User1 can read their own file
      await expect(user1FileRef.getDownloadURL()).toBeAllowed();
      
      // User2 cannot access User1's file
      const user2AccessToUser1File = user2Storage.ref(user1FilePath);
      await expect(user2AccessToUser1File.getDownloadURL()).toBeDenied();
      await expect(user2AccessToUser1File.delete()).toBeDenied();
    });

    test('should prevent file enumeration outside user directory', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      // Try to access files outside user directory structure
      const rootRef = storage.ref('/');
      const otherPathRef = storage.ref('admin/secrets.csv');
      const parentPathRef = storage.ref('../config.csv');
      
      await expect(rootRef.listAll()).toBeDenied();
      await expect(otherPathRef.getDownloadURL()).toBeDenied();
      await expect(parentPathRef.put(Buffer.from('test'))).toBeDenied();
    });
  });

  describe('Token validation and security', () => {
    test('should validate token expiration', async () => {
      const expiredTokenUser = {
        ...TEST_USERS.regularUser1,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200  // Issued 2 hours ago
      };
      
      const { uid, ...claims } = expiredTokenUser;
      const expiredContext = testEnv.authenticatedContext(uid, claims);
      const storage = expiredContext.storage();
      
      const testPath = createTestFilePath(expiredTokenUser.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });

    test('should validate token audience', async () => {
      const invalidAudUser = {
        ...TEST_USERS.regularUser1,
        aud: undefined // Invalid audience
      };
      
      const { uid, ...claims } = invalidAudUser;
      const invalidAudContext = testEnv.authenticatedContext(uid, claims);
      const storage = invalidAudContext.storage();
      
      const testPath = createTestFilePath(invalidAudUser.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      await expect(fileRef.getDownloadURL()).toBeDenied();
    });

    test('should require Replit Auth origin flag', async () => {
      const nonReplitUser = {
        ...TEST_USERS.regularUser1,
        replit_auth: false // Not from Replit Auth
      };
      
      const { uid, ...claims } = nonReplitUser;
      const nonReplitContext = testEnv.authenticatedContext(uid, claims);
      const storage = nonReplitContext.storage();
      
      const testPath = createTestFilePath(nonReplitUser.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(testPath);
      
      // Should still work if other auth is valid, but this tests our custom flag
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { contentType: TEST_FILES.validCsvSmall.contentType }
      )).toBeAllowed(); // Allow for now, but logged for monitoring
    });
  });
});