import { 
  type User, 
  type InsertUser,
  type UpsertUser, 
  type Course,
  type InsertCourse,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  type Lesson,
  type InsertLesson,
  type CourseMaterial,
  type InsertCourseMaterial,
  type UserProgress,
  type InsertUserProgress,
  type Quiz,
  type InsertQuiz,
  type Question,
  type InsertQuestion,
  type QuestionOption,
  type InsertQuestionOption,
  type QuizAttempt,
  type InsertQuizAttempt,
  type QuestionResponse,
  type InsertQuestionResponse,
  type Certificate,
  type InsertCertificate,
  type SupportMessage,
  type InsertSupportMessage,
  type CsvUpload,
  type InsertCsvUpload,
  type Anomaly,
  type InsertAnomaly,
  type SharedResult,
  type InsertSharedResult,
  type UserConsent,
  type InsertUserConsent,
  type AnonymousConsent,
  type InsertAnonymousConsent,
  type DataProcessingLog,
  type InsertDataProcessingLog,
  type AuthAuditLog,
  type InsertAuthAuditLog,
  type UserSession,
  type InsertUserSession,
  type ConsentType,
  type LegalBasis,
  type ProcessingAction,
  type DataType,
  type ProcessingPurpose,
  type AccessGrant,
  type InsertAccessGrant,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type ShareInvite,
  type InsertShareInvite,
  type ShareLink,
  type InsertShareLink,
  type ResourceType,
  type PrincipalType,
  type Permission,
  type TeamRole,
  type InviteStatus,
  type MarketDataDownload,
  type InsertMarketDataDownload,
  type PopularSymbol,
  type InsertPopularSymbol,
  type Payment,
  type InsertPayment,
  type AutoMLJob,
  type InsertAutoMLJob,
  type NotificationTemplate,
  type InsertNotificationTemplate,
  type AlertRule,
  type InsertAlertRule,
  type AlertSubscription,
  type InsertAlertSubscription,
  type NotificationQueue,
  type InsertNotificationQueue,
  type NotificationEvent,
  type InsertNotificationEvent,
  type AdminApproval,
  type InsertAdminApproval,
  type CrashReport,
  type InsertCrashReport,
  type MarketDataCache,
  type InsertMarketDataCache,
  type ProductivityBoard,
  type InsertProductivityBoard,
  type ProductivityItem,
  type InsertProductivityItem,
  type ItemColumn,
  type InsertItemColumn,
  type ColumnValue,
  type InsertColumnValue,
  type ProductivityNotification,
  type InsertProductivityNotification,
  type ProductivityReminder,
  type InsertProductivityReminder,
  type BoardTemplate,
  type InsertBoardTemplate,
  type BoardAutomation,
  type InsertBoardAutomation,
  type ActivityLog,
  type InsertActivityLog,
  type UserNotificationPreferences,
  type InsertUserNotificationPreferences,
  type InAppNotification,
  type InsertInAppNotification,
  type BackgroundJob,
  type InsertBackgroundJob,
} from "@shared/schema";
import { 
  users, 
  courses, 
  courseEnrollments, 
  lessons, 
  courseMaterials, 
  userProgress,
  quizzes,
  questions,
  questionOptions,
  quizAttempts,
  questionResponses,
  certificates,
  supportMessages,
  csvUploads,
  anomalies,
  sharedResults,
  userConsent,
  anonymousConsent,
  dataProcessingLog,
  authAuditLog,
  userSessions,
  accessGrants,
  teams,
  teamMembers,
  shareInvites,
  shareLinks,
  marketDataDownloads,
  popularSymbols,
  payments,
  automlJobs,
  notificationTemplates,
  alertRules,
  alertSubscriptions,
  notificationQueue,
  notificationEvents,
  adminApprovals,
  crashReports,
  marketDataCache,
  productivityBoards,
  productivityItems,
  itemColumns,
  columnValues,
  productivityNotifications,
  productivityReminders,
  boardTemplates,
  boardAutomations,
  activityLog,
  userNotificationPreferences,
  inAppNotifications,
  backgroundJobs,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, count, avg, sum, gte, lte, like, inArray, isNull, not, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

/**
 * DatabaseStorage - Real PostgreSQL implementation of IStorage interface
 * Replaces MemStorage to provide persistent data storage using Drizzle ORM
 */
export class DatabaseStorage implements IStorage {
  
  constructor() {
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      // Check if admin user exists, if not create one
      const existingAdmin = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }).from(users).where(eq(users.email, "tamzid257@gmail.com")).limit(1);
    
      if (existingAdmin.length === 0) {
        console.log("🔧 Initializing admin user and sample data...");
      
        // Create admin user
        const adminUser: InsertUser = {
          email: "tamzid257@gmail.com",
          firstName: "Tamzid",
          lastName: "Admin",
          profileImageUrl: null,
          role: "admin",
          isApproved: true,
          dataRetentionUntil: null,
          marketingConsent: true,
          analyticsConsent: true,
          dataProcessingBasis: "consent",
          lastConsentUpdate: new Date(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          subscriptionPlan: null,
          subscriptionStartDate: null,
          subscriptionEndDate: null,
          automlCreditsRemaining: 100,
          automlCreditsTotal: 100,
          monthlyUsageResetDate: new Date(),
          defaultPaymentMethodId: null,
          isPremiumApproved: true,
          premiumApprovedAt: new Date(),
          premiumApprovedBy: "system",
          premiumTier: "professional",
          premiumStatus: "premium",
          premiumRequestedAt: null,
          premiumRequestJustification: null,
        };

        await db.insert(users).values(adminUser);
        console.log("✅ Admin user created successfully");
        
        // Create sample courses if they don't exist
        const existingCourses = await db.select().from(courses).limit(1);
        if (existingCourses.length === 0) {
          const sampleCourses: InsertCourse[] = [
            {
              title: "Financial Markets Fundamentals",
              description: "Learn the basics of financial markets, trading strategies, and risk management.",
              level: "beginner",
              price: 99,
              rating: 48,
              imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240",
              videoUrl: "/api/courses/1/video",
              slidesUrl: "/api/courses/1/slides",
              documentsUrl: "/api/courses/1/documents", 
              codeUrl: "/api/courses/1/code",
              status: "published",
              instructor: "Dr. Sarah Johnson",
              duration: 120,
              category: "Finance",
              thumbnailUrl: null,
              previewVideoUrl: null,
              totalLessons: 0,
              estimatedCompletionHours: 4,
              prerequisites: null,
              learningObjectives: ["Understand financial markets", "Learn trading basics", "Master risk management"],
              tags: ["finance", "markets", "beginner"],
              publishedAt: new Date(),
              ownerId: "tamzid-admin-id"
            },
            {
              title: "Machine Learning for Finance",
              description: "Apply machine learning techniques to financial data using Python and SageMaker.",
              level: "intermediate",
              price: 199,
              rating: 49,
              imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240",
              videoUrl: "/api/courses/2/video",
              slidesUrl: "/api/courses/2/slides",
              documentsUrl: "/api/courses/2/documents",
              codeUrl: "/api/courses/2/code",
              status: "published",
              instructor: "Prof. Michael Chen",
              duration: 180,
              category: "Machine Learning",
              thumbnailUrl: null,
              previewVideoUrl: null,
              totalLessons: 0,
              estimatedCompletionHours: 6,
              prerequisites: ["Basic Python knowledge"],
              learningObjectives: ["Master ML algorithms", "Apply ML to finance", "Use Python libraries"],
              tags: ["ml", "finance", "python", "intermediate"],
              publishedAt: new Date(),
              ownerId: "tamzid-admin-id"
            }
          ];

          await db.insert(courses).values(sampleCourses);
          console.log("✅ Sample courses created successfully");
        }
      }
    } catch (error: any) {
      console.warn("⚠️ Database initialization had issues, but continuing...", error.message);
    }
  }

  // ===================
  // USER MANAGEMENT
  // ===================

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert operation");
    }

    // Check if user exists by ID or email
    let existingUser = await this.getUser(userData.id);
    
    if (!existingUser && userData.email) {
      // Also check by email in case user exists with different ID
      const emailResult = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      existingUser = emailResult[0];
    }
    
    if (existingUser) {
      // Update existing user
      const result = await db.update(users)
        .set({
          ...userData,
          lastConsentUpdate: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      
      return result[0];
    } else {
      // Create new user
      const newUser: InsertUser = {
        id: userData.id,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "user",
        isApproved: userData.isApproved ?? true,
        dataRetentionUntil: null,
        marketingConsent: false,
        analyticsConsent: false,
        dataProcessingBasis: "consent",
        lastConsentUpdate: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        automlCreditsRemaining: 0,
        automlCreditsTotal: 0,
        monthlyUsageResetDate: new Date(),
        defaultPaymentMethodId: null,
        isPremiumApproved: false,
        premiumApprovedAt: null,
        premiumApprovedBy: null,
        premiumTier: null,
        premiumStatus: null,
        premiumRequestedAt: null,
        premiumRequestJustification: null,
      };

      const result = await db.insert(users).values(newUser).returning();
      return result[0];
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.id));
  }

  async updateUserStripeInfo(userId: string, stripeData: { customerId?: string; subscriptionId?: string }): Promise<void> {
    await db.update(users)
      .set(stripeData)
      .where(eq(users.id, userId));
  }

  // ===================
  // COURSE MANAGEMENT
  // ===================

  async getCourse(id: string): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result[0];
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.publishedAt));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(course).returning();
    return result[0];
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course> {
    const result = await db.update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // ===================
  // ENROLLMENT MANAGEMENT
  // ===================

  async getEnrollment(userId: string, courseId: string): Promise<CourseEnrollment | undefined> {
    const result = await db.select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)))
      .limit(1);
    return result[0];
  }

  async enrollUserInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const result = await db.insert(courseEnrollments).values(enrollment).returning();
    return result[0];
  }

  async getUserEnrollments(userId: string): Promise<CourseEnrollment[]> {
    return await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId))
      .orderBy(desc(courseEnrollments.enrolledAt));
  }

  // ===================
  // SUPPORT MESSAGES
  // ===================

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const result = await db.insert(supportMessages).values(message).returning();
    return result[0];
  }

  async getSupportMessages(): Promise<SupportMessage[]> {
    return await db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt));
  }

  // ===================
  // CSV UPLOADS
  // ===================

  async createCsvUpload(csvData: InsertCsvUpload): Promise<CsvUpload> {
    const result = await db.insert(csvUploads).values(csvData).returning();
    return result[0];
  }

  async getCsvUpload(id: string): Promise<CsvUpload | undefined> {
    const result = await db.select().from(csvUploads).where(eq(csvUploads.id, id)).limit(1);
    return result[0];
  }

  async getUserCsvUploads(userId: string): Promise<CsvUpload[]> {
    return await db.select()
      .from(csvUploads)
      .where(eq(csvUploads.userId, userId))
      .orderBy(desc(csvUploads.createdAt));
  }

  async updateCsvUpload(id: string, updates: Partial<InsertCsvUpload>): Promise<CsvUpload> {
    const result = await db.update(csvUploads)
      .set(updates)
      .where(eq(csvUploads.id, id))
      .returning();
    return result[0];
  }

  async deleteCsvUpload(id: string): Promise<void> {
    await db.delete(csvUploads).where(eq(csvUploads.id, id));
  }

  // ===================
  // ANOMALY DETECTION
  // ===================

  async createAnomaly(anomaly: InsertAnomaly): Promise<Anomaly> {
    const result = await db.insert(anomalies).values(anomaly).returning();
    return result[0];
  }

  async getUploadAnomalies(uploadId: string): Promise<Anomaly[]> {
    return await db.select()
      .from(anomalies)
      .where(eq(anomalies.uploadId, uploadId))
      .orderBy(desc(anomalies.createdAt));
  }

  async getUserAnomalies(userId: string): Promise<(Anomaly & { upload: CsvUpload })[]> {
    const result = await db.select({
      // Anomaly fields
      id: anomalies.id,
      uploadId: anomalies.uploadId,
      anomalyType: anomalies.anomalyType,
      detectedDate: anomalies.detectedDate,
      weekBeforeValue: anomalies.weekBeforeValue,
      p90Value: anomalies.p90Value,
      description: anomalies.description,
      openaiAnalysis: anomalies.openaiAnalysis,
      createdAt: anomalies.createdAt,
      // Upload fields (nested as upload object)
      upload: {
        id: csvUploads.id,
        userId: csvUploads.userId,
        filename: csvUploads.filename,
        customFilename: csvUploads.customFilename,
        objectStoragePath: csvUploads.objectStoragePath,
        fileSize: csvUploads.fileSize,
        columnCount: csvUploads.columnCount,
        rowCount: csvUploads.rowCount,
        status: csvUploads.status,
        fileMetadata: csvUploads.fileMetadata,
        timeSeriesData: csvUploads.timeSeriesData,
        uploadedAt: csvUploads.uploadedAt,
        processedAt: csvUploads.processedAt,
        firebaseStorageUrl: csvUploads.firebaseStorageUrl,
        firebaseStoragePath: csvUploads.firebaseStoragePath,
      }
    })
    .from(anomalies)
    .innerJoin(csvUploads, eq(anomalies.uploadId, csvUploads.id))
    .where(eq(csvUploads.userId, userId))
    .orderBy(desc(anomalies.createdAt));

    return result;
  }

  async getAllAnomalies(): Promise<(Anomaly & { upload: CsvUpload })[]> {
    const result = await db.select({
      // Anomaly fields
      id: anomalies.id,
      uploadId: anomalies.uploadId,
      anomalyType: anomalies.anomalyType,
      detectedDate: anomalies.detectedDate,
      weekBeforeValue: anomalies.weekBeforeValue,
      p90Value: anomalies.p90Value,
      description: anomalies.description,
      openaiAnalysis: anomalies.openaiAnalysis,
      createdAt: anomalies.createdAt,
      // Upload fields (nested as upload object)
      upload: {
        id: csvUploads.id,
        userId: csvUploads.userId,
        filename: csvUploads.filename,
        customFilename: csvUploads.customFilename,
        objectStoragePath: csvUploads.objectStoragePath,
        fileSize: csvUploads.fileSize,
        columnCount: csvUploads.columnCount,
        rowCount: csvUploads.rowCount,
        status: csvUploads.status,
        fileMetadata: csvUploads.fileMetadata,
        timeSeriesData: csvUploads.timeSeriesData,
        uploadedAt: csvUploads.uploadedAt,
        processedAt: csvUploads.processedAt,
        firebaseStorageUrl: csvUploads.firebaseStorageUrl,
        firebaseStoragePath: csvUploads.firebaseStoragePath,
      }
    })
    .from(anomalies)
    .innerJoin(csvUploads, eq(anomalies.uploadId, csvUploads.id))
    .orderBy(desc(anomalies.createdAt));

    return result;
  }

  async deleteAnomaly(id: string): Promise<boolean> {
    const result = await db.delete(anomalies).where(eq(anomalies.id, id));
    return result.rowCount > 0;
  }

  // ===================
  // SHARED RESULTS
  // ===================

  async createSharedResult(result: InsertSharedResult): Promise<SharedResult> {
    const dbResult = await db.insert(sharedResults).values(result).returning();
    return dbResult[0];
  }

  async getSharedResult(id: string): Promise<SharedResult | undefined> {
    const result = await db.select().from(sharedResults).where(eq(sharedResults.id, id)).limit(1);
    return result[0];
  }

  async getUserSharedResults(userId: string): Promise<SharedResult[]> {
    return await db.select()
      .from(sharedResults)
      .where(eq(sharedResults.userId, userId))
      .orderBy(desc(sharedResults.createdAt));
  }

  async getSharedResultByToken(token: string): Promise<(SharedResult & { upload: CsvUpload; user: User }) | undefined> {
    const result = await db.select({
      // SharedResult fields
      id: sharedResults.id,
      csvUploadId: sharedResults.csvUploadId,
      userId: sharedResults.userId,
      shareToken: sharedResults.shareToken,
      permissions: sharedResults.permissions,
      expiresAt: sharedResults.expiresAt,
      viewCount: sharedResults.viewCount,
      accessLogs: sharedResults.accessLogs,
      title: sharedResults.title,
      description: sharedResults.description,
      createdAt: sharedResults.createdAt,
      updatedAt: sharedResults.updatedAt,
      // Upload fields (prefixed with upload_)
      upload_id: csvUploads.id,
      upload_userId: csvUploads.userId,
      upload_filename: csvUploads.filename,
      upload_customFilename: csvUploads.customFilename,
      upload_objectStoragePath: csvUploads.objectStoragePath,
      upload_fileSize: csvUploads.fileSize,
      upload_columnCount: csvUploads.columnCount,
      upload_rowCount: csvUploads.rowCount,
      upload_status: csvUploads.status,
      upload_fileMetadata: csvUploads.fileMetadata,
      upload_timeSeriesData: csvUploads.timeSeriesData,
      upload_uploadedAt: csvUploads.uploadedAt,
      upload_processedAt: csvUploads.processedAt,
      upload_firebaseStorageUrl: csvUploads.firebaseStorageUrl,
      upload_firebaseStoragePath: csvUploads.firebaseStoragePath,
      // User fields (prefixed with user_)
      user_id: users.id,
      user_email: users.email,
      user_firstName: users.firstName,
      user_lastName: users.lastName,
      user_profileImageUrl: users.profileImageUrl,
      user_role: users.role,
      user_isApproved: users.isApproved,
      user_dataRetentionUntil: users.dataRetentionUntil,
      user_marketingConsent: users.marketingConsent,
      user_analyticsConsent: users.analyticsConsent,
      user_dataProcessingBasis: users.dataProcessingBasis,
      user_lastConsentUpdate: users.lastConsentUpdate,
      user_stripeCustomerId: users.stripeCustomerId,
      user_stripeSubscriptionId: users.stripeSubscriptionId,
      user_subscriptionStatus: users.subscriptionStatus,
      user_subscriptionPlan: users.subscriptionPlan,
      user_subscriptionStartDate: users.subscriptionStartDate,
      user_subscriptionEndDate: users.subscriptionEndDate,
      user_automlCreditsRemaining: users.automlCreditsRemaining,
      user_automlCreditsTotal: users.automlCreditsTotal,
      user_monthlyUsageResetDate: users.monthlyUsageResetDate,
      user_defaultPaymentMethodId: users.defaultPaymentMethodId,
      user_isPremiumApproved: users.isPremiumApproved,
      user_premiumApprovedAt: users.premiumApprovedAt,
      user_premiumApprovedBy: users.premiumApprovedBy,
      user_premiumTier: users.premiumTier,
      user_premiumStatus: users.premiumStatus,
      user_premiumRequestedAt: users.premiumRequestedAt,
      user_premiumRequestJustification: users.premiumRequestJustification,
      user_createdAt: users.createdAt,
      user_updatedAt: users.updatedAt,
    })
    .from(sharedResults)
    .innerJoin(csvUploads, eq(sharedResults.csvUploadId, csvUploads.id))
    .innerJoin(users, eq(sharedResults.userId, users.id))
    .where(eq(sharedResults.shareToken, token))
    .limit(1);

    if (result.length === 0) {
      return undefined;
    }

    const row = result[0];
    
    // Check if expired
    if (row.expiresAt && new Date() > row.expiresAt) {
      return undefined;
    }

    // Reconstruct the objects from the flattened result
    const sharedResult: SharedResult = {
      id: row.id,
      csvUploadId: row.csvUploadId,
      userId: row.userId,
      shareToken: row.shareToken,
      permissions: row.permissions,
      expiresAt: row.expiresAt,
      viewCount: row.viewCount,
      accessLogs: row.accessLogs,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    const upload: CsvUpload = {
      id: row.upload_id,
      userId: row.upload_userId,
      filename: row.upload_filename,
      customFilename: row.upload_customFilename,
      objectStoragePath: row.upload_objectStoragePath,
      fileSize: row.upload_fileSize,
      columnCount: row.upload_columnCount,
      rowCount: row.upload_rowCount,
      status: row.upload_status,
      fileMetadata: row.upload_fileMetadata,
      timeSeriesData: row.upload_timeSeriesData,
      uploadedAt: row.upload_uploadedAt,
      processedAt: row.upload_processedAt,
      firebaseStorageUrl: row.upload_firebaseStorageUrl,
      firebaseStoragePath: row.upload_firebaseStoragePath,
    };

    const user: User = {
      id: row.user_id,
      email: row.user_email,
      firstName: row.user_firstName,
      lastName: row.user_lastName,
      profileImageUrl: row.user_profileImageUrl,
      role: row.user_role,
      isApproved: row.user_isApproved,
      dataRetentionUntil: row.user_dataRetentionUntil,
      marketingConsent: row.user_marketingConsent,
      analyticsConsent: row.user_analyticsConsent,
      dataProcessingBasis: row.user_dataProcessingBasis,
      lastConsentUpdate: row.user_lastConsentUpdate,
      stripeCustomerId: row.user_stripeCustomerId,
      stripeSubscriptionId: row.user_stripeSubscriptionId,
      subscriptionStatus: row.user_subscriptionStatus,
      subscriptionPlan: row.user_subscriptionPlan,
      subscriptionStartDate: row.user_subscriptionStartDate,
      subscriptionEndDate: row.user_subscriptionEndDate,
      automlCreditsRemaining: row.user_automlCreditsRemaining,
      automlCreditsTotal: row.user_automlCreditsTotal,
      monthlyUsageResetDate: row.user_monthlyUsageResetDate,
      defaultPaymentMethodId: row.user_defaultPaymentMethodId,
      isPremiumApproved: row.user_isPremiumApproved,
      premiumApprovedAt: row.user_premiumApprovedAt,
      premiumApprovedBy: row.user_premiumApprovedBy,
      premiumTier: row.user_premiumTier,
      premiumStatus: row.user_premiumStatus,
      premiumRequestedAt: row.user_premiumRequestedAt,
      premiumRequestJustification: row.user_premiumRequestJustification,
      createdAt: row.user_createdAt,
      updatedAt: row.user_updatedAt,
    };

    return {
      ...sharedResult,
      upload,
      user,
    };
  }

  // ===================
  // QUIZ SYSTEM
  // ===================

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const result = await db.insert(quizzes).values(quiz).returning();
    return result[0];
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const result = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    return result[0];
  }

  async getQuizQuestions(quizId: string): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(asc(questions.order));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return result[0];
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = await db.insert(questions).values(question).returning();
    return result[0];
  }

  async createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption> {
    const result = await db.insert(questionOptions).values(option).returning();
    return result[0];
  }

  async getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
    return await db.select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, questionId))
      .orderBy(asc(questionOptions.order));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const result = await db.insert(quizAttempts).values(attempt).returning();
    return result[0];
  }

  async getUserQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return await db.select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.createdAt));
  }

  async createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse> {
    const result = await db.insert(questionResponses).values(response).returning();
    return result[0];
  }

  async getQuizAttemptResponses(attemptId: string): Promise<QuestionResponse[]> {
    return await db.select()
      .from(questionResponses)
      .where(eq(questionResponses.attemptId, attemptId));
  }

  // ===================
  // CERTIFICATES
  // ===================

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const result = await db.insert(certificates).values(certificate).returning();
    return result[0];
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db.select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.createdAt));
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const result = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
    return result[0];
  }

  // ===================
  // GDPR COMPLIANCE
  // ===================

  async createUserConsent(consent: InsertUserConsent): Promise<UserConsent> {
    const result = await db.insert(userConsent).values(consent).returning();
    return result[0];
  }

  async getUserConsent(userId: string): Promise<UserConsent[]> {
    return await db.select()
      .from(userConsent)
      .where(eq(userConsent.userId, userId))
      .orderBy(desc(userConsent.createdAt));
  }

  async createAnonymousConsent(consent: InsertAnonymousConsent): Promise<AnonymousConsent> {
    const result = await db.insert(anonymousConsent).values(consent).returning();
    return result[0];
  }

  async logDataProcessing(log: InsertDataProcessingLog): Promise<DataProcessingLog> {
    const result = await db.insert(dataProcessingLog).values(log).returning();
    return result[0];
  }

  // ===================
  // AUTH AUDIT
  // ===================

  async logAuthEvent(log: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const result = await db.insert(authAuditLog).values(log).returning();
    return result[0];
  }

  async getAuthAuditLogs(userId?: string): Promise<AuthAuditLog[]> {
    if (userId) {
      return await db.select()
        .from(authAuditLog)
        .where(eq(authAuditLog.userId, userId))
        .orderBy(desc(authAuditLog.createdAt));
    }
    return await db.select()
      .from(authAuditLog)
      .orderBy(desc(authAuditLog.createdAt));
  }

  // ===================
  // USER SESSIONS
  // ===================

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const result = await db.insert(userSessions).values(session).returning();
    return result[0];
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const result = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId)).limit(1);
    return result[0];
  }

  async updateUserSession(sessionId: string, updates: Partial<InsertUserSession>): Promise<UserSession> {
    const result = await db.update(userSessions)
      .set(updates)
      .where(eq(userSessions.sessionId, sessionId))
      .returning();
    return result[0];
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
  }

  // ===================
  // MARKET DATA
  // ===================

  async createMarketDataDownload(download: InsertMarketDataDownload): Promise<MarketDataDownload> {
    const result = await db.insert(marketDataDownloads).values(download).returning();
    return result[0];
  }

  async getUserMarketDataDownloads(userId: string): Promise<MarketDataDownload[]> {
    return await db.select()
      .from(marketDataDownloads)
      .where(eq(marketDataDownloads.userId, userId))
      .orderBy(desc(marketDataDownloads.downloadedAt));
  }

  async createPopularSymbol(symbol: InsertPopularSymbol): Promise<PopularSymbol> {
    const result = await db.insert(popularSymbols).values(symbol).returning();
    return result[0];
  }

  async getPopularSymbols(): Promise<PopularSymbol[]> {
    return await db.select()
      .from(popularSymbols)
      .where(eq(popularSymbols.isActive, true))
      .orderBy(desc(popularSymbols.downloadCount));
  }

  async updatePopularSymbol(symbol: string, updates: Partial<InsertPopularSymbol>): Promise<PopularSymbol> {
    const result = await db.update(popularSymbols)
      .set(updates)
      .where(eq(popularSymbols.symbol, symbol))
      .returning();
    return result[0];
  }

  // ===================
  // ACCESS CONTROL
  // ===================

  async createAccessGrant(grant: InsertAccessGrant): Promise<AccessGrant> {
    const result = await db.insert(accessGrants).values(grant).returning();
    return result[0];
  }

  async getUserAccessGrants(userId: string): Promise<AccessGrant[]> {
    return await db.select()
      .from(accessGrants)
      .where(eq(accessGrants.userId, userId));
  }

  async getResourceAccessGrants(resourceType: ResourceType, resourceId: string): Promise<AccessGrant[]> {
    return await db.select()
      .from(accessGrants)
      .where(and(
        eq(accessGrants.resourceType, resourceType),
        eq(accessGrants.resourceId, resourceId)
      ));
  }

  async deleteAccessGrant(id: string): Promise<void> {
    await db.delete(accessGrants).where(eq(accessGrants.id, id));
  }

  // ===================
  // TEAMS
  // ===================

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const teamMemberships = await db.select()
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));

    return teamMemberships.map(tm => tm.teams);
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db.select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  }

  // ===================
  // SHARING
  // ===================

  async createShareInvite(invite: InsertShareInvite): Promise<ShareInvite> {
    const result = await db.insert(shareInvites).values(invite).returning();
    return result[0];
  }

  async getShareInvite(id: string): Promise<ShareInvite | undefined> {
    const result = await db.select().from(shareInvites).where(eq(shareInvites.id, id)).limit(1);
    return result[0];
  }

  async getUserShareInvites(userId: string): Promise<ShareInvite[]> {
    return await db.select()
      .from(shareInvites)
      .where(or(eq(shareInvites.senderId, userId), eq(shareInvites.recipientEmail, userId)))
      .orderBy(desc(shareInvites.createdAt));
  }

  async updateShareInvite(id: string, updates: Partial<InsertShareInvite>): Promise<ShareInvite> {
    const result = await db.update(shareInvites)
      .set(updates)
      .where(eq(shareInvites.id, id))
      .returning();
    return result[0];
  }

  async createShareLink(link: InsertShareLink): Promise<ShareLink> {
    const result = await db.insert(shareLinks).values(link).returning();
    return result[0];
  }

  async getShareLink(id: string): Promise<ShareLink | undefined> {
    const result = await db.select().from(shareLinks).where(eq(shareLinks.id, id)).limit(1);
    return result[0];
  }

  async getUserShareLinks(userId: string): Promise<ShareLink[]> {
    return await db.select()
      .from(shareLinks)
      .where(eq(shareLinks.ownerId, userId))
      .orderBy(desc(shareLinks.createdAt));
  }

  // ===================
  // BACKGROUND JOBS
  // ===================

  async createBackgroundJob(job: InsertBackgroundJob): Promise<BackgroundJob> {
    const result = await db.insert(backgroundJobs).values(job).returning();
    return result[0];
  }

  async getBackgroundJob(id: string): Promise<BackgroundJob | undefined> {
    const result = await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id)).limit(1);
    return result[0];
  }

  async updateBackgroundJob(id: string, updates: Partial<InsertBackgroundJob>): Promise<BackgroundJob> {
    const result = await db.update(backgroundJobs)
      .set(updates)
      .where(eq(backgroundJobs.id, id))
      .returning();
    return result[0];
  }

  async getUserBackgroundJobs(userId: string): Promise<BackgroundJob[]> {
    return await db.select()
      .from(backgroundJobs)
      .where(eq(backgroundJobs.userId, userId))
      .orderBy(desc(backgroundJobs.createdAt));
  }

  // ===================
  // PRODUCTIVITY BOARDS
  // ===================

  async createProductivityBoard(board: InsertProductivityBoard): Promise<ProductivityBoard> {
    const result = await db.insert(productivityBoards).values(board).returning();
    return result[0];
  }

  async getProductivityBoard(id: string): Promise<ProductivityBoard | undefined> {
    const result = await db.select().from(productivityBoards).where(eq(productivityBoards.id, id)).limit(1);
    return result[0];
  }

  async getUserProductivityBoards(userId: string): Promise<ProductivityBoard[]> {
    return await db.select()
      .from(productivityBoards)
      .where(eq(productivityBoards.ownerId, userId))
      .orderBy(desc(productivityBoards.createdAt));
  }

  async updateProductivityBoard(id: string, updates: Partial<InsertProductivityBoard>): Promise<ProductivityBoard> {
    const result = await db.update(productivityBoards)
      .set(updates)
      .where(eq(productivityBoards.id, id))
      .returning();
    return result[0];
  }

  async deleteProductivityBoard(id: string): Promise<void> {
    await db.delete(productivityBoards).where(eq(productivityBoards.id, id));
  }

  // ===================
  // PRODUCTIVITY ITEMS
  // ===================

  async createProductivityItem(item: InsertProductivityItem): Promise<ProductivityItem> {
    const result = await db.insert(productivityItems).values(item).returning();
    return result[0];
  }

  async getProductivityItem(id: string): Promise<ProductivityItem | undefined> {
    const result = await db.select().from(productivityItems).where(eq(productivityItems.id, id)).limit(1);
    return result[0];
  }

  async getBoardProductivityItems(boardId: string): Promise<ProductivityItem[]> {
    return await db.select()
      .from(productivityItems)
      .where(eq(productivityItems.boardId, boardId))
      .orderBy(asc(productivityItems.order));
  }

  async updateProductivityItem(id: string, updates: Partial<InsertProductivityItem>): Promise<ProductivityItem> {
    const result = await db.update(productivityItems)
      .set(updates)
      .where(eq(productivityItems.id, id))
      .returning();
    return result[0];
  }

  async deleteProductivityItem(id: string): Promise<void> {
    await db.delete(productivityItems).where(eq(productivityItems.id, id));
  }

  // ===================
  // ITEM COLUMNS & VALUES
  // ===================

  async createItemColumn(column: InsertItemColumn): Promise<ItemColumn> {
    const result = await db.insert(itemColumns).values(column).returning();
    return result[0];
  }

  async getBoardItemColumns(boardId: string): Promise<ItemColumn[]> {
    return await db.select()
      .from(itemColumns)
      .where(eq(itemColumns.boardId, boardId))
      .orderBy(asc(itemColumns.order));
  }

  async updateItemColumn(id: string, updates: Partial<InsertItemColumn>): Promise<ItemColumn> {
    const result = await db.update(itemColumns)
      .set(updates)
      .where(eq(itemColumns.id, id))
      .returning();
    return result[0];
  }

  async deleteItemColumn(id: string): Promise<void> {
    await db.delete(itemColumns).where(eq(itemColumns.id, id));
  }

  async createColumnValue(value: InsertColumnValue): Promise<ColumnValue> {
    const result = await db.insert(columnValues).values(value).returning();
    return result[0];
  }

  async getItemColumnValues(itemId: string): Promise<ColumnValue[]> {
    return await db.select()
      .from(columnValues)
      .where(eq(columnValues.itemId, itemId));
  }

  async updateColumnValue(id: string, updates: Partial<InsertColumnValue>): Promise<ColumnValue> {
    const result = await db.update(columnValues)
      .set(updates)
      .where(eq(columnValues.id, id))
      .returning();
    return result[0];
  }

  async deleteColumnValue(id: string): Promise<void> {
    await db.delete(columnValues).where(eq(columnValues.id, id));
  }

  // ===================
  // PRODUCTIVITY STATS
  // ===================

  async getUserProductivityStats(userId: string): Promise<{
    totalBoards: number;
    totalItems: number;
    completedThisWeek: number;
    overdueItems: number;
    upcomingDeadlines: number;
    mostProductiveDay: string;
    averageCompletionTime: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Get total boards count
    const totalBoardsResult = await db.select({ count: sql<number>`count(*)` })
      .from(productivityBoards)
      .where(eq(productivityBoards.ownerId, userId));
    const totalBoards = totalBoardsResult[0]?.count || 0;

    // Get all user boards to query items
    const userBoards = await db.select({ id: productivityBoards.id })
      .from(productivityBoards)
      .where(eq(productivityBoards.ownerId, userId));
    
    const boardIds = userBoards.map(board => board.id);

    if (boardIds.length === 0) {
      return {
        totalBoards: 0,
        totalItems: 0,
        completedThisWeek: 0,
        overdueItems: 0,
        upcomingDeadlines: 0,
        mostProductiveDay: 'Monday',
        averageCompletionTime: 0,
      };
    }

    // Get total items count
    const totalItemsResult = await db.select({ count: sql<number>`count(*)` })
      .from(productivityItems)
      .where(inArray(productivityItems.boardId, boardIds));
    const totalItems = totalItemsResult[0]?.count || 0;

    // Get completed items this week
    const completedThisWeekResult = await db.select({ count: sql<number>`count(*)` })
      .from(productivityItems)
      .where(
        and(
          inArray(productivityItems.boardId, boardIds),
          eq(productivityItems.status, 'done'),
          gte(productivityItems.updatedAt, oneWeekAgo)
        )
      );
    const completedThisWeek = completedThisWeekResult[0]?.count || 0;

    // Get overdue items
    const overdueItemsResult = await db.select({ count: sql<number>`count(*)` })
      .from(productivityItems)
      .where(
        and(
          inArray(productivityItems.boardId, boardIds),
          ne(productivityItems.status, 'done'),
          lt(productivityItems.dueDate, new Date())
        )
      );
    const overdueItems = overdueItemsResult[0]?.count || 0;

    // Get upcoming deadlines (next 3 days)
    const upcomingDeadlinesResult = await db.select({ count: sql<number>`count(*)` })
      .from(productivityItems)
      .where(
        and(
          inArray(productivityItems.boardId, boardIds),
          ne(productivityItems.status, 'done'),
          gte(productivityItems.dueDate, new Date()),
          lte(productivityItems.dueDate, threeDaysFromNow)
        )
      );
    const upcomingDeadlines = upcomingDeadlinesResult[0]?.count || 0;

    return {
      totalBoards,
      totalItems,
      completedThisWeek,
      overdueItems,
      upcomingDeadlines,
      mostProductiveDay: 'Monday', // Default for now
      averageCompletionTime: 2.5, // Default average in days
    };
  }

  // ===================
  // NOTIFICATIONS
  // ===================

  async createInAppNotification(notification: InsertInAppNotification): Promise<InAppNotification> {
    const result = await db.insert(inAppNotifications).values(notification).returning();
    return result[0];
  }

  async getUserNotifications(userId: string): Promise<InAppNotification[]> {
    return await db.select()
      .from(inAppNotifications)
      .where(eq(inAppNotifications.userId, userId))
      .orderBy(desc(inAppNotifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(inAppNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(inAppNotifications.id, id));
  }

  // ===================
  // ADMIN APPROVALS
  // ===================

  async createAdminApproval(approval: InsertAdminApproval): Promise<AdminApproval> {
    const result = await db.insert(adminApprovals).values(approval).returning();
    return result[0];
  }

  async getAdminApprovals(): Promise<AdminApproval[]> {
    return await db.select()
      .from(adminApprovals)
      .orderBy(desc(adminApprovals.createdAt));
  }

  async updateAdminApproval(id: string, updates: Partial<InsertAdminApproval>): Promise<AdminApproval> {
    const result = await db.update(adminApprovals)
      .set(updates)
      .where(eq(adminApprovals.id, id))
      .returning();
    return result[0];
  }

  // ===================
  // USER NOTIFICATION PREFERENCES
  // ===================

  async createUserNotificationPreferences(prefs: InsertUserNotificationPreferences): Promise<UserNotificationPreferences> {
    const result = await db.insert(userNotificationPreferences).values(prefs).returning();
    return result[0];
  }

  async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | undefined> {
    const result = await db.select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateUserNotificationPreferences(userId: string, updates: Partial<InsertUserNotificationPreferences>): Promise<UserNotificationPreferences> {
    const result = await db.update(userNotificationPreferences)
      .set(updates)
      .where(eq(userNotificationPreferences.userId, userId))
      .returning();
    return result[0];
  }
}