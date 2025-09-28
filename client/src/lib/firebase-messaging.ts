import { initializeApp } from "firebase/app";
import { 
  getMessaging, 
  getToken, 
  onMessage,
  type Messaging,
  type MessagePayload,
  isSupported
} from "firebase/messaging";
import { getFirebaseAuthStatus } from "@/lib/firebase-storage";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// VAPID key for web push (set in environment)
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Initialize Firebase app (reuse existing instance if available)
let app: any;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  // App already initialized, get existing instance
  if (error.code === 'app/duplicate-app') {
    const { getApp } = await import('firebase/app');
    app = getApp();
  } else {
    throw error;
  }
}

// Initialize Firebase Messaging
let messaging: Messaging | null = null;
let messagingSupported = false;

// Check if messaging is supported in this environment
(async () => {
  try {
    messagingSupported = await isSupported();
    if (messagingSupported && typeof window !== 'undefined') {
      messaging = getMessaging(app);
      console.log('Firebase Cloud Messaging initialized successfully');
    } else {
      console.log('Firebase Cloud Messaging not supported in this environment');
    }
  } catch (error) {
    console.warn('Firebase Cloud Messaging initialization failed:', error);
  }
})();

export interface FCMTokenData {
  token: string;
  timestamp: number;
}

/**
 * Request notification permission and get FCM token
 * @returns Promise with FCM token data or null if not supported/denied
 */
export async function requestNotificationPermission(): Promise<FCMTokenData | null> {
  if (!messagingSupported || !messaging) {
    console.warn('FCM not supported in this environment');
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return null;
    }

    // Get FCM registration token
    const token = await getToken(messaging, {
      vapidKey: vapidKey
    });

    if (!token) {
      console.log('No FCM registration token available');
      return null;
    }

    console.log('FCM registration token obtained:', token.substring(0, 20) + '...');
    
    return {
      token,
      timestamp: Date.now()
    };
  } catch (error: any) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Register FCM token with our backend
 * @param tokenData FCM token data
 * @returns Promise with registration result
 */
export async function registerFCMToken(tokenData: FCMTokenData): Promise<boolean> {
  try {
    const authStatus = getFirebaseAuthStatus();
    if (!authStatus.isAuthenticated) {
      console.warn('User not authenticated, cannot register FCM token');
      return false;
    }

    const response = await fetch('/api/notifications/fcm/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcmToken: tokenData.token,
        platform: 'web',
        userAgent: navigator.userAgent,
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to register FCM token: ${response.status}`);
    }

    const result = await response.json();
    console.log('FCM token registered successfully:', result);
    return true;
  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    return false;
  }
}

/**
 * Setup FCM foreground message listener
 * @param callback Function to handle incoming messages
 * @returns Unsubscribe function
 */
export function setupForegroundMessageListener(
  callback: (payload: MessagePayload) => void
): (() => void) | null {
  if (!messagingSupported || !messaging) {
    console.warn('FCM not supported, cannot setup message listener');
    return null;
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground FCM message received:', payload);
      callback(payload);
    });

    console.log('FCM foreground message listener setup successfully');
    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up FCM message listener:', error);
    return null;
  }
}

/**
 * Initialize FCM for the current user
 * @returns Promise with initialization result
 */
export async function initializeFCM(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    // Request notification permission and get token
    const tokenData = await requestNotificationPermission();
    
    if (!tokenData) {
      return {
        success: false,
        error: 'Could not obtain FCM token - permission denied or unsupported'
      };
    }

    // Register token with backend
    const registered = await registerFCMToken(tokenData);
    
    if (!registered) {
      return {
        success: false,
        error: 'Failed to register FCM token with server'
      };
    }

    // Setup foreground message listener
    const unsubscribe = setupForegroundMessageListener((payload) => {
      // Show notification using browser's notification API for foreground messages
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body,
          icon: payload.notification.image || '/favicon.png',
          badge: '/favicon.png',
          data: payload.data,
        });
      }
    });

    // Store unsubscribe function for cleanup
    if (unsubscribe) {
      (window as any).__fcmUnsubscribe = unsubscribe;
    }

    return {
      success: true,
      token: tokenData.token
    };
  } catch (error: any) {
    console.error('FCM initialization error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during FCM initialization'
    };
  }
}

/**
 * Cleanup FCM listeners
 */
export function cleanupFCM(): void {
  const unsubscribe = (window as any).__fcmUnsubscribe;
  if (unsubscribe && typeof unsubscribe === 'function') {
    unsubscribe();
    delete (window as any).__fcmUnsubscribe;
    console.log('FCM listeners cleaned up');
  }
}

/**
 * Check if FCM is supported and available
 */
export function isFCMSupported(): boolean {
  return messagingSupported && messaging !== null;
}

export { messaging };