// Firebase Storage Rules Tests: File Validation and Security
// Tests file size limits, content type validation, and security measures

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

describe('Firebase Storage Rules: File Validation and Security', () => {
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

  describe('File type validation', () => {
    test('should allow valid CSV files', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const validCsvPath = createTestFilePath(TEST_USERS.regularUser1.uid, TEST_FILES.validCsvSmall.name);
      const fileRef = storage.ref(validCsvPath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
    });

    test('should allow CSV files with alternative content types', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const csvPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'alternative.csv');
      const fileRef = storage.ref(csvPath);
      
      // Test application/csv content type
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'application/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
    });

    test('should reject non-CSV file types', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const invalidPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'document.txt');
      const fileRef = storage.ref(invalidPath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.invalidTypeFile.content),
        { 
          contentType: TEST_FILES.invalidTypeFile.contentType,
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });

    test('should reject files without CSV extension', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const noExtensionPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'data');
      const fileRef = storage.ref(noExtensionPath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });

    test('should reject files with dangerous extensions', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const dangerousExtensions = ['malware.exe.csv', 'script.js.csv', '../escape.csv'];
      
      for (const dangerousFile of dangerousExtensions) {
        const dangerousPath = createTestFilePath(TEST_USERS.regularUser1.uid, dangerousFile);
        const fileRef = storage.ref(dangerousPath);
        
        await expect(fileRef.put(
          Buffer.from('malicious,content\ntest,data'),
          { 
            contentType: 'text/csv',
            customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
          }
        )).toBeDenied();
      }
    });
  });

  describe('File size validation', () => {
    test('should allow files under 100MB limit', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const validSizePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'small-file.csv');
      const fileRef = storage.ref(validSizePath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeAllowed();
    });

    test('should reject files over 100MB limit', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const oversizedPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'oversized.csv');
      const fileRef = storage.ref(oversizedPath);
      
      // Create a buffer that simulates a file larger than 100MB
      const largeContent = 'a,b,c\n'.repeat(5000000); // Simulate large file
      
      await expect(fileRef.put(
        Buffer.from(largeContent),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });

    test('should reject zero-size files', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const emptyPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'empty.csv');
      const fileRef = storage.ref(emptyPath);
      
      await expect(fileRef.put(
        Buffer.from(''),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });
  });

  describe('Metadata validation', () => {
    test('should require valid metadata for file uploads', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const validMetadataPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'with-metadata.csv');
      const fileRef = storage.ref(validMetadataPath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: {
            uploadDate: new Date().toISOString(),
            userId: TEST_USERS.regularUser1.uid,
            originalFilename: 'test.csv',
            purpose: 'analysis'
          }
        }
      )).toBeAllowed();
    });

    test('should reject uploads without required metadata fields', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const noMetadataPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'no-metadata.csv');
      const fileRef = storage.ref(noMetadataPath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv'
          // Missing required metadata
        }
      )).toBeDenied();
    });

    test('should reject uploads with mismatched user ID in metadata', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const mismatchedPath = createTestFilePath(TEST_USERS.regularUser1.uid, 'mismatched.csv');
      const fileRef = storage.ref(mismatchedPath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: {
            uploadDate: new Date().toISOString(),
            userId: TEST_USERS.regularUser2.uid, // Wrong user ID
          }
        }
      )).toBeDenied();
    });
  });

  describe('Path security validation', () => {
    test('should reject path traversal attempts', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const pathTraversalAttempts = [
        '../../../etc/passwd.csv',
        '..\\..\\windows\\system32\\config.csv',
        'directory/../../escape.csv',
        './../admin/secrets.csv'
      ];
      
      for (const maliciousPath of pathTraversalAttempts) {
        const fileRef = storage.ref(`users/${TEST_USERS.regularUser1.uid}/csvs/${maliciousPath}`);
        
        await expect(fileRef.put(
          Buffer.from(TEST_FILES.validCsvSmall.content),
          { 
            contentType: 'text/csv',
            customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
          }
        )).toBeDenied();
      }
    });

    test('should reject files with dangerous characters in filename', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const dangerousFilenames = [
        'file<script>alert(1)</script>.csv',
        'file|dangerous.csv',
        'file?query=malicious.csv',
        'file*wildcard.csv',
        'file"quote.csv'
      ];
      
      for (const dangerousFilename of dangerousFilenames) {
        const dangerousPath = createTestFilePath(TEST_USERS.regularUser1.uid, dangerousFilename);
        const fileRef = storage.ref(dangerousPath);
        
        await expect(fileRef.put(
          Buffer.from(TEST_FILES.validCsvSmall.content),
          { 
            contentType: 'text/csv',
            customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
          }
        )).toBeDenied();
      }
    });

    test('should reject hidden files', async () => {
      const userContext = createAuthenticatedContext(testEnv, TEST_USERS.regularUser1);
      const storage = userContext.storage();
      
      const hiddenFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, '.hidden.csv');
      const fileRef = storage.ref(hiddenFilePath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: createFileMetadata(TEST_USERS.regularUser1.uid)
        }
      )).toBeDenied();
    });
  });

  describe('Admin bypass validation', () => {
    test('should allow admin to upload files even with strict validation', async () => {
      const adminContext = createAuthenticatedContext(testEnv, TEST_USERS.adminUser);
      const storage = adminContext.storage();
      
      const adminFilePath = createTestFilePath(TEST_USERS.regularUser1.uid, 'admin-override.csv');
      const fileRef = storage.ref(adminFilePath);
      
      await expect(fileRef.put(
        Buffer.from(TEST_FILES.validCsvSmall.content),
        { 
          contentType: 'text/csv',
          customMetadata: {
            uploadDate: new Date().toISOString(),
            userId: TEST_USERS.adminUser.uid,
            adminOverride: 'true',
            purpose: 'admin_operation'
          }
        }
      )).toBeAllowed();
    });
  });
});