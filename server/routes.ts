import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupportMessageSchema, insertQuizResultSchema, insertCsvUploadSchema, insertAnomalySchema, insertSharedResultSchema, insertAnonymousConsentSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerSecurityRoutes } from "./routes/security";
import iconRoutes from "./routes/icons";
import OpenAI from "openai";
import * as XLSX from "xlsx";
import multer from "multer";
import { 
  uploadCsvFileServerSide, 
  deleteCsvFileServerSide, 
  getSignedDownloadURL, 
  parseCsvFileServerSide,
  generateCustomFirebaseToken,
  createOrUpdateFirebaseUser,
  verifyAndRefreshFirebaseToken 
} from "./firebase-admin";

// Initialize OpenAI with error handling for missing API key
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }
} catch (error) {
  console.warn("OpenAI initialization failed:", error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth middleware
  await setupAuth(app);
  
  // Register security routes
  registerSecurityRoutes(app);
  
  // Register icon routes
  app.use('/api/icons', iconRoutes);
  
  // Configure multer for file uploads (memory storage for processing)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size
      files: 1, // Only allow 1 file at a time
    },
    fileFilter: (req, file, cb) => {
      // Only allow CSV files
      if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    },
  });
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Firebase Auth Token Generation Routes
  // These routes bridge Replit Auth with Firebase Storage security rules
  app.get('/api/auth/firebase-token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or update Firebase Auth user record
      await createOrUpdateFirebaseUser(
        userId, 
        userEmail, 
        req.user.claims.first_name, 
        req.user.claims.last_name,
        user.role
      );

      // Generate custom Firebase token
      const tokenData = await generateCustomFirebaseToken(
        userId,
        userEmail,
        user.role
      );

      res.json({
        firebaseToken: tokenData.token,
        expires: tokenData.expires,
        userId: userId,
        role: user.role
      });
    } catch (error: any) {
      console.error("Error generating Firebase token:", error);
      res.status(500).json({ message: "Failed to generate Firebase token", error: error.message });
    }
  });

  app.post('/api/auth/firebase-token/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;
      const userId = req.user.claims.sub;
      
      if (!token) {
        return res.status(400).json({ message: "Firebase token is required" });
      }

      const verificationResult = await verifyAndRefreshFirebaseToken(token, userId);
      res.json(verificationResult);
    } catch (error: any) {
      console.error("Error verifying Firebase token:", error);
      res.status(500).json({ message: "Failed to verify Firebase token", error: error.message });
    }
  });

  // Admin routes (protected)
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const users = await storage.getPendingUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      const user = await storage.approveUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User enrollments
  app.get("/api/users/:userId/enrollments", async (req, res) => {
    try {
      const enrollments = await storage.getUserEnrollments(req.params.userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/enrollments", async (req, res) => {
    try {
      const enrollment = await storage.enrollUserInCourse({
        userId: req.params.userId,
        courseId: req.body.courseId,
      });
      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Quiz routes
  app.get("/api/courses/:courseId/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getCourseQuizzes(req.params.courseId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quiz-results", async (req, res) => {
    try {
      const result = insertQuizResultSchema.parse(req.body);
      const quizResult = await storage.submitQuizResult(result);
      res.json(quizResult);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/quiz-results", async (req, res) => {
    try {
      const results = await storage.getUserQuizResults(req.params.userId);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Support routes
  app.post("/api/support/message", async (req, res) => {
    try {
      const messageData = insertSupportMessageSchema.parse(req.body);
      const message = await storage.createSupportMessage(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/support/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check if OpenAI is available
      if (!openai) {
        return res.status(503).json({ 
          error: "AI chat service is temporarily unavailable. Please contact support directly.",
          fallback: "Our AI assistant is currently unavailable, but our support team is here to help! Please use the contact form to reach out directly."
        });
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an AI support agent for PropFarming Pro, a financial learning platform. Help users with course-related questions, technical issues, and general platform support. Be helpful, professional, and concise."
          },
          {
            role: "user",
            content: message
          }
        ],
      });

      res.json({ 
        response: response.choices[0].message.content 
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get AI response: " + error.message });
    }
  });

  app.get("/api/admin/support/messages", async (req, res) => {
    try {
      const messages = await storage.getAllSupportMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================
  // GDPR COMPLIANCE API ROUTES
  // ===================

  // GDPR Consent Management Routes
  app.post('/api/gdpr/consent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { consentType, consentGiven, purpose, legalBasis = 'consent' } = req.body;
      
      if (!consentType || typeof consentGiven !== 'boolean') {
        return res.status(400).json({ error: 'consentType and consentGiven are required' });
      }

      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const consent = await storage.updateUserConsent(
        userId,
        consentType,
        consentGiven,
        { ipAddress, userAgent }
      );

      res.json(consent);
    } catch (error: any) {
      console.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  });

  // GDPR Anonymous Consent Route (for unauthenticated users)
  app.post('/api/gdpr/anonymous-consent', async (req, res) => {
    try {
      const { email, consentType, consentGiven, purpose, legalBasis = 'consent', processingActivity } = req.body;
      
      // Validate required fields
      if (!email || !consentType || typeof consentGiven !== 'boolean') {
        return res.status(400).json({ error: 'email, consentType, and consentGiven are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Validate the consent data using the schema
      const consentData = insertAnonymousConsentSchema.parse({
        email,
        consentType,
        consentGiven,
        purpose,
        legalBasis,
        processingActivity,
        ipAddress,
        userAgent,
      });

      const consent = await storage.createAnonymousConsent(consentData);

      console.log(`✅ Anonymous consent recorded: ${email} ${consentGiven ? 'granted' : 'denied'} consent for ${consentType} (${processingActivity || 'general'})`);

      res.json({ 
        success: true,
        consentId: consent.id,
        message: 'Consent recorded successfully',
        consent: {
          email: consent.email,
          consentType: consent.consentType,
          consentGiven: consent.consentGiven,
          consentDate: consent.consentDate,
          processingActivity: consent.processingActivity,
        }
      });
    } catch (error: any) {
      console.error('❌ Error recording anonymous consent:', error);
      res.status(500).json({ error: 'Failed to record consent' });
    }
  });

  app.get('/api/gdpr/consent-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consents = await storage.getUserConsent(userId);
      
      // Log data access
      await storage.logDataProcessing({
        userId,
        action: 'access',
        dataType: 'consent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: 'User accessed consent history',
        legalBasis: 'contract',
        processingPurpose: 'service_provision'
      });

      res.json(consents);
    } catch (error: any) {
      console.error('Error fetching consent history:', error);
      res.status(500).json({ error: 'Failed to fetch consent history' });
    }
  });

  app.get('/api/gdpr/processing-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const logs = await storage.getUserProcessingLogs(userId, limit);
      
      // Log this access
      await storage.logDataProcessing({
        userId,
        action: 'access',
        dataType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: 'User accessed processing history',
        legalBasis: 'contract',
        processingPurpose: 'service_provision'
      });

      res.json(logs);
    } catch (error: any) {
      console.error('Error fetching processing history:', error);
      res.status(500).json({ error: 'Failed to fetch processing history' });
    }
  });

  app.get('/api/gdpr/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consentStatus = await storage.getUserConsentStatus(userId);
      
      res.json(consentStatus);
    } catch (error: any) {
      console.error('Error fetching GDPR preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // Article 15: Right to Access - Get all personal data
  app.get('/api/gdpr/personal-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get comprehensive user data export
      const userData = await storage.exportUserData(userId);
      
      // Format for frontend display
      const formattedData = {
        profile: userData.user,
        courses: userData.courseEnrollments,
        quizResults: userData.quizResults,
        csvUploads: userData.csvUploads,
        sharedResults: userData.sharedResults,
        supportMessages: userData.supportMessages,
        consentRecords: userData.consents
      };

      // Log data access
      await storage.logDataProcessing({
        userId,
        action: 'access',
        dataType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: 'User accessed all personal data (Article 15)',
        legalBasis: 'contract',
        processingPurpose: 'service_provision'
      });

      res.json(formattedData);
    } catch (error: any) {
      console.error('Error fetching personal data:', error);
      res.status(500).json({ error: 'Failed to fetch personal data' });
    }
  });

  // Article 20: Right to Data Portability - Export user data
  app.get('/api/gdpr/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const userData = await storage.exportUserData(userId);
      
      // Create a comprehensive export with metadata
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: userId,
          dataSubject: userData.user.email,
          exportType: 'complete_personal_data',
          gdprArticle: 'Article 20 - Right to Data Portability'
        },
        personalData: userData
      };

      // Log the export action
      await storage.logDataProcessing({
        userId,
        action: 'export',
        dataType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: 'User exported personal data (Article 20)',
        legalBasis: 'contract',
        processingPurpose: 'service_provision'
      });

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="personal-data-export-${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(exportData);
    } catch (error: any) {
      console.error('Error exporting user data:', error);
      res.status(500).json({ error: 'Failed to export user data' });
    }
  });

  // Article 16: Right to Rectification - Update profile information
  app.patch('/api/gdpr/rectification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email } = req.body;
      
      // Validate input
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: 'firstName, lastName, and email are required' });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Update user profile
      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log the rectification action
      await storage.logDataProcessing({
        userId,
        action: 'modify',
        dataType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: 'User updated profile information (Article 16)',
        legalBasis: 'contract',
        processingPurpose: 'service_provision'
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Article 17: Right to Erasure - Delete user account
  app.post('/api/gdpr/delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason = 'User requested account deletion' } = req.body;
      
      // Perform soft delete with audit logging
      const deletionResult = await storage.deleteUserData(userId, {
        keepAuditLogs: true,
        keepAnonymizedData: false,
        reason: reason
      });

      // Log the deletion request
      await storage.logDataProcessing({
        userId,
        action: 'delete',
        dataType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: `User requested account deletion (Article 17): ${reason}`,
        legalBasis: 'contract',
        processingPurpose: 'compliance'
      });

      res.json({
        message: 'Account deletion request processed',
        deletionResult,
        note: 'Your account has been scheduled for deletion. You have 30 days to recover your account by logging in again.'
      });
    } catch (error: any) {
      console.error('Error processing deletion request:', error);
      res.status(500).json({ error: 'Failed to process deletion request' });
    }
  });

  // Article 21: Right to Object - Object to data processing
  app.post('/api/gdpr/objection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason, processingTypes = [] } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Reason for objection is required' });
      }

      // Log the objection
      await storage.logDataProcessing({
        userId,
        action: 'modify',
        dataType: 'consent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: `User objected to processing (Article 21): ${reason.trim()}`,
        legalBasis: 'legitimate_interest',
        processingPurpose: 'compliance'
      });

      // Update consent for specified processing types
      for (const processingType of processingTypes) {
        await storage.updateUserConsent(
          userId,
          processingType,
          false,
          { 
            ipAddress: req.ip, 
            userAgent: req.get('User-Agent')
          }
        );
      }

      // Create support message for manual review
      await storage.createSupportMessage({
        userId,
        name: 'GDPR Objection',
        email: req.user.claims.email,
        subject: 'Article 21 - Right to Object',
        message: `User has objected to data processing. Reason: ${reason.trim()}. Processing types affected: ${processingTypes.join(', ')}`
      });

      res.json({
        message: 'Your objection has been recorded and will be reviewed within 30 days',
        reference: 'GDPR-OBJ-' + Date.now(),
        affectedProcessing: processingTypes
      });
    } catch (error: any) {
      console.error('Error processing objection:', error);
      res.status(500).json({ error: 'Failed to process objection' });
    }
  });

  // Audit log access for transparency
  app.get('/api/gdpr/audit-log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const auditLogs = await storage.getUserProcessingLogs(userId, limit);
      
      // Log this access
      await storage.logDataProcessing({
        userId,
        action: 'access',
        dataType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestDetails: 'User accessed audit logs',
        legalBasis: 'contract',
        processingPurpose: 'service_provision'
      });

      res.json(auditLogs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // SECURE CSV Upload route - Server-side file handling
  app.post("/api/csv/upload", isAuthenticated, upload.single('csvFile'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { customFilename } = req.body;
      const file = req.file;

      // Validate required fields
      if (!file) {
        return res.status(400).json({ error: "No file uploaded. Please select a CSV file." });
      }

      if (!customFilename || typeof customFilename !== 'string') {
        return res.status(400).json({ error: "Custom filename is required." });
      }

      // Sanitize custom filename
      const sanitizedCustomFilename = customFilename
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 50);

      if (!sanitizedCustomFilename) {
        return res.status(400).json({ error: "Invalid custom filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed." });
      }

      // Server-side CSV parsing with security limits
      const parsedData = await parseCsvFileServerSide(file.buffer);
      
      // Validate parsed data structure for anomaly detection
      const { data: timeSeriesData, rowCount, columnCount } = parsedData;
      
      if (timeSeriesData.length === 0) {
        return res.status(400).json({ error: "CSV file is empty or invalid." });
      }

      // Check for percentile columns (required for anomaly detection)
      const firstRow = timeSeriesData[0];
      const headers = Object.keys(firstRow).filter(h => h !== '_rowIndex');
      const percentileColumns = headers.filter(header => {
        const match = header.toLowerCase().match(/^p(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          return num >= 1 && num <= 99;
        }
        return false;
      });

      const hasPercentileColumns = percentileColumns.length > 0;
      
      // Server-side Firebase Storage upload
      const firebaseResult = await uploadCsvFileServerSide(
        file.buffer,
        file.originalname,
        sanitizedCustomFilename,
        userId
      );

      // Create upload record with server-generated metadata
      const uploadData = insertCsvUploadSchema.parse({
        filename: file.originalname,
        customFilename: sanitizedCustomFilename,
        firebaseStorageUrl: firebaseResult.downloadURL,
        firebaseStoragePath: firebaseResult.fullPath,
        fileSize: firebaseResult.size,
        columnCount,
        rowCount,
        status: "uploaded",
        fileMetadata: {
          contentType: file.mimetype,
          percentileColumns,
          hasPercentileColumns,
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
          uploadedBy: userId,
          serverProcessed: true,
          userAgent: req.get('User-Agent') || 'unknown',
        },
        timeSeriesData,
      });

      const upload = await storage.createCsvUpload(uploadData, userId);
      res.json(upload);

    } catch (error: any) {
      console.error("Secure CSV upload error:", error);
      
      // Provide specific error messages for different types of failures
      if (error.message.includes('File size')) {
        return res.status(400).json({ error: "File too large. Maximum file size is 100MB." });
      } else if (error.message.includes('CSV file too large')) {
        return res.status(400).json({ error: "CSV data too large. Maximum 10,000 rows allowed." });
      } else if (error.message.includes('too many columns')) {
        return res.status(400).json({ error: "CSV has too many columns. Maximum 100 columns allowed." });
      } else if (error.message.includes('JSON size')) {
        return res.status(400).json({ error: "Parsed CSV data too large. Please reduce file size or data complexity." });
      } else if (error.message.includes('Firebase')) {
        return res.status(500).json({ error: "File storage error. Please try again." });
      }
      
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's CSV uploads
  app.get("/api/csv/uploads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploads = await storage.getUserCsvUploads(userId);
      res.json(uploads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update CSV upload (for renaming)
  app.patch("/api/csv/uploads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = req.params.id;
      const { customFilename } = req.body;

      // Verify the upload belongs to the user
      const upload = await storage.getCsvUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!customFilename || typeof customFilename !== 'string') {
        return res.status(400).json({ error: "customFilename is required and must be a string" });
      }

      // Update the upload
      const updatedUpload = await storage.updateCsvUpload(uploadId, {
        customFilename: customFilename.trim(),
      });

      if (!updatedUpload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      res.json(updatedUpload);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete CSV upload (with secure Firebase file deletion)
  app.delete("/api/csv/uploads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = req.params.id;

      // Verify the upload belongs to the user
      const upload = await storage.getCsvUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete from Firebase Storage first (server-side)
      try {
        await deleteCsvFileServerSide(upload.firebaseStoragePath);
      } catch (error) {
        console.warn("Firebase file deletion failed:", error);
        // Continue with database deletion even if Firebase deletion fails
      }

      // Delete related anomalies first
      const anomalies = await storage.getUploadAnomalies(uploadId);
      for (const anomaly of anomalies) {
        await storage.deleteAnomaly(anomaly.id);
      }

      // Delete the upload record
      const deleted = await storage.deleteCsvUpload(uploadId);
      if (!deleted) {
        return res.status(404).json({ error: "Upload not found" });
      }

      res.json({ message: "Upload deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SECURE CSV file download route with ownership verification
  app.get("/api/csv/uploads/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = req.params.id;

      // Verify the upload belongs to the user
      const upload = await storage.getCsvUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only download your own files." });
      }

      // Generate secure signed URL for download
      const signedUrl = await getSignedDownloadURL(upload.firebaseStoragePath, userId);

      // Return the signed URL for client-side download
      res.json({ 
        downloadUrl: signedUrl,
        filename: upload.customFilename,
        expiresIn: "1 hour"
      });

    } catch (error: any) {
      console.error("Secure download error:", error);
      if (error.message.includes("Access denied")) {
        return res.status(403).json({ error: error.message });
      } else if (error.message.includes("not found")) {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(500).json({ error: "Failed to generate download link" });
    }
  });

  app.post("/api/csv/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const upload = await storage.getCsvUpload(req.params.id);
      if (!upload) {
        return res.status(404).json({ error: "CSV upload not found" });
      }

      // Verify the upload belongs to the authenticated user
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only analyze your own files." });
      }

      // Update status to processing
      await storage.updateCsvUpload(upload.id, { status: "processing" });

      const csvData = upload.timeSeriesData as any[];
      const anomalies = [];

      // Anomaly Detection Logic
      
      // 1. Detect p50 median spikes (when p50 is much greater than other rows)
      const p50Values = csvData.map((row, index) => ({ value: parseFloat(row.p50), index, date: row.date || `Row ${index + 1}` }));
      const p50Mean = p50Values.reduce((sum, item) => sum + item.value, 0) / p50Values.length;
      const p50StdDev = Math.sqrt(p50Values.reduce((sum, item) => sum + Math.pow(item.value - p50Mean, 2), 0) / p50Values.length);
      
      for (const item of p50Values) {
        // Detect spikes (value > mean + 2*stddev)
        if (item.value > p50Mean + 2 * p50StdDev) {
          const weekBeforeIndex = Math.max(0, item.index - 7);
          const weekBeforeValue = item.index > 6 ? parseFloat(csvData[weekBeforeIndex].p90) : null;
          const p90Value = parseFloat(csvData[item.index].p90);
          
          anomalies.push({
            uploadId: upload.id,
            anomalyType: "p50_median_spike",
            detectedDate: item.date,
            weekBeforeValue,
            p90Value,
            description: `P50 median spike detected: ${item.value.toFixed(2)} (${((item.value - p50Mean) / p50StdDev).toFixed(1)}σ above mean)`
          });
        }
      }

      // 2. Detect p10 consecutive lows (when p10 is much lower back-to-back)
      const p10Values = csvData.map((row, index) => ({ value: parseFloat(row.p10), index, date: row.date || `Row ${index + 1}` }));
      const p10Mean = p10Values.reduce((sum, item) => sum + item.value, 0) / p10Values.length;
      const p10StdDev = Math.sqrt(p10Values.reduce((sum, item) => sum + Math.pow(item.value - p10Mean, 2), 0) / p10Values.length);
      
      for (let i = 1; i < p10Values.length; i++) {
        const current = p10Values[i];
        const previous = p10Values[i - 1];
        
        // Check if both current and previous are low (< mean - 1.5*stddev)
        if (current.value < p10Mean - 1.5 * p10StdDev && previous.value < p10Mean - 1.5 * p10StdDev) {
          const weekBeforeIndex = Math.max(0, current.index - 7);
          const weekBeforeValue = current.index > 6 ? parseFloat(csvData[weekBeforeIndex].p90) : null;
          const p90Value = parseFloat(csvData[current.index].p90);
          
          anomalies.push({
            uploadId: upload.id,
            anomalyType: "p10_consecutive_low",
            detectedDate: current.date,
            weekBeforeValue,
            p90Value,
            description: `P10 consecutive low detected: ${previous.value.toFixed(2)} → ${current.value.toFixed(2)} (both below normal range)`
          });
        }
      }

      // Store detected anomalies
      const storedAnomalies = [];
      for (const anomaly of anomalies) {
        const validatedAnomaly = insertAnomalySchema.parse(anomaly);
        const stored = await storage.createAnomaly(validatedAnomaly);
        storedAnomalies.push(stored);
      }

      // Get OpenAI analysis if available
      let openaiAnalysis = null;
      if (openai && storedAnomalies.length > 0) {
        try {
          const anomalyDescriptions = storedAnomalies.map(a => a.description).join("; ");
          const response = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
              {
                role: "system",
                content: "You are a time series analysis expert. Analyze the detected anomalies in SageMaker forecasting data and provide insights on potential causes and recommendations."
              },
              {
                role: "user",
                content: `Analyze these detected anomalies in time series forecasting data: ${anomalyDescriptions}. The data contains percentile forecasts (p1-p99). Provide insights on what might be causing these anomalies and recommendations for handling them.`
              }
            ],
          });
          openaiAnalysis = response.choices[0].message.content;

          // Update anomalies with OpenAI analysis
          for (const stored of storedAnomalies) {
            await storage.createAnomaly({
              ...stored,
              openaiAnalysis
            });
          }
        } catch (error) {
          console.warn("OpenAI analysis failed:", error);
        }
      }

      // Update status to completed
      await storage.updateCsvUpload(upload.id, { 
        status: "completed", 
        processedAt: new Date() 
      });

      res.json({ 
        anomalies: storedAnomalies, 
        openaiAnalysis,
        summary: {
          totalAnomalies: storedAnomalies.length,
          p50Spikes: storedAnomalies.filter(a => a.anomalyType === "p50_median_spike").length,
          p10ConsecutiveLows: storedAnomalies.filter(a => a.anomalyType === "p10_consecutive_low").length
        }
      });
    } catch (error: any) {
      // Update status to error
      try {
        await storage.updateCsvUpload(req.params.id, { status: "error" });
      } catch (e) {
        console.error("Failed to update status to error:", e);
      }
      res.status(500).json({ error: error.message });
    }
  });


  app.get("/api/csv/:id/anomalies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = req.params.id;
      
      // Verify the upload belongs to the authenticated user
      const upload = await storage.getCsvUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only view anomalies for your own files." });
      }

      const anomalies = await storage.getUploadAnomalies(uploadId);
      res.json(anomalies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/anomalies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const anomalies = await storage.getUserAnomalies(userId);
      res.json(anomalies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Excel Export Route for Monday.com
  app.get("/api/anomalies/:uploadId/export-excel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = req.params.uploadId;

      // Get upload and verify ownership
      const upload = await storage.getCsvUpload(uploadId);
      if (!upload) {
        return res.status(404).json({ error: "CSV upload not found" });
      }

      // Verify the upload belongs to the authenticated user
      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only export your own files." });
      }

      const anomalies = await storage.getUploadAnomalies(uploadId);
      if (anomalies.length === 0) {
        return res.status(404).json({ error: "No anomalies found for this upload" });
      }

      // Get user data for owner info
      const user = await storage.getUser(userId);
      const ownerEmail = user?.email || "unknown@example.com";

      // Create new workbook
      const workbook = XLSX.utils.book_new();

      // Helper function to convert anomaly type to priority
      const getPriority = (type: string): string => {
        switch (type) {
          case "p50_median_spike": return "High";
          case "p10_consecutive_low": return "Medium";
          default: return "Low";
        }
      };

      // Helper function to get progress based on anomaly type
      const getProgress = (type: string): number => {
        switch (type) {
          case "p50_median_spike": return 25; // Critical spikes need immediate attention
          case "p10_consecutive_low": return 50; // Low values might be ongoing
          default: return 10;
        }
      };

      // 1. Create Summary Sheet
      const summaryData = [
        ["Monday.com Export Summary"],
        [""],
        ["Upload Information"],
        ["File Name", upload.filename],
        ["Upload Date", new Date(upload.uploadedAt).toLocaleDateString()],
        ["Total Rows", upload.rowCount],
        ["Total Columns", upload.columnCount],
        [""],
        ["Anomaly Statistics"],
        ["Total Anomalies", anomalies.length],
        ["P50 Median Spikes", anomalies.filter(a => a.anomalyType === "p50_median_spike").length],
        ["P10 Consecutive Lows", anomalies.filter(a => a.anomalyType === "p10_consecutive_low").length],
        [""],
        ["Export Information"],
        ["Generated Date", new Date().toLocaleString()],
        ["Generated By", ownerEmail],
        ["Export Type", "Monday.com Productivity Sheet"],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // 2. Create All Anomalies Sheet (Monday.com format)
      const mondayHeaders = [
        "Item Name",
        "Status", 
        "Priority",
        "Date",
        "Owner",
        "Notes",
        "Progress (%)",
        "Anomaly Type",
        "P90 Value",
        "Week Before Value"
      ];

      const mondayData = [
        mondayHeaders,
        ...anomalies.map(anomaly => [
          anomaly.description.substring(0, 100) + (anomaly.description.length > 100 ? "..." : ""), // Item Name
          "Detected", // Status
          getPriority(anomaly.anomalyType), // Priority
          anomaly.detectedDate, // Date
          ownerEmail, // Owner
          `${anomaly.openaiAnalysis || "AI analysis pending"} | P90: ${anomaly.p90Value?.toFixed(2) || "N/A"} | Week Before: ${anomaly.weekBeforeValue?.toFixed(2) || "N/A"}`, // Notes
          getProgress(anomaly.anomalyType), // Progress
          anomaly.anomalyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Anomaly Type
          anomaly.p90Value?.toFixed(2) || "N/A", // P90 Value
          anomaly.weekBeforeValue?.toFixed(2) || "N/A" // Week Before Value
        ])
      ];

      const allAnomaliesSheet = XLSX.utils.aoa_to_sheet(mondayData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 30 }, // Item Name
        { wch: 12 }, // Status
        { wch: 10 }, // Priority
        { wch: 15 }, // Date
        { wch: 25 }, // Owner
        { wch: 50 }, // Notes
        { wch: 12 }, // Progress
        { wch: 20 }, // Anomaly Type
        { wch: 12 }, // P90 Value
        { wch: 15 }  // Week Before Value
      ];
      allAnomaliesSheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, allAnomaliesSheet, "All Anomalies");

      // 3. Create P50 Anomalies Sheet
      const p50Anomalies = anomalies.filter(a => a.anomalyType === "p50_median_spike");
      if (p50Anomalies.length > 0) {
        const p50Data = [
          mondayHeaders,
          ...p50Anomalies.map(anomaly => [
            anomaly.description.substring(0, 100) + (anomaly.description.length > 100 ? "..." : ""),
            "Critical - Spike Detected",
            "High",
            anomaly.detectedDate,
            ownerEmail,
            `SPIKE ALERT: ${anomaly.openaiAnalysis || "Median spike detected"} | Current P90: ${anomaly.p90Value?.toFixed(2) || "N/A"} | Previous Week: ${anomaly.weekBeforeValue?.toFixed(2) || "N/A"}`,
            25,
            "P50 Median Spike",
            anomaly.p90Value?.toFixed(2) || "N/A",
            anomaly.weekBeforeValue?.toFixed(2) || "N/A"
          ])
        ];

        const p50Sheet = XLSX.utils.aoa_to_sheet(p50Data);
        p50Sheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, p50Sheet, "P50 Anomalies");
      }

      // 4. Create P10 Anomalies Sheet
      const p10Anomalies = anomalies.filter(a => a.anomalyType === "p10_consecutive_low");
      if (p10Anomalies.length > 0) {
        const p10Data = [
          mondayHeaders,
          ...p10Anomalies.map(anomaly => [
            anomaly.description.substring(0, 100) + (anomaly.description.length > 100 ? "..." : ""),
            "Monitor - Low Values",
            "Medium", 
            anomaly.detectedDate,
            ownerEmail,
            `LOW VALUES: ${anomaly.openaiAnalysis || "Consecutive low values detected"} | Current P90: ${anomaly.p90Value?.toFixed(2) || "N/A"} | Previous Week: ${anomaly.weekBeforeValue?.toFixed(2) || "N/A"}`,
            50,
            "P10 Consecutive Low",
            anomaly.p90Value?.toFixed(2) || "N/A",
            anomaly.weekBeforeValue?.toFixed(2) || "N/A"
          ])
        ];

        const p10Sheet = XLSX.utils.aoa_to_sheet(p10Data);
        p10Sheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, p10Sheet, "P10 Anomalies");
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `anomaly-export-${upload.filename.replace('.csv', '')}-${timestamp}.xlsx`;

      // Convert workbook to buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      // Send the Excel file
      res.send(buffer);

    } catch (error: any) {
      console.error("Excel export error:", error);
      res.status(500).json({ error: "Failed to generate Excel export: " + error.message });
    }
  });

  // ===== SHARING ROUTES =====
  
  // POST /api/share/results - Create shareable link for anomaly results
  app.post("/api/share/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shareData = insertSharedResultSchema.parse(req.body);

      // Verify the CSV upload exists and belongs to the user
      const upload = await storage.getCsvUpload(shareData.csvUploadId);
      if (!upload) {
        return res.status(404).json({ error: "CSV upload not found" });
      }

      if (upload.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only share your own files." });
      }

      // Check if anomalies exist for this upload
      const anomalies = await storage.getUploadAnomalies(shareData.csvUploadId);
      if (anomalies.length === 0) {
        return res.status(400).json({ error: "No anomalies found for this upload. Please analyze the file first." });
      }

      // Create the shared result
      const sharedResult = await storage.createSharedResult(shareData, userId);

      // Log the creation for security monitoring
      await storage.logAccess(sharedResult.id, {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
      });

      res.status(201).json({
        id: sharedResult.id,
        shareToken: sharedResult.shareToken,
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${sharedResult.shareToken}`,
        permissions: sharedResult.permissions,
        expiresAt: sharedResult.expiresAt,
        createdAt: sharedResult.createdAt,
      });

    } catch (error: any) {
      console.error("Share creation error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/share/:token - View shared results (public endpoint, no auth required)
  app.get("/api/share/:token", async (req, res) => {
    try {
      const token = req.params.token;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Invalid share token" });
      }

      const sharedData = await storage.getSharedResultByToken(token);
      if (!sharedData) {
        return res.status(404).json({ error: "Shared result not found or expired" });
      }

      // Get anomalies for this upload
      const anomalies = await storage.getUploadAnomalies(sharedData.csvUploadId);

      // Increment view count
      await storage.incrementViewCount(sharedData.id);

      // Log access for security monitoring
      await storage.logAccess(sharedData.id, {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
      });

      // Return sanitized data for public viewing
      res.json({
        id: sharedData.id,
        title: sharedData.title,
        description: sharedData.description,
        permissions: sharedData.permissions,
        viewCount: sharedData.viewCount + 1, // Include the current view
        upload: {
          id: sharedData.upload.id,
          filename: sharedData.upload.filename,
          customFilename: sharedData.upload.customFilename,
          rowCount: sharedData.upload.rowCount,
          columnCount: sharedData.upload.columnCount,
          uploadedAt: sharedData.upload.uploadedAt,
          status: sharedData.upload.status,
          timeSeriesData: sharedData.upload.timeSeriesData,
        },
        anomalies: anomalies.map(anomaly => ({
          id: anomaly.id,
          anomalyType: anomaly.anomalyType,
          detectedDate: anomaly.detectedDate,
          weekBeforeValue: anomaly.weekBeforeValue,
          p90Value: anomaly.p90Value,
          description: anomaly.description,
          openaiAnalysis: anomaly.openaiAnalysis,
          createdAt: anomaly.createdAt,
        })),
        sharedBy: {
          firstName: sharedData.user.firstName,
          lastName: sharedData.user.lastName,
        },
        sharedAt: sharedData.createdAt,
      });

    } catch (error: any) {
      console.error("Share viewing error:", error);
      res.status(500).json({ error: "Failed to load shared result" });
    }
  });

  // GET /api/user/shared - Get user's shared results list
  app.get("/api/user/shared", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedResults = await storage.getUserSharedResults(userId);

      res.json(sharedResults.map(shared => ({
        id: shared.id,
        shareToken: shared.shareToken,
        title: shared.title,
        description: shared.description,
        permissions: shared.permissions,
        expiresAt: shared.expiresAt,
        viewCount: shared.viewCount,
        createdAt: shared.createdAt,
        updatedAt: shared.updatedAt,
        upload: {
          id: shared.upload.id,
          filename: shared.upload.filename,
          customFilename: shared.upload.customFilename,
          uploadedAt: shared.upload.uploadedAt,
        },
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${shared.shareToken}`,
      })));

    } catch (error: any) {
      console.error("Get user shared results error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/share/:id - Update sharing permissions/expiration
  app.patch("/api/share/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shareId = req.params.id;
      const updates = req.body;

      // Get the shared result and verify ownership
      const sharedResult = await storage.getSharedResult(shareId);
      if (!sharedResult) {
        return res.status(404).json({ error: "Shared result not found" });
      }

      if (sharedResult.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only update your own shared results." });
      }

      // Validate and prepare updates
      const allowedUpdates: any = {};
      
      if (updates.permissions && ['view_only', 'view_download'].includes(updates.permissions)) {
        allowedUpdates.permissions = updates.permissions;
      }
      
      if (updates.title !== undefined) {
        allowedUpdates.title = updates.title;
      }
      
      if (updates.description !== undefined) {
        allowedUpdates.description = updates.description;
      }

      if (updates.expirationOption) {
        const now = new Date();
        switch (updates.expirationOption) {
          case '24h':
            allowedUpdates.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case '7d':
            allowedUpdates.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            allowedUpdates.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          case 'never':
            allowedUpdates.expiresAt = null;
            break;
        }
      }

      const updatedSharedResult = await storage.updateSharedResult(shareId, allowedUpdates);
      
      if (!updatedSharedResult) {
        return res.status(404).json({ error: "Failed to update shared result" });
      }

      res.json({
        id: updatedSharedResult.id,
        permissions: updatedSharedResult.permissions,
        expiresAt: updatedSharedResult.expiresAt,
        title: updatedSharedResult.title,
        description: updatedSharedResult.description,
        updatedAt: updatedSharedResult.updatedAt,
      });

    } catch (error: any) {
      console.error("Update shared result error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/share/:id - Revoke sharing access
  app.delete("/api/share/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const shareId = req.params.id;

      // Get the shared result and verify ownership
      const sharedResult = await storage.getSharedResult(shareId);
      if (!sharedResult) {
        return res.status(404).json({ error: "Shared result not found" });
      }

      if (sharedResult.userId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only delete your own shared results." });
      }

      const deleted = await storage.deleteSharedResult(shareId);
      if (!deleted) {
        return res.status(404).json({ error: "Failed to delete shared result" });
      }

      res.json({ message: "Shared result access revoked successfully" });

    } catch (error: any) {
      console.error("Delete shared result error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/share/:token/download - Download Excel export of shared results (if permitted)
  app.get("/api/share/:token/download", async (req, res) => {
    try {
      const token = req.params.token;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Invalid share token" });
      }

      const sharedData = await storage.getSharedResultByToken(token);
      if (!sharedData) {
        return res.status(404).json({ error: "Shared result not found or expired" });
      }

      // Check if download is permitted
      if (sharedData.permissions !== 'view_download') {
        return res.status(403).json({ error: "Download not permitted for this shared result" });
      }

      // Get anomalies for this upload
      const anomalies = await storage.getUploadAnomalies(sharedData.csvUploadId);
      if (anomalies.length === 0) {
        return res.status(404).json({ error: "No anomalies found for this shared result" });
      }

      // Log access for security monitoring
      await storage.logAccess(sharedData.id, {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
      });

      // Generate Excel file (reuse logic from existing export route)
      const upload = sharedData.upload;
      const ownerEmail = sharedData.user?.email || "unknown@example.com";

      // Create new workbook
      const workbook = XLSX.utils.book_new();

      // Helper functions
      const getPriority = (type: string): string => {
        switch (type) {
          case "p50_median_spike": return "High";
          case "p10_consecutive_low": return "Medium";
          default: return "Low";
        }
      };

      const getProgress = (type: string): number => {
        switch (type) {
          case "p50_median_spike": return 25;
          case "p10_consecutive_low": return 50;
          default: return 10;
        }
      };

      // 1. Create Summary Sheet
      const summaryData = [
        ["Shared Anomaly Analysis Report"],
        [""],
        ["Upload Information"],
        ["File Name", upload.filename],
        ["Upload Date", new Date(upload.uploadedAt).toLocaleDateString()],
        ["Total Rows", upload.rowCount],
        ["Total Columns", upload.columnCount],
        [""],
        ["Anomaly Statistics"],
        ["Total Anomalies", anomalies.length],
        ["P50 Median Spikes", anomalies.filter(a => a.anomalyType === "p50_median_spike").length],
        ["P10 Consecutive Lows", anomalies.filter(a => a.anomalyType === "p10_consecutive_low").length],
        [""],
        ["Sharing Information"],
        ["Shared By", `${sharedData.user.firstName || ''} ${sharedData.user.lastName || ''}`.trim()],
        ["Shared Date", new Date(sharedData.createdAt).toLocaleString()],
        ["Downloaded Date", new Date().toLocaleString()],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ width: 20 }, { width: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // 2. Create All Anomalies Sheet
      const allAnomaliesData = [
        ["Task Name", "Priority", "Status", "Progress %", "Date Detected", "Type", "Description", "P90 Value", "Week Before P90", "Notes"]
      ];

      anomalies.forEach((anomaly, index) => {
        allAnomaliesData.push([
          `Anomaly ${index + 1}: ${anomaly.detectedDate}`,
          getPriority(anomaly.anomalyType),
          "Open",
          getProgress(anomaly.anomalyType),
          anomaly.detectedDate,
          anomaly.anomalyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          anomaly.description,
          anomaly.p90Value?.toFixed(2) || "N/A",
          anomaly.weekBeforeValue?.toFixed(2) || "N/A",
          anomaly.openaiAnalysis || "No AI analysis available"
        ]);
      });

      const allAnomaliesSheet = XLSX.utils.aoa_to_sheet(allAnomaliesData);
      const colWidths = [
        { width: 25 }, { width: 10 }, { width: 10 }, { width: 12 },
        { width: 15 }, { width: 20 }, { width: 40 }, { width: 12 },
        { width: 15 }, { width: 50 }
      ];
      allAnomaliesSheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(workbook, allAnomaliesSheet, "All Anomalies");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `shared-anomaly-export-${upload.filename.replace('.csv', '')}-${timestamp}.xlsx`;

      // Convert workbook to buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      // Send the Excel file
      res.send(buffer);

    } catch (error: any) {
      console.error("Shared Excel download error:", error);
      res.status(500).json({ error: "Failed to download shared Excel export: " + error.message });
    }
  });

  // File download routes (simulated)
  app.get("/api/courses/:id/:type", (req, res) => {
    const { id, type } = req.params;
    
    // In a real app, this would serve actual files
    const fileTypes: Record<string, string> = {
      video: "video/mp4",
      slides: "application/pdf", 
      documents: "application/pdf",
      code: "application/zip"
    };

    const contentType = fileTypes[type] || "application/octet-stream";
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="course-${id}-${type}"`);
    res.send(`Sample ${type} content for course ${id}`);
  });

  const httpServer = createServer(app);
  return httpServer;
}
