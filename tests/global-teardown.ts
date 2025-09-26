// Global teardown for Firebase Storage Rules testing
// This runs once after all test suites complete

/**
 * Stop Firebase emulators and clean up
 */
export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up Firebase Storage emulator...');
  
  try {
    // Kill emulator process if it exists
    const emulatorPid = process.env.FIREBASE_EMULATOR_PID;
    if (emulatorPid) {
      process.kill(parseInt(emulatorPid));
      console.log('✅ Firebase Storage emulator stopped');
    }
  } catch (error) {
    console.error('❌ Error stopping Firebase Storage emulator:', error);
  }
}