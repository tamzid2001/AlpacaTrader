// Jest configuration for Firebase Storage Rules testing
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Test files location
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|ts)',
    '**/tests/**/*.(test|spec).(js|ts)',
    '**/*.(test|spec).(js|ts)'
  ],
  // TypeScript setup
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Test timeout (Firebase emulator can be slow)
  testTimeout: 30000,
  // Coverage settings
  collectCoverageFrom: [
    'tests/**/*.ts',
    '!tests/setup.ts',
    '!tests/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Firebase emulator settings
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
};