import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Firebase configuration for server-side uploads
const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID}.appspot.com`,
};

// Initialize Firebase Admin SDK
let adminApp;
if (getApps().length === 0) {
  try {
    // For Replit environment, try to use service account key from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: firebaseConfig.storageBucket,
      });
    } else {
      // For development, use client credentials (less secure but works)
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
    }
  } catch (error) {
    console.warn("Firebase Admin initialization failed:", error);
    adminApp = null;
  }
} else {
  adminApp = getApps()[0];
}

// Get storage instance
export const adminStorage = adminApp ? getStorage(adminApp) : null;

export interface ServerUploadResult {
  downloadURL: string;
  fullPath: string;
  name: string;
  size: number;
}

/**
 * Upload a CSV file to Firebase Storage from server-side
 * @param fileBuffer - The file buffer
 * @param originalFilename - Original filename
 * @param customFilename - Custom filename chosen by user
 * @param userId - The user ID for folder organization
 * @returns Promise with upload result
 */
export async function uploadCsvFileServerSide(
  fileBuffer: Buffer,
  originalFilename: string,
  customFilename: string,
  userId: string
): Promise<ServerUploadResult> {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage not initialized. Please check Firebase configuration.");
  }

  try {
    // Validate file type
    if (!originalFilename.toLowerCase().endsWith('.csv')) {
      throw new Error('File must be a CSV file');
    }

    // Validate file size (100MB limit as per requirements)
    if (fileBuffer.length > 100 * 1024 * 1024) {
      throw new Error('File size must be less than 100MB');
    }

    // Sanitize custom filename
    const sanitizedCustomFilename = customFilename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50);

    // Ensure .csv extension
    const filename = sanitizedCustomFilename.toLowerCase().endsWith('.csv') 
      ? sanitizedCustomFilename 
      : `${sanitizedCustomFilename}.csv`;

    // Generate server-side storage path with timestamp
    const timestamp = Date.now();
    const storagePath = `users/${userId}/csvs/${filename}_${timestamp}`;

    // Get bucket and file reference
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    // Upload file with metadata
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'text/csv',
        metadata: {
          originalFilename: originalFilename,
          customFilename: filename,
          uploadDate: new Date().toISOString(),
          userId: userId,
          uploadedBy: 'server',
        }
      }
    });

    // Generate signed URL that expires in 1 year (for download access)
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    return {
      downloadURL,
      fullPath: storagePath,
      name: filename,
      size: fileBuffer.length,
    };
  } catch (error: any) {
    console.error('Server-side Firebase Storage upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a CSV file from Firebase Storage (server-side)
 * @param filePath - The full path to the file in Firebase Storage
 * @returns Promise that resolves when file is deleted
 */
export async function deleteCsvFileServerSide(filePath: string): Promise<void> {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage not initialized");
  }

  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    await file.delete();
  } catch (error: any) {
    console.error('Server-side Firebase Storage delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a signed URL for downloading a file (with ownership verification)
 * @param filePath - The full path to the file in Firebase Storage
 * @param userId - The authenticated user ID (for ownership verification)
 * @returns Promise with signed download URL
 */
export async function getSignedDownloadURL(filePath: string, userId: string): Promise<string> {
  if (!adminStorage) {
    throw new Error("Firebase Admin Storage not initialized");
  }

  // Verify the file path belongs to the user
  const expectedPathPrefix = `users/${userId}/csvs/`;
  if (!filePath.startsWith(expectedPathPrefix)) {
    throw new Error("Access denied. You can only access your own files.");
  }

  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File not found");
    }

    // Generate signed URL that expires in 1 hour
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    return downloadURL;
  } catch (error: any) {
    console.error('Server-side Firebase Storage download URL error:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
}

/**
 * Parse CSV content from buffer with security limits
 * @param fileBuffer - The CSV file buffer
 * @returns Promise with parsed CSV data
 */
export async function parseCsvFileServerSide(fileBuffer: Buffer): Promise<{
  data: any[];
  rowCount: number;
  columnCount: number;
}> {
  return new Promise((resolve, reject) => {
    try {
      const text = fileBuffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV must have at least a header and one data row");
      }

      // Apply security limits
      if (lines.length - 1 > 10000) { // -1 for header
        throw new Error("CSV file too large. Maximum 10,000 data rows allowed.");
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      if (headers.length > 100) {
        throw new Error("CSV file has too many columns. Maximum 100 columns allowed.");
      }

      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = { _rowIndex: index + 1 };
        headers.forEach((header, headerIndex) => {
          row[header] = values[headerIndex] || '';
        });
        return row;
      });

      // Validate JSON size (max 50MB for timeSeriesData)
      const jsonSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      if (jsonSize > 50 * 1024 * 1024) { // 50MB
        throw new Error("Parsed CSV data too large. Maximum 50MB JSON size allowed.");
      }

      resolve({
        data,
        rowCount: data.length,
        columnCount: headers.length
      });
    } catch (error: any) {
      reject(new Error(`Failed to parse CSV: ${error.message}`));
    }
  });
}