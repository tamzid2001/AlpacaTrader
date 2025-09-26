import { initializeApp } from "firebase/app";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  type StorageReference 
} from "firebase/storage";
import { 
  getAuth, 
  signInWithCustomToken, 
  signOut,
  type User 
} from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage and Auth
const storage = getStorage(app);
const auth = getAuth(app);

// Cache for Firebase auth token
let cachedFirebaseToken: string | null = null;
let tokenExpires: number | null = null;

export interface FirebaseUploadResult {
  downloadURL: string;
  fullPath: string;
  name: string;
  size: number;
}

export interface CsvFileMetadata {
  originalFilename: string;
  customFilename: string;
  uploadDate: string;
  fileSize: number;
  contentType: string;
  userId: string;
}

export interface FirebaseAuthStatus {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  expires: number | null;
}

/**
 * Get custom Firebase auth token from server (bridges Replit Auth with Firebase)
 * @returns Promise with Firebase custom token
 */
export async function getFirebaseAuthToken(): Promise<{ token: string; expires: number }> {
  // Check if we have a cached valid token
  if (cachedFirebaseToken && tokenExpires && Date.now() < tokenExpires - 60000) { // 1 minute buffer
    return { token: cachedFirebaseToken, expires: tokenExpires };
  }

  try {
    const response = await fetch('/api/auth/firebase-token', {
      method: 'GET',
      credentials: 'include', // Include Replit Auth session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Firebase token: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the token
    cachedFirebaseToken = data.firebaseToken;
    tokenExpires = data.expires;

    return { token: data.firebaseToken, expires: data.expires };
  } catch (error: any) {
    console.error('Error fetching Firebase auth token:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Authenticate with Firebase using custom token
 * @returns Promise with Firebase auth status
 */
export async function authenticateWithFirebase(): Promise<FirebaseAuthStatus> {
  try {
    // Get custom Firebase token from server
    const { token } = await getFirebaseAuthToken();
    
    // Sign in with custom token
    const userCredential = await signInWithCustomToken(auth, token);
    
    console.log('Successfully authenticated with Firebase Storage');
    
    return {
      isAuthenticated: true,
      user: userCredential.user,
      token: token,
      expires: tokenExpires,
    };
  } catch (error: any) {
    console.error('Firebase authentication failed:', error);
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      expires: null,
    };
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
    cachedFirebaseToken = null;
    tokenExpires = null;
    console.log('Signed out from Firebase');
  } catch (error: any) {
    console.error('Error signing out from Firebase:', error);
  }
}

/**
 * Check current Firebase authentication status
 */
export function getFirebaseAuthStatus(): FirebaseAuthStatus {
  const currentUser = auth.currentUser;
  return {
    isAuthenticated: !!currentUser,
    user: currentUser,
    token: cachedFirebaseToken,
    expires: tokenExpires,
  };
}

/**
 * Ensure user is authenticated with Firebase before storage operations
 * @returns Promise that resolves when authenticated
 */
async function ensureFirebaseAuthenticated(): Promise<void> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    const authStatus = await authenticateWithFirebase();
    if (!authStatus.isAuthenticated) {
      throw new Error('Failed to authenticate with Firebase Storage. Please check your login status.');
    }
  }
  
  // Check if token needs refresh
  if (tokenExpires && Date.now() >= tokenExpires - 300000) { // 5 minutes buffer
    try {
      await authenticateWithFirebase(); // Refresh token
    } catch (error) {
      console.warn('Token refresh failed, continuing with existing authentication');
    }
  }
}

/**
 * Upload a CSV file to Firebase Storage in user-specific folder
 * @param file - The CSV file to upload
 * @param userId - The user ID for folder organization
 * @param customFilename - Custom filename chosen by user
 * @returns Promise with upload result containing download URL and metadata
 */
export async function uploadCsvFile(
  file: File,
  userId: string,
  customFilename: string
): Promise<FirebaseUploadResult> {
  try {
    // Ensure user is authenticated with Firebase before upload
    await ensureFirebaseAuthenticated();

    // Validate file type
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('File must be a CSV file');
    }

    // Validate file size (100MB limit to match security rules)
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size must be less than 100MB');
    }

    // Ensure custom filename has .csv extension
    const filename = customFilename.toLowerCase().endsWith('.csv') 
      ? customFilename 
      : `${customFilename}.csv`;

    // Create storage reference with user-specific path (matching security rules)
    const timestamp = Date.now();
    const storageRef = ref(storage, `users/${userId}/csvs/${filename}_${timestamp}`);

    // Upload file with required metadata for security rules
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: 'text/csv',
      customMetadata: {
        originalFilename: file.name,
        customFilename: filename,
        uploadDate: new Date().toISOString(),
        userId: userId, // Required by security rules
        uploadedBy: 'client',
        fileSize: file.size.toString(),
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    console.log(`Successfully uploaded ${filename} to Firebase Storage with security rules`);

    return {
      downloadURL,
      fullPath: uploadResult.ref.fullPath,
      name: filename,
      size: file.size,
    };
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Download a CSV file from Firebase Storage
 * @param filePath - The full path to the file in Firebase Storage
 * @returns Promise with download URL
 */
export async function downloadCsvFile(filePath: string): Promise<string> {
  try {
    // Ensure user is authenticated with Firebase before download
    await ensureFirebaseAuthenticated();

    const fileRef = ref(storage, filePath);
    const downloadURL = await getDownloadURL(fileRef);
    
    console.log(`Successfully retrieved download URL for ${filePath}`);
    return downloadURL;
  } catch (error: any) {
    console.error('Firebase Storage download error:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
}

/**
 * Delete a CSV file from Firebase Storage
 * @param filePath - The full path to the file in Firebase Storage
 * @returns Promise that resolves when file is deleted
 */
export async function deleteCsvFile(filePath: string): Promise<void> {
  try {
    // Ensure user is authenticated with Firebase before deletion
    await ensureFirebaseAuthenticated();

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    console.log(`Successfully deleted ${filePath} from Firebase Storage`);
  } catch (error: any) {
    console.error('Firebase Storage delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a user-specific storage path for CSV files
 * @param userId - The user ID
 * @param filename - The filename
 * @returns Storage path string
 */
export function generateCsvStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  return `users/${userId}/csvs/${timestamp}-${filename}`;
}

/**
 * Parse CSV content from a file
 * @param file - The CSV file to parse
 * @returns Promise with parsed CSV data
 */
export async function parseCsvFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error("CSV must have at least a header and one data row");
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = { _rowIndex: index + 1 };
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || '';
          });
          return row;
        });

        resolve(data);
      } catch (error: any) {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate CSV data for SageMaker compatibility
 * @param data - Parsed CSV data
 * @returns Validation result with compatibility status and issues
 */
export interface CsvValidationResult {
  isValid: boolean;
  hasPercentileColumns: boolean;
  percentileColumns: string[];
  issues: string[];
  rowCount: number;
  columnCount: number;
}

export function validateCsvForSageMaker(data: any[]): CsvValidationResult {
  const issues: string[] = [];
  const headers = data.length > 0 ? Object.keys(data[0]).filter(h => h !== '_rowIndex') : [];
  
  // Check for percentile columns (p1-p99)
  const percentileColumns = headers.filter(header => {
    const match = header.toLowerCase().match(/^p(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      return num >= 1 && num <= 99;
    }
    return false;
  });

  const hasPercentileColumns = percentileColumns.length > 0;
  
  if (!hasPercentileColumns) {
    issues.push('No percentile columns (p1-p99) found. SageMaker anomaly detection expects percentile data.');
  }

  if (data.length < 10) {
    issues.push('Dataset should have at least 10 rows for meaningful anomaly detection.');
  }

  if (headers.length < 2) {
    issues.push('Dataset should have at least 2 columns.');
  }

  // Check for missing values in critical columns
  let missingValueCount = 0;
  data.forEach((row, index) => {
    headers.forEach(header => {
      if (!row[header] || row[header].toString().trim() === '') {
        missingValueCount++;
      }
    });
  });

  if (missingValueCount > data.length * headers.length * 0.1) {
    issues.push('Dataset has more than 10% missing values, which may affect analysis quality.');
  }

  return {
    isValid: issues.length === 0 || (hasPercentileColumns && data.length >= 10),
    hasPercentileColumns,
    percentileColumns,
    issues,
    rowCount: data.length,
    columnCount: headers.length,
  };
}

export { storage };