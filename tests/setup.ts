// Test setup for Firebase Storage Rules testing
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Extend Jest matchers interface for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAllowed(): Promise<R>;
      toBeDenied(): Promise<R>;
    }
  }
}

// Global test environment
let testEnv: RulesTestEnvironment;

// Firebase project configuration for testing
export const TEST_PROJECT_ID = 'demo-firebase-storage-rules-test';

/**
 * Initialize Firebase Rules test environment before all tests
 */
export async function initializeFirebaseTestEnvironment(): Promise<RulesTestEnvironment> {
  if (testEnv) {
    return testEnv;
  }

  // Read storage rules file
  const storageRulesPath = resolve(__dirname, '../storage.rules');
  const storageRules = readFileSync(storageRulesPath, 'utf8');

  // Initialize test environment with storage rules
  testEnv = await initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    storage: {
      rules: storageRules,
      host: 'localhost',
      port: 9199,
    },
  });

  return testEnv;
}

/**
 * Clean up test environment after all tests
 */
export async function cleanupFirebaseTestEnvironment(): Promise<void> {
  if (testEnv) {
    await testEnv.cleanup();
  }
}

// Test user data for consistent testing
export const TEST_USERS = {
  regularUser1: {
    uid: 'user1-test-id',
    email: 'user1@example.com',
    role: 'user',
    email_verified: true,
    replit_auth: true,
  },
  regularUser2: {
    uid: 'user2-test-id',
    email: 'user2@example.com',
    role: 'user',
    email_verified: true,
    replit_auth: true,
  },
  // Admin user with role claim (NOT hardcoded email dependency)
  adminUser: {
    uid: 'admin-test-id',
    email: 'admin@example.com', // Any email - role claim is what matters
    role: 'admin', // This is the key - role claim based access
    email_verified: true,
    replit_auth: true,
  },
  // Test user with admin email but no role claim (should NOT have admin access)
  fakeAdminWithOldEmail: {
    uid: 'fake-admin-test-id',
    email: 'tamzid257@gmail.com', // Has hardcoded admin email
    role: 'user', // But regular user role - should NOT get admin access
    email_verified: true,
    replit_auth: true,
  },
  // Test user without role claim (to verify role claim requirement)
  userWithoutRoleClaim: {
    uid: 'no-role-user-test-id',
    email: 'norole@example.com',
    // No role claim at all - should default to regular user access
    email_verified: true,
    replit_auth: true,
  },
};

// Test file data for storage operations
export const TEST_FILES = {
  validCsvSmall: {
    name: 'test-small.csv',
    content: 'header1,header2,header3\nvalue1,value2,value3\nvalue4,value5,value6',
    contentType: 'text/csv',
    size: 50, // Small file
  },
  validCsvLarge: {
    name: 'test-large.csv',
    content: 'a,b,c\n' + 'x,y,z\n'.repeat(50000), // Simulated large file
    contentType: 'text/csv',
    size: 50 * 1024 * 1024, // 50MB
  },
  oversizedFile: {
    name: 'test-oversized.csv',
    content: 'dummy content',
    contentType: 'text/csv',
    size: 150 * 1024 * 1024, // 150MB (over limit)
  },
  invalidTypeFile: {
    name: 'test-invalid.txt',
    content: 'This is not a CSV file',
    contentType: 'text/plain',
    size: 100,
  },
  maliciousFile: {
    name: '../../../etc/passwd',
    content: 'malicious content',
    contentType: 'text/csv',
    size: 100,
  },
  // Security bypass test files
  bypassTestNonCsv: {
    name: 'malicious.exe',
    content: 'fake executable content',
    contentType: 'application/octet-stream', // Not CSV
    size: 1000,
  },
  bypassTestOversized: {
    name: 'huge-file.csv',
    content: 'oversized data',
    contentType: 'text/csv',
    size: 200 * 1024 * 1024, // 200MB - over limit
  },
};

// Helper function to create test file paths
export function createTestFilePath(userId: string, filename: string): string {
  return `users/${userId}/csvs/${filename}`;
}

// Helper function to create authenticated test context
export function createAuthenticatedContext(testEnv: RulesTestEnvironment, user: any) {
  // Exclude uid from claims object as it's passed separately
  const { uid, ...claims } = user;
  return testEnv.authenticatedContext(uid, claims);
}

// Helper function to create unauthenticated test context
export function createUnauthenticatedContext(testEnv: RulesTestEnvironment) {
  return testEnv.unauthenticatedContext();
}

// Mock metadata for file uploads
export function createFileMetadata(userId: string, customData: any = {}) {
  return {
    uploadDate: new Date().toISOString(),
    userId: userId,
    uploadedBy: 'test',
    ...customData,
  };
}

// Create invalid metadata for testing validation
export function createInvalidMetadata(customData: any = {}) {
  return {
    // Missing required fields like uploadDate, userId
    ...customData,
  };
}

// Custom Jest matchers for Firebase Storage Rules testing
expect.extend({
  async toBeAllowed(received: Promise<any>) {
    try {
      await received;
      return {
        message: () => 'Expected operation to be denied, but it was allowed',
        pass: true,
      };
    } catch (error: any) {
      return {
        message: () => `Expected operation to be allowed, but it was denied: ${error.message}`,
        pass: false,
      };
    }
  },

  async toBeDenied(received: Promise<any>) {
    try {
      await received;
      return {
        message: () => 'Expected operation to be denied, but it was allowed',
        pass: false,
      };
    } catch (error: any) {
      return {
        message: () => 'Expected operation to be denied, and it was',
        pass: true,
      };
    }
  },
});