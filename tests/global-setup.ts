// Global setup for Firebase Storage Rules testing
// This runs once before all test suites

import { spawn } from 'child_process';
import { resolve } from 'path';

/**
 * Start Firebase emulators for testing
 */
export default async function globalSetup(): Promise<void> {
  console.log('🔥 Starting Firebase Storage emulator for testing...');
  
  try {
    // Start Firebase Storage emulator
    // Using firebase-tools CLI to start emulator
    const emulatorProcess = spawn('npx', [
      'firebase', 
      'emulators:start',
      '--only', 'storage',
      '--project', 'demo-firebase-storage-rules-test',
      '--export-on-exit', './firebase-test-export'
    ], {
      cwd: resolve(__dirname, '..'),
      detached: false,
      stdio: 'pipe'
    });

    // Store process ID for cleanup
    process.env.FIREBASE_EMULATOR_PID = emulatorProcess.pid?.toString();

    // Wait for emulator to start (give it some time)
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    console.log('✅ Firebase Storage emulator started successfully');
  } catch (error) {
    console.error('❌ Failed to start Firebase Storage emulator:', error);
    throw error;
  }
}