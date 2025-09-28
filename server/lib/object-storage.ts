import { Client } from '@replit/object-storage';
import { storage } from '../storage';

/**
 * Comprehensive Object Storage Service for MarketDifferentials
 * Handles all file operations using Replit Object Storage
 */
export class ObjectStorageService {
  private client: Client;
  private bucketName: string = 'AwkwardFragrantPhysics';

  constructor() {
    this.client = new Client();
  }

  // ===================
  // CSV FILE STORAGE
  // ===================

  /**
   * Upload CSV file for anomaly detection
   */
  async uploadCSV(userId: string, fileName: string, content: Buffer, metadata?: any): Promise<{ok: boolean, path?: string, size?: number, error?: string}> {
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const timestamp = Date.now();
      const path = `users/${userId}/csv/${sanitizedFileName}_${timestamp}.csv`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);
      
      console.log(`CSV uploaded successfully: ${path}`);
      return { 
        ok: true, 
        path, 
        size: content.length 
      };
    } catch (error: any) {
      console.error('CSV upload error:', error);
      return { 
        ok: false, 
        error: `Failed to upload CSV: ${error.message}` 
      };
    }
  }

  /**
   * Download CSV file by path
   */
  async downloadCSV(userId: string, fileName: string): Promise<{ok: boolean, data?: Buffer, error?: string}> {
    try {
      const path = `users/${userId}/csv/${fileName}`;
      const data = await this.client.downloadAsBytes(this.bucketName, path);
      
      return { 
        ok: true, 
        data: Buffer.from(data) 
      };
    } catch (error: any) {
      console.error('CSV download error:', error);
      return { 
        ok: false, 
        error: `Failed to download CSV: ${error.message}` 
      };
    }
  }

  /**
   * Download CSV file by full path (for shared files)
   */
  async downloadCSVByPath(path: string): Promise<{ok: boolean, data?: Buffer, error?: string}> {
    try {
      const data = await this.client.downloadAsBytes(this.bucketName, path);
      
      return { 
        ok: true, 
        data: Buffer.from(data) 
      };
    } catch (error: any) {
      console.error('CSV download by path error:', error);
      return { 
        ok: false, 
        error: `Failed to download CSV: ${error.message}` 
      };
    }
  }

  // ===================
  // USER CONTENT STORAGE
  // ===================

  /**
   * Upload user data (profiles, preferences, etc.)
   */
  async uploadUserData(userId: string, dataType: string, content: any): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const path = `users/${userId}/data/${dataType}.json`;
      const jsonContent = JSON.stringify(content, null, 2);
      
      await this.client.uploadFromText(this.bucketName, path, jsonContent);
      
      console.log(`User data uploaded: ${path}`);
      return { 
        ok: true, 
        path 
      };
    } catch (error: any) {
      console.error('User data upload error:', error);
      return { 
        ok: false, 
        error: `Failed to upload user data: ${error.message}` 
      };
    }
  }

  /**
   * Download user data
   */
  async downloadUserData(userId: string, dataType: string): Promise<{ok: boolean, data?: any, error?: string}> {
    try {
      const path = `users/${userId}/data/${dataType}.json`;
      const text = await this.client.downloadAsText(this.bucketName, path);
      const data = JSON.parse(text);
      
      return { 
        ok: true, 
        data 
      };
    } catch (error: any) {
      console.error('User data download error:', error);
      return { 
        ok: false, 
        error: `Failed to download user data: ${error.message}` 
      };
    }
  }

  /**
   * Upload user profile image
   */
  async uploadUserProfileImage(userId: string, content: Buffer, fileExtension: string): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const path = `users/${userId}/profile/avatar.${fileExtension}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);
      
      console.log(`Profile image uploaded: ${path}`);
      return { 
        ok: true, 
        path 
      };
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      return { 
        ok: false, 
        error: `Failed to upload profile image: ${error.message}` 
      };
    }
  }

  // ===================
  // COURSE CONTENT STORAGE
  // ===================

  /**
   * Upload course material
   */
  async uploadCourseMaterial(courseId: string, materialType: string, fileName: string, content: Buffer): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const path = `courses/${courseId}/${materialType}/${sanitizedFileName}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);
      
      console.log(`Course material uploaded: ${path}`);
      return { 
        ok: true, 
        path 
      };
    } catch (error: any) {
      console.error('Course material upload error:', error);
      return { 
        ok: false, 
        error: `Failed to upload course material: ${error.message}` 
      };
    }
  }

  /**
   * Download course material
   */
  async downloadCourseMaterial(courseId: string, materialType: string, fileName: string): Promise<{ok: boolean, data?: Buffer, error?: string}> {
    try {
      const path = `courses/${courseId}/${materialType}/${fileName}`;
      const data = await this.client.downloadAsBytes(this.bucketName, path);
      
      return { 
        ok: true, 
        data: Buffer.from(data) 
      };
    } catch (error: any) {
      console.error('Course material download error:', error);
      return { 
        ok: false, 
        error: `Failed to download course material: ${error.message}` 
      };
    }
  }

  // ===================
  // SYSTEM ASSET STORAGE
  // ===================

  /**
   * Upload system asset (icons, charts, etc.)
   */
  async uploadAsset(assetPath: string, content: Buffer): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const path = `assets/${assetPath}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);
      
      console.log(`Asset uploaded: ${path}`);
      return { 
        ok: true, 
        path 
      };
    } catch (error: any) {
      console.error('Asset upload error:', error);
      return { 
        ok: false, 
        error: `Failed to upload asset: ${error.message}` 
      };
    }
  }

  /**
   * Download system asset
   */
  async downloadAsset(assetPath: string): Promise<{ok: boolean, data?: Buffer, error?: string}> {
    try {
      const path = `assets/${assetPath}`;
      const data = await this.client.downloadAsBytes(this.bucketName, path);
      
      return { 
        ok: true, 
        data: Buffer.from(data) 
      };
    } catch (error: any) {
      console.error('Asset download error:', error);
      return { 
        ok: false, 
        error: `Failed to download asset: ${error.message}` 
      };
    }
  }

  // ===================
  // ENHANCED SYSTEM ASSET STORAGE
  // ===================

  /**
   * Upload generated icon with enhanced metadata
   */
  async uploadGeneratedIcon(iconId: string, content: Buffer, options?: {
    format?: string;
    category?: string;
    tags?: string[];
    generatedBy?: string;
    prompt?: string;
    style?: string;
  }): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const format = options?.format || 'svg';
      const category = options?.category || 'generated';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `assets/icons/${category}/${iconId}_${timestamp}.${format}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);

      // Store icon metadata
      const metadataPath = `assets/icons/${category}/${iconId}_${timestamp}.metadata.json`;
      const metadata = {
        iconId,
        format,
        category,
        tags: options?.tags || [],
        generatedBy: options?.generatedBy,
        prompt: options?.prompt,
        style: options?.style,
        size: content.length,
        uploadedAt: timestamp,
        type: 'icon'
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`Generated icon uploaded: ${path}`);
      return { ok: true, path };
    } catch (error: any) {
      console.error('Generated icon upload error:', error);
      return { ok: false, error: `Failed to upload generated icon: ${error.message}` };
    }
  }

  /**
   * Upload chart/visualization asset
   */
  async uploadChartAsset(chartId: string, content: Buffer, options?: {
    format?: string;
    chartType?: string;
    dataSource?: string;
    userId?: string;
    metadata?: any;
  }): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const format = options?.format || 'png';
      const chartType = options?.chartType || 'unknown';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `assets/charts/${chartType}/${chartId}_${timestamp}.${format}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);

      // Store chart metadata
      const metadataPath = `assets/charts/${chartType}/${chartId}_${timestamp}.metadata.json`;
      const metadata = {
        chartId,
        format,
        chartType,
        dataSource: options?.dataSource,
        userId: options?.userId,
        size: content.length,
        uploadedAt: timestamp,
        type: 'chart',
        ...options?.metadata
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`Chart asset uploaded: ${path}`);
      return { ok: true, path };
    } catch (error: any) {
      console.error('Chart asset upload error:', error);
      return { ok: false, error: `Failed to upload chart asset: ${error.message}` };
    }
  }

  /**
   * Upload generated report asset
   */
  async uploadReportAsset(reportId: string, content: Buffer, options?: {
    format?: string;
    reportType?: string;
    userId?: string;
    title?: string;
    metadata?: any;
  }): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const format = options?.format || 'pdf';
      const reportType = options?.reportType || 'analysis';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `assets/reports/${reportType}/${reportId}_${timestamp}.${format}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);

      // Store report metadata
      const metadataPath = `assets/reports/${reportType}/${reportId}_${timestamp}.metadata.json`;
      const metadata = {
        reportId,
        format,
        reportType,
        userId: options?.userId,
        title: options?.title,
        size: content.length,
        uploadedAt: timestamp,
        type: 'report',
        ...options?.metadata
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`Report asset uploaded: ${path}`);
      return { ok: true, path };
    } catch (error: any) {
      console.error('Report asset upload error:', error);
      return { ok: false, error: `Failed to upload report asset: ${error.message}` };
    }
  }

  /**
   * Upload system configuration backup
   */
  async uploadSystemBackup(backupId: string, content: Buffer, options?: {
    backupType?: string;
    version?: string;
    description?: string;
    metadata?: any;
  }): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const backupType = options?.backupType || 'full';
      const version = options?.version || new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `system/backups/${backupType}/${backupId}_${version}_${timestamp}.zip`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);

      // Store backup metadata
      const metadataPath = `system/backups/${backupType}/${backupId}_${version}_${timestamp}.metadata.json`;
      const metadata = {
        backupId,
        backupType,
        version,
        description: options?.description,
        size: content.length,
        uploadedAt: timestamp,
        type: 'system_backup',
        ...options?.metadata
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`System backup uploaded: ${path}`);
      return { ok: true, path };
    } catch (error: any) {
      console.error('System backup upload error:', error);
      return { ok: false, error: `Failed to upload system backup: ${error.message}` };
    }
  }

  /**
   * Upload static asset (images, stylesheets, scripts, etc.)
   */
  async uploadStaticAsset(assetPath: string, content: Buffer, options?: {
    contentType?: string;
    category?: string;
    version?: string;
    metadata?: any;
  }): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const category = options?.category || 'static';
      const version = options?.version || 'latest';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedPath = this.sanitizeFileName(assetPath);
      const path = `assets/${category}/${version}/${sanitizedPath}`;
      
      await this.client.uploadFromBytes(this.bucketName, path, content);

      // Store asset metadata
      const metadataPath = `assets/${category}/${version}/${sanitizedPath}.metadata.json`;
      const metadata = {
        originalPath: assetPath,
        contentType: options?.contentType,
        category,
        version,
        size: content.length,
        uploadedAt: timestamp,
        type: 'static_asset',
        ...options?.metadata
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`Static asset uploaded: ${path}`);
      return { ok: true, path };
    } catch (error: any) {
      console.error('Static asset upload error:', error);
      return { ok: false, error: `Failed to upload static asset: ${error.message}` };
    }
  }

  /**
   * List assets by type and category
   */
  async listAssets(assetType: string, category?: string, options?: {
    limit?: number;
    includeMetadata?: boolean;
  }): Promise<{ok: boolean, assets?: Array<{
    path: string;
    type: string;
    category?: string;
    metadata?: any;
  }>, error?: string}> {
    try {
      const prefix = category 
        ? `assets/${assetType}/${category}/`
        : `assets/${assetType}/`;
      
      const files = await this.client.list(this.bucketName, prefix);
      const assets: Array<{path: string; type: string; category?: string; metadata?: any}> = [];

      let processedCount = 0;
      const limit = options?.limit || 100;

      for (const file of files) {
        if (processedCount >= limit) break;
        if (file.endsWith('.metadata.json')) continue;

        const pathParts = file.split('/');
        const fileCategory = pathParts[2] || category;

        let metadata: any = {};
        if (options?.includeMetadata) {
          try {
            const metadataPath = `${file}.metadata.json`;
            const metadataContent = await this.client.downloadAsText(this.bucketName, metadataPath);
            metadata = JSON.parse(metadataContent);
          } catch {
            // Metadata is optional
          }
        }

        assets.push({
          path: file,
          type: assetType,
          category: fileCategory,
          metadata: options?.includeMetadata ? metadata : undefined
        });

        processedCount++;
      }

      return { ok: true, assets };
    } catch (error: any) {
      console.error('List assets error:', error);
      return { ok: false, error: `Failed to list assets: ${error.message}` };
    }
  }

  /**
   * Download asset by path
   */
  async downloadAsset(assetPath: string): Promise<{ok: boolean, data?: Buffer, metadata?: any, error?: string}> {
    try {
      const data = await this.client.downloadBytes(this.bucketName, assetPath);
      
      // Try to get metadata
      let metadata: any = {};
      try {
        const metadataPath = `${assetPath}.metadata.json`;
        const metadataContent = await this.client.downloadAsText(this.bucketName, metadataPath);
        metadata = JSON.parse(metadataContent);
      } catch {
        // Metadata is optional
      }

      return { ok: true, data, metadata };
    } catch (error: any) {
      console.error('Download asset error:', error);
      return { ok: false, error: `Failed to download asset: ${error.message}` };
    }
  }

  /**
   * Delete asset and its metadata
   */
  async deleteAsset(assetPath: string): Promise<{ok: boolean, error?: string}> {
    try {
      await this.client.delete(this.bucketName, assetPath);
      
      // Also try to delete metadata file
      try {
        const metadataPath = `${assetPath}.metadata.json`;
        await this.client.delete(this.bucketName, metadataPath);
      } catch {
        // Metadata deletion is optional
      }

      console.log(`Asset deleted: ${assetPath}`);
      return { ok: true };
    } catch (error: any) {
      console.error('Delete asset error:', error);
      return { ok: false, error: `Failed to delete asset: ${error.message}` };
    }
  }

  /**
   * Bulk upload assets
   */
  async bulkUploadAssets(assets: Array<{
    path: string;
    content: Buffer;
    type: string;
    category?: string;
    metadata?: any;
  }>): Promise<{ok: boolean, results?: Array<{path: string, success: boolean, error?: string}>, error?: string}> {
    try {
      const uploadPromises = assets.map(async (asset) => {
        try {
          const result = await this.uploadStaticAsset(asset.path, asset.content, {
            category: asset.category,
            metadata: asset.metadata
          });
          
          return { 
            path: result.path || asset.path, 
            success: result.ok,
            error: result.error
          };
        } catch (error: any) {
          return { 
            path: asset.path, 
            success: false, 
            error: error.message 
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      return { ok: true, results };
    } catch (error: any) {
      console.error('Bulk asset upload error:', error);
      return { ok: false, error: `Failed to bulk upload assets: ${error.message}` };
    }
  }

  /**
   * Asset cleanup - remove old versions
   */
  async cleanupOldAssets(assetType: string, retentionDays: number = 30): Promise<{ok: boolean, deletedCount?: number, error?: string}> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const listResult = await this.listAssets(assetType, undefined, { includeMetadata: true });
      if (!listResult.ok || !listResult.assets) {
        return { ok: false, error: "Failed to list assets for cleanup" };
      }

      let deletedCount = 0;

      for (const asset of listResult.assets) {
        if (asset.metadata?.uploadedAt) {
          const uploadDate = new Date(asset.metadata.uploadedAt);
          if (uploadDate < cutoffDate) {
            const deleteResult = await this.deleteAsset(asset.path);
            if (deleteResult.ok) {
              deletedCount++;
            }
          }
        }
      }

      console.log(`Asset cleanup completed: ${deletedCount} assets deleted`);
      return { ok: true, deletedCount };
    } catch (error: any) {
      console.error('Asset cleanup error:', error);
      return { ok: false, error: `Failed to cleanup assets: ${error.message}` };
    }
  }

  // ===================
  // BULK OPERATIONS
  // ===================

  /**
   * List user files
   */
  async listUserFiles(userId: string, prefix?: string): Promise<{ok: boolean, files?: string[], error?: string}> {
    try {
      const searchPrefix = prefix ? `users/${userId}/${prefix}` : `users/${userId}/`;
      const files = await this.client.list(this.bucketName, searchPrefix);
      
      return { 
        ok: true, 
        files 
      };
    } catch (error: any) {
      console.error('List user files error:', error);
      return { 
        ok: false, 
        error: `Failed to list user files: ${error.message}` 
      };
    }
  }

  /**
   * Delete user file
   */
  async deleteUserFile(userId: string, fileName: string): Promise<{ok: boolean, error?: string}> {
    try {
      // Ensure file belongs to user for security
      const path = fileName.startsWith(`users/${userId}/`) ? fileName : `users/${userId}/${fileName}`;
      
      await this.client.delete(this.bucketName, path);
      
      console.log(`File deleted: ${path}`);
      return { 
        ok: true 
      };
    } catch (error: any) {
      console.error('Delete file error:', error);
      return { 
        ok: false, 
        error: `Failed to delete file: ${error.message}` 
      };
    }
  }

  /**
   * Delete file by exact path
   */
  async deleteFile(path: string): Promise<{ok: boolean, error?: string}> {
    try {
      await this.client.delete(this.bucketName, path);
      
      console.log(`File deleted: ${path}`);
      return { 
        ok: true 
      };
    } catch (error: any) {
      console.error('Delete file error:', error);
      return { 
        ok: false, 
        error: `Failed to delete file: ${error.message}` 
      };
    }
  }

  /**
   * Bulk upload files
   */
  async bulkUpload(files: Array<{path: string, content: Buffer}>): Promise<{ok: boolean, results?: Array<{path: string, success: boolean, error?: string}>, error?: string}> {
    try {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          try {
            await this.client.uploadBytes(this.bucketName, file.path, file.content);
            return { path: file.path, success: true };
          } catch (error: any) {
            return { 
              path: file.path, 
              success: false, 
              error: error.message 
            };
          }
        })
      );

      const mappedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { 
            path: files[index].path, 
            success: false, 
            error: result.reason?.message || 'Unknown error' 
          };
        }
      });

      return { 
        ok: true, 
        results: mappedResults 
      };
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return { 
        ok: false, 
        error: `Bulk upload failed: ${error.message}` 
      };
    }
  }

  // ===================
  // USER DATA BACKUP/RESTORE
  // ===================

  /**
   * Backup all user data
   */
  async backupUserData(userId: string): Promise<{ok: boolean, backupPath?: string, error?: string}> {
    try {
      // List all user files
      const userFilesResult = await this.listUserFiles(userId);
      if (!userFilesResult.ok || !userFilesResult.files) {
        throw new Error('Failed to list user files for backup');
      }

      // Create backup metadata
      const backupMetadata = {
        userId,
        timestamp: new Date().toISOString(),
        files: userFilesResult.files,
        version: '1.0'
      };

      const backupPath = `users/${userId}/backups/backup_${Date.now()}.json`;
      await this.client.uploadText(this.bucketName, backupPath, JSON.stringify(backupMetadata, null, 2));

      console.log(`User data backup created: ${backupPath}`);
      return { 
        ok: true, 
        backupPath 
      };
    } catch (error: any) {
      console.error('User data backup error:', error);
      return { 
        ok: false, 
        error: `Failed to backup user data: ${error.message}` 
      };
    }
  }

  // ===================
  // COURSE CONTENT MANAGEMENT
  // ===================

  /**
   * Upload course material (videos, PDFs, documents, etc.)
   */
  async uploadCourseMaterial(courseId: string, materialType: string, content: Buffer, options?: {
    originalName?: string;
    contentType?: string;
    version?: string;
    lessonId?: string;
    metadata?: any;
  }): Promise<{ok: boolean, path?: string, error?: string}> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const version = options?.version || timestamp;
      const sanitizedName = options?.originalName ? this.sanitizeFileName(options.originalName) : 'material';
      const extension = this.getFileExtension(sanitizedName);
      
      const basePath = options?.lessonId 
        ? `courses/${courseId}/lessons/${options.lessonId}/materials/${materialType}`
        : `courses/${courseId}/materials/${materialType}`;
      
      const path = `${basePath}/${version}_${sanitizedName}`;

      await this.client.uploadFromBytes(this.bucketName, path, content);

      // Store metadata if provided
      if (options?.metadata || options?.originalName || options?.contentType) {
        const metadataPath = `${path}.metadata.json`;
        const metadata = {
          originalName: options?.originalName,
          contentType: options?.contentType,
          version,
          materialType,
          lessonId: options?.lessonId,
          uploadedAt: timestamp,
          size: content.length,
          courseId,
          ...options?.metadata
        };
        
        await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));
      }

      console.log(`Course material uploaded: ${path}`);
      return { ok: true, path };
    } catch (error: any) {
      console.error('Course material upload error:', error);
      return { ok: false, error: `Failed to upload course material: ${error.message}` };
    }
  }

  /**
   * Download course material
   */
  async downloadCourseMaterial(courseId: string, materialType: string, version?: string, lessonId?: string): Promise<{ok: boolean, data?: Buffer, metadata?: any, error?: string}> {
    try {
      const basePath = lessonId 
        ? `courses/${courseId}/lessons/${lessonId}/materials/${materialType}`
        : `courses/${courseId}/materials/${materialType}`;

      let materialPath: string;
      
      if (version) {
        // List files to find the exact path with version
        const files = await this.client.list(this.bucketName, basePath);
        const versionFiles = files.filter(f => f.includes(version) && !f.endsWith('.metadata.json'));
        
        if (versionFiles.length === 0) {
          return { ok: false, error: "Course material version not found" };
        }
        
        materialPath = versionFiles[0];
      } else {
        // Get the latest version
        const files = await this.client.list(this.bucketName, basePath);
        const materialFiles = files.filter(f => !f.endsWith('.metadata.json'));
        
        if (materialFiles.length === 0) {
          return { ok: false, error: "Course material not found" };
        }
        
        materialFiles.sort();
        materialPath = materialFiles[materialFiles.length - 1];
      }

      const data = await this.client.downloadBytes(this.bucketName, materialPath);
      
      // Try to get metadata
      let metadata: any = {};
      try {
        const metadataPath = `${materialPath}.metadata.json`;
        const metadataContent = await this.client.downloadAsText(this.bucketName, metadataPath);
        metadata = JSON.parse(metadataContent);
      } catch {
        // Metadata is optional
      }

      return { ok: true, data, metadata };
    } catch (error: any) {
      console.error('Course material download error:', error);
      return { ok: false, error: `Failed to download course material: ${error.message}` };
    }
  }

  /**
   * List course materials
   */
  async listCourseMaterials(courseId: string, materialType?: string, lessonId?: string): Promise<{ok: boolean, materials?: Array<{
    path: string;
    type: string;
    version: string;
    lessonId?: string;
    metadata?: any;
  }>, error?: string}> {
    try {
      const basePath = lessonId 
        ? `courses/${courseId}/lessons/${lessonId}/materials/${materialType || ''}`
        : materialType 
          ? `courses/${courseId}/materials/${materialType}/`
          : `courses/${courseId}/materials/`;
      
      const files = await this.client.list(this.bucketName, basePath);
      const materials: Array<{path: string; type: string; version: string; lessonId?: string; metadata?: any}> = [];

      for (const file of files) {
        if (file.endsWith('.metadata.json')) continue;
        
        const pathParts = file.split('/');
        const type = materialType || (pathParts.includes('lessons') ? pathParts[5] : pathParts[3]) || 'unknown';
        const filename = pathParts[pathParts.length - 1];
        const version = filename.split('_')[0];
        const extractedLessonId = pathParts.includes('lessons') ? pathParts[3] : undefined;

        // Try to get metadata
        let metadata: any = {};
        try {
          const metadataPath = `${file}.metadata.json`;
          const metadataContent = await this.client.downloadAsText(this.bucketName, metadataPath);
          metadata = JSON.parse(metadataContent);
        } catch {
          // Metadata is optional
        }

        materials.push({
          path: file,
          type,
          version,
          lessonId: extractedLessonId,
          metadata
        });
      }

      return { ok: true, materials };
    } catch (error: any) {
      console.error('List course materials error:', error);
      return { ok: false, error: `Failed to list course materials: ${error.message}` };
    }
  }

  /**
   * Delete course material
   */
  async deleteCourseMaterial(courseId: string, materialPath: string): Promise<{ok: boolean, error?: string}> {
    try {
      // Ensure the path belongs to the course for security
      if (!materialPath.startsWith(`courses/${courseId}/`)) {
        return { ok: false, error: "Invalid material path for course" };
      }

      await this.client.delete(this.bucketName, materialPath);
      
      // Also try to delete metadata file
      try {
        const metadataPath = `${materialPath}.metadata.json`;
        await this.client.delete(this.bucketName, metadataPath);
      } catch {
        // Metadata deletion is optional
      }

      console.log(`Course material deleted: ${materialPath}`);
      return { ok: true };
    } catch (error: any) {
      console.error('Delete course material error:', error);
      return { ok: false, error: `Failed to delete course material: ${error.message}` };
    }
  }

  /**
   * Upload course video with special handling
   */
  async uploadCourseVideo(courseId: string, lessonId: string, videoContent: Buffer, options?: {
    originalName?: string;
    duration?: number;
    resolution?: string;
    quality?: string;
    thumbnailContent?: Buffer;
  }): Promise<{ok: boolean, videoPath?: string, thumbnailPath?: string, error?: string}> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = options?.originalName ? this.sanitizeFileName(options.originalName) : 'video';
      const extension = this.getFileExtension(sanitizedName) || 'mp4';
      
      const videoPath = `courses/${courseId}/lessons/${lessonId}/videos/${timestamp}_${sanitizedName}`;
      
      // Upload video
      await this.client.uploadBytes(this.bucketName, videoPath, videoContent);

      // Upload thumbnail if provided
      let thumbnailPath: string | undefined;
      if (options?.thumbnailContent) {
        thumbnailPath = `courses/${courseId}/lessons/${lessonId}/thumbnails/${timestamp}_${sanitizedName.replace(/\.[^.]+$/, '.jpg')}`;
        await this.client.uploadBytes(this.bucketName, thumbnailPath, options.thumbnailContent);
      }

      // Store video metadata
      const metadataPath = `${videoPath}.metadata.json`;
      const metadata = {
        originalName: options?.originalName,
        uploadedAt: timestamp,
        size: videoContent.length,
        duration: options?.duration,
        resolution: options?.resolution,
        quality: options?.quality,
        type: 'video',
        courseId,
        lessonId,
        thumbnailPath
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`Course video uploaded: ${videoPath}`);
      return { ok: true, videoPath, thumbnailPath };
    } catch (error: any) {
      console.error('Course video upload error:', error);
      return { ok: false, error: `Failed to upload course video: ${error.message}` };
    }
  }

  /**
   * Upload course completion certificate
   */
  async uploadCourseCertificate(courseId: string, userId: string, certificateContent: Buffer, options?: {
    completionDate?: Date;
    grade?: number;
    certificateType?: string;
    courseName?: string;
    userName?: string;
  }): Promise<{ok: boolean, certificatePath?: string, error?: string}> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const certificateType = options?.certificateType || 'completion';
      const certificatePath = `courses/${courseId}/certificates/${userId}/${certificateType}_${timestamp}.pdf`;

      await this.client.uploadBytes(this.bucketName, certificatePath, certificateContent);

      // Store certificate metadata
      const metadataPath = `${certificatePath}.metadata.json`;
      const metadata = {
        userId,
        courseId,
        completionDate: options?.completionDate || new Date(),
        grade: options?.grade,
        certificateType,
        courseName: options?.courseName,
        userName: options?.userName,
        generatedAt: timestamp,
        size: certificateContent.length
      };
      
      await this.client.uploadText(this.bucketName, metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`Course certificate uploaded: ${certificatePath}`);
      return { ok: true, certificatePath };
    } catch (error: any) {
      console.error('Course certificate upload error:', error);
      return { ok: false, error: `Failed to upload course certificate: ${error.message}` };
    }
  }

  /**
   * Get user's course certificates
   */
  async getUserCourseCertificates(userId: string, courseId?: string): Promise<{ok: boolean, certificates?: Array<{
    path: string;
    courseId: string;
    metadata: any;
  }>, error?: string}> {
    try {
      const searchPrefix = courseId 
        ? `courses/${courseId}/certificates/${userId}/`
        : `courses/`;
      
      const files = await this.client.list(this.bucketName, searchPrefix);
      const certificates: Array<{path: string; courseId: string; metadata: any}> = [];

      for (const file of files) {
        if (!file.includes('/certificates/') || file.endsWith('.metadata.json') || !file.includes('.pdf')) continue;
        
        const pathParts = file.split('/');
        const fileCourseId = pathParts[1];
        const fileUserId = pathParts[3];
        
        // Only include certificates for the specified user
        if (fileUserId !== userId) continue;

        // Get metadata
        try {
          const metadataPath = `${file}.metadata.json`;
          const metadataContent = await this.client.downloadAsText(this.bucketName, metadataPath);
          const metadata = JSON.parse(metadataContent);

          certificates.push({
            path: file,
            courseId: fileCourseId,
            metadata
          });
        } catch {
          // Skip files without metadata
        }
      }

      return { ok: true, certificates };
    } catch (error: any) {
      console.error('Get user certificates error:', error);
      return { ok: false, error: `Failed to get user certificates: ${error.message}` };
    }
  }

  /**
   * Bulk upload course content
   */
  async bulkUploadCourseContent(courseId: string, materials: Array<{
    type: string;
    content: Buffer;
    originalName: string;
    lessonId?: string;
    metadata?: any;
  }>): Promise<{ok: boolean, results?: Array<{path: string, success: boolean, error?: string}>, error?: string}> {
    try {
      const uploadPromises = materials.map(async (material) => {
        try {
          const result = await this.uploadCourseMaterial(courseId, material.type, material.content, {
            originalName: material.originalName,
            lessonId: material.lessonId,
            metadata: material.metadata
          });
          
          return { 
            path: result.path || '', 
            success: result.ok,
            error: result.error
          };
        } catch (error: any) {
          return { 
            path: `${material.type}/${material.originalName}`, 
            success: false, 
            error: error.message 
          };
        }
      });

      const results = await Promise.all(uploadPromises);

      return { ok: true, results };
    } catch (error: any) {
      console.error('Bulk course content upload error:', error);
      return { ok: false, error: `Failed to bulk upload course content: ${error.message}` };
    }
  }

  // ===================
  // ANALYTICS & MONITORING
  // ===================

  /**
   * Get storage usage for user
   */
  async getUserStorageUsage(userId: string): Promise<{ok: boolean, usage?: {totalFiles: number, totalSize: number}, error?: string}> {
    try {
      const userFilesResult = await this.listUserFiles(userId);
      if (!userFilesResult.ok || !userFilesResult.files) {
        return { ok: true, usage: { totalFiles: 0, totalSize: 0 } };
      }

      // Note: Replit Object Storage doesn't provide file sizes in list operation
      // We'll need to track this in the database for accurate usage metrics
      return { 
        ok: true, 
        usage: { 
          totalFiles: userFilesResult.files.length, 
          totalSize: 0 // Will be tracked in database
        } 
      };
    } catch (error: any) {
      console.error('Storage usage error:', error);
      return { 
        ok: false, 
        error: `Failed to get storage usage: ${error.message}` 
      };
    }
  }

  // ===================
  // UTILITY METHODS
  // ===================

  /**
   * Sanitize filename for storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Generate secure random path
   */
  private generateSecurePath(prefix: string, extension: string = ''): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${prefix}/${timestamp}_${randomStr}${extension}`;
  }

  /**
   * Validate file size
   */
  private validateFileSize(content: Buffer, maxSizeBytes: number): boolean {
    return content.length <= maxSizeBytes;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file type is allowed
   */
  private isAllowedFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = this.getFileExtension(fileName);
    return allowedTypes.includes(extension);
  }

  // ===================
  // SHARING & PERMISSIONS
  // ===================

  /**
   * Generate shareable link for file (placeholder for future implementation)
   */
  async generateShareableLink(filePath: string, expirationHours: number = 24): Promise<{ok: boolean, shareUrl?: string, error?: string}> {
    try {
      // For now, we'll return the file path as this will be handled by the API layer
      // In a future implementation, this could generate signed URLs or temporary access tokens
      return { 
        ok: true, 
        shareUrl: `/api/storage/shared/${encodeURIComponent(filePath)}` 
      };
    } catch (error: any) {
      console.error('Generate shareable link error:', error);
      return { 
        ok: false, 
        error: `Failed to generate shareable link: ${error.message}` 
      };
    }
  }

  // ===================
  // PERMISSION-AWARE STORAGE METHODS
  // ===================

  /**
   * Upload file with automatic permission setup
   * Sets initial owner permissions for the uploaded resource
   */
  async uploadWithPermissions(
    userId: string, 
    resourceType: string, 
    fileName: string, 
    content: Buffer, 
    permissions: string[] = ['view', 'edit', 'share', 'delete']
  ): Promise<{ok: boolean, resourceId?: string, path?: string, size?: number, error?: string}> {
    try {
      // Determine upload method based on resource type
      let uploadResult;
      
      switch (resourceType) {
        case 'csv':
          uploadResult = await this.uploadCSV(userId, fileName, content);
          break;
        case 'course':
          uploadResult = await this.uploadCourseContent(userId, fileName, 'material', content);
          break;
        case 'report':
          uploadResult = await this.uploadAsset('reports', fileName, content, {
            userId,
            uploadedAt: new Date().toISOString()
          });
          break;
        default:
          uploadResult = await this.uploadAsset('static', fileName, content, {
            userId,
            uploadedAt: new Date().toISOString()
          });
      }
      
      if (uploadResult.ok && uploadResult.path) {
        // Generate resource ID from path for permission tracking
        const resourceId = uploadResult.path.replace(/[^a-zA-Z0-9]/g, '_');
        
        try {
          // Set initial owner permissions
          await storage.grantAccess(
            resourceType,
            resourceId,
            'user',
            userId,
            permissions,
            userId
          );
          
          console.log(`Permissions granted for ${resourceType} resource ${resourceId} to user ${userId}`);
        } catch (permissionError) {
          console.warn('Failed to set initial permissions, but file uploaded successfully:', permissionError);
        }
        
        return {
          ...uploadResult,
          resourceId
        };
      }
      
      return uploadResult;
    } catch (error: any) {
      console.error('Upload with permissions error:', error);
      return {
        ok: false,
        error: `Failed to upload with permissions: ${error.message}`
      };
    }
  }

  /**
   * Download file with permission check
   * Verifies user has 'view' permission before allowing download
   */
  async downloadWithPermissionCheck(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    fileName?: string
  ): Promise<{ok: boolean, data?: Buffer, error?: string}> {
    try {
      // Check if user has view permission
      const hasPermission = await storage.checkPermission(userId, resourceType, resourceId, 'view');
      
      if (!hasPermission) {
        // Check if user is the owner
        let isOwner = false;
        try {
          switch (resourceType) {
            case 'csv':
              const csvUpload = await storage.getCsvUpload(resourceId);
              isOwner = csvUpload?.userId === userId;
              break;
            case 'course':
              const course = await storage.getCourse(resourceId);
              isOwner = course?.ownerId === userId;
              break;
            default:
              isOwner = false;
          }
        } catch (error) {
          console.warn('Error checking ownership:', error);
        }
        
        if (!isOwner) {
          console.log(`Access denied: User ${userId} lacks view permission for ${resourceType} ${resourceId}`);
          return {
            ok: false,
            error: 'Access denied: insufficient permissions to download this resource'
          };
        }
      }
      
      // Proceed with download based on resource type
      let downloadResult;
      
      switch (resourceType) {
        case 'csv':
          if (fileName) {
            downloadResult = await this.downloadCSV(userId, fileName);
          } else {
            // Try to get CSV upload info and download by path
            try {
              const csvUpload = await storage.getCsvUpload(resourceId);
              if (csvUpload?.filePath) {
                downloadResult = await this.downloadCSVByPath(csvUpload.filePath);
              } else {
                downloadResult = { ok: false, error: 'CSV file path not found' };
              }
            } catch (error: any) {
              downloadResult = { ok: false, error: `Failed to get CSV info: ${error.message}` };
            }
          }
          break;
        case 'course':
          if (fileName) {
            downloadResult = await this.downloadCourseContent(resourceId, 'material', fileName);
          } else {
            downloadResult = { ok: false, error: 'Course material filename required' };
          }
          break;
        case 'report':
          if (fileName) {
            downloadResult = await this.downloadAsset('reports', fileName);
          } else {
            downloadResult = { ok: false, error: 'Report filename required' };
          }
          break;
        default:
          if (fileName) {
            downloadResult = await this.downloadAsset('static', fileName);
          } else {
            downloadResult = { ok: false, error: 'Filename required for download' };
          }
      }
      
      if (downloadResult.ok) {
        console.log(`Download successful: User ${userId} downloaded ${resourceType} ${resourceId}`);
      }
      
      return downloadResult;
    } catch (error: any) {
      console.error('Download with permission check error:', error);
      return {
        ok: false,
        error: `Failed to download with permission check: ${error.message}`
      };
    }
  }

  /**
   * Check if user can access a resource
   */
  async canAccessResource(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    permission: string = 'view'
  ): Promise<boolean> {
    try {
      const hasPermission = await storage.checkPermission(userId, resourceType, resourceId, permission);
      if (hasPermission) {
        return true;
      }
      
      // Check ownership as fallback
      switch (resourceType) {
        case 'csv':
          const csvUpload = await storage.getCsvUpload(resourceId);
          return csvUpload?.userId === userId;
        case 'course':
          const course = await storage.getCourse(resourceId);
          return course?.ownerId === userId;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  /**
   * Get accessible resources for a user
   */
  async getAccessibleResources(
    userId: string, 
    resourceType: string
  ): Promise<{ok: boolean, resources?: any[], error?: string}> {
    try {
      // Get all user's owned resources
      let ownedResources: any[] = [];
      
      switch (resourceType) {
        case 'csv':
          ownedResources = await storage.getCsvUploadsByUserId(userId);
          break;
        case 'course':
          ownedResources = await storage.getCoursesByOwnerId(userId);
          break;
        default:
          ownedResources = [];
      }
      
      // Get shared resources where user has permissions
      const sharedResources = await storage.getResourcesWithUserAccess(userId, resourceType);
      
      // Combine and deduplicate
      const allResources = [...ownedResources];
      for (const shared of sharedResources) {
        if (!allResources.find(r => r.id === shared.resourceId)) {
          allResources.push({
            ...shared,
            isShared: true
          });
        }
      }
      
      return {
        ok: true,
        resources: allResources
      };
    } catch (error: any) {
      console.error('Error getting accessible resources:', error);
      return {
        ok: false,
        error: `Failed to get accessible resources: ${error.message}`
      };
    }
  }

  // ===================
  // HEALTH CHECK
  // ===================

  /**
   * Health check for Object Storage service
   */
  async healthCheck(): Promise<{ok: boolean, status: string, error?: string}> {
    try {
      // Test basic connectivity by listing a small prefix
      await this.client.list(this.bucketName, 'health-check/', 1);
      
      return { 
        ok: true, 
        status: 'Object Storage service is healthy' 
      };
    } catch (error: any) {
      console.error('Object Storage health check failed:', error);
      return { 
        ok: false, 
        status: 'Object Storage service is unhealthy',
        error: error.message 
      };
    }
  }
}

// Export singleton instance
export const objectStorage = new ObjectStorageService();

export default objectStorage;