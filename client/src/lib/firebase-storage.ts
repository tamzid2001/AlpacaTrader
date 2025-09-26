import { initializeApp } from "firebase/app";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  type StorageReference 
} from "firebase/storage";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

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
    // Validate file type
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('File must be a CSV file');
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size must be less than 50MB');
    }

    // Ensure custom filename has .csv extension
    const filename = customFilename.toLowerCase().endsWith('.csv') 
      ? customFilename 
      : `${customFilename}.csv`;

    // Create storage reference with user-specific path
    const timestamp = Date.now();
    const storageRef = ref(storage, `users/${userId}/csvs/${timestamp}-${filename}`);

    // Upload file
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: 'text/csv',
      customMetadata: {
        originalFilename: file.name,
        customFilename: filename,
        uploadDate: new Date().toISOString(),
        userId: userId,
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

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
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
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
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
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