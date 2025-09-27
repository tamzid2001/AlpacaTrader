import { 
  type User, 
  type InsertUser,
  type UpsertUser, 
  type Course,
  type InsertCourse,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  // Video course lesson system types
  type Lesson,
  type InsertLesson,
  type CourseMaterial,
  type InsertCourseMaterial,
  type UserProgress,
  type InsertUserProgress,
  // Comprehensive Quiz System Types
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
  type QuestionType,
  type QuizAttemptStatus,
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
  // Permission Management Types
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
  // Market Data Types
  type MarketDataDownload,
  type InsertMarketDataDownload,
  type PopularSymbol,
  type InsertPopularSymbol,
  // Billing and Payment Types
  type Payment,
  type InsertPayment,
  type AutoMLJob,
  type InsertAutoMLJob,
  // Comprehensive Notification System Types
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
  type NotificationTemplateType,
  type AlertRuleType,
  type NotificationChannel,
  type NotificationQueueStatus,
  type NotificationEventType,
  type AdminApprovalStatus,
  type AdminApprovalResourceType,
  // Productivity Table System Types
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
  type BoardType,
  type ItemStatus,
  type ItemPriority,
  type ColumnType,
  type ProductivityNotificationType,
  type ReminderFrequency,
  type ActivityAction,
  type EntityType,
  // Missing notification and quiz types
  type QuizResult,
  type InsertQuizResult,
  type UserNotificationPreferences,
  type InsertUserNotificationPreferences,
  type InAppNotification,
  type InsertInAppNotification,
  type InAppNotificationType,
  type NotificationCategory,
  type NotificationPriority
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  approveUser(id: string): Promise<User | undefined>;
  
  // Stripe Integration
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeInfo: { customerId?: string; subscriptionId?: string }): Promise<User | undefined>;
  
  // Stripe & Billing
  updateUserSubscription(userId: string, subscriptionData: any): Promise<User | undefined>;
  cancelUserSubscription(userId: string): Promise<void>;
  deductAutoMLCredits(userId: string, credits: number): Promise<void>;
  recordPayment(paymentData: InsertPayment): Promise<Payment>;
  findUserByEmail(email: string): Promise<User | undefined>;
  
  // AutoML Jobs
  createAutoMLJob(jobData: InsertAutoMLJob): Promise<AutoMLJob>;
  updateAutoMLJob(jobId: string, updates: Partial<AutoMLJob>): Promise<AutoMLJob | undefined>;
  getUserAutoMLJobs(userId: string): Promise<AutoMLJob[]>;

  // Courses
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;
  getPublishedCourses(): Promise<Course[]>;
  getCoursesByCategory(category: string): Promise<Course[]>;
  searchCourses(query: string): Promise<Course[]>;

  // Lessons
  getCourseLessons(courseId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;
  updateLessonOrder(courseId: string, lessonOrders: { id: string; order: number }[]): Promise<void>;

  // Course Materials
  getLessonMaterials(lessonId: string): Promise<CourseMaterial[]>;
  getCourseMaterials(courseId: string): Promise<CourseMaterial[]>;
  getMaterial(id: string): Promise<CourseMaterial | undefined>;
  createMaterial(material: InsertCourseMaterial): Promise<CourseMaterial>;
  updateMaterial(id: string, updates: Partial<CourseMaterial>): Promise<CourseMaterial | undefined>;
  deleteMaterial(id: string): Promise<boolean>;
  incrementDownloadCount(materialId: string): Promise<void>;

  // User Progress Tracking
  getUserProgress(userId: string, courseId: string): Promise<UserProgress[]>;
  getUserLessonProgress(userId: string, lessonId: string): Promise<UserProgress | undefined>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  markLessonCompleted(userId: string, lessonId: string): Promise<void>;
  updateVideoProgress(userId: string, lessonId: string, lastWatched: number, progressPercentage: number): Promise<void>;
  getCourseProgressSummary(userId: string, courseId: string): Promise<{ completedLessons: number; totalLessons: number; overallProgress: number }>;

  // Enrollments
  getUserEnrollments(userId: string): Promise<(CourseEnrollment & { course: Course })[]>;
  getEnrollment(userId: string, courseId: string): Promise<CourseEnrollment | undefined>;
  enrollUserInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateEnrollmentProgress(userId: string, courseId: string, progress: number): Promise<void>;
  updateEnrollmentAccess(userId: string, courseId: string): Promise<void>;
  completeCourse(userId: string, courseId: string): Promise<void>;

  // ===================
  // COMPREHENSIVE QUIZ SYSTEM
  // ===================

  // Quiz Management
  getAllQuizzes(): Promise<Quiz[]>;
  getCourseQuizzes(courseId: string): Promise<(Quiz & { questionsCount: number })[]>;
  getLessonQuizzes(lessonId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizWithQuestions(id: string): Promise<(Quiz & { questions: (Question & { options: QuestionOption[] })[] }) | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;
  publishQuiz(id: string): Promise<Quiz | undefined>;
  unpublishQuiz(id: string): Promise<Quiz | undefined>;
  duplicateQuiz(id: string, title: string): Promise<Quiz>;

  // Question Management
  getQuizQuestions(quizId: string): Promise<(Question & { options: QuestionOption[] })[]>;
  getQuestion(id: string): Promise<(Question & { options: QuestionOption[] }) | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  reorderQuestions(quizId: string, questionOrders: { id: string; order: number }[]): Promise<void>;

  // Question Options Management
  getQuestionOptions(questionId: string): Promise<QuestionOption[]>;
  createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption>;
  updateQuestionOption(id: string, updates: Partial<QuestionOption>): Promise<QuestionOption | undefined>;
  deleteQuestionOption(id: string): Promise<boolean>;
  reorderQuestionOptions(questionId: string, optionOrders: { id: string; order: number }[]): Promise<void>;

  // Quiz Attempt Management
  startQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<(QuizAttempt & { quiz: Quiz; responses: QuestionResponse[] }) | undefined>;
  getUserQuizAttempts(userId: string, quizId?: string): Promise<(QuizAttempt & { quiz: Quiz })[]>;
  updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt | undefined>;
  completeQuizAttempt(id: string, endTime: Date, score: number, pointsEarned: number, passed: boolean): Promise<QuizAttempt | undefined>;
  abandonQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getActiveQuizAttempt(userId: string, quizId: string): Promise<QuizAttempt | undefined>;
  canUserAttemptQuiz(userId: string, quizId: string): Promise<{ canAttempt: boolean; reason?: string; attemptsUsed: number; maxAttempts?: number }>;

  // Question Response Management
  saveQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse>;
  updateQuestionResponse(id: string, updates: Partial<QuestionResponse>): Promise<QuestionResponse | undefined>;
  getAttemptResponses(attemptId: string): Promise<(QuestionResponse & { question: Question; selectedOption?: QuestionOption })[]>;
  getQuestionResponse(attemptId: string, questionId: string): Promise<QuestionResponse | undefined>;
  autoSaveQuizProgress(attemptId: string, responses: InsertQuestionResponse[]): Promise<void>;
  flagQuestionForReview(responseId: string, flagged: boolean): Promise<QuestionResponse | undefined>;

  // Manual Grading (for essay and short answer questions)
  getResponsesNeedingGrading(quizId?: string): Promise<(QuestionResponse & { attempt: QuizAttempt & { user: User }; question: Question })[]>;
  gradeResponse(responseId: string, grade: number, feedback: string, gradedBy: string): Promise<QuestionResponse | undefined>;
  bulkGradeResponses(grades: { responseId: string; grade: number; feedback: string }[], gradedBy: string): Promise<number>;
  updateAttemptScoreAfterGrading(attemptId: string): Promise<QuizAttempt | undefined>;

  // Certificate Management
  generateCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificate(id: string): Promise<Certificate | undefined>;
  getUserCertificates(userId: string): Promise<(Certificate & { course: Course; quiz: Quiz })[]>;
  verifyCertificate(verificationCode: string): Promise<(Certificate & { user: User; course: Course; quiz: Quiz }) | undefined>;
  downloadCertificate(id: string, userId: string): Promise<{ url: string; filename: string } | undefined>;
  invalidateCertificate(id: string, reason: string): Promise<Certificate | undefined>;
  getCourseCertificates(courseId: string): Promise<(Certificate & { user: User })[]>;
  incrementCertificateDownload(id: string): Promise<void>;
  incrementCertificateShare(id: string): Promise<void>;

  // Quiz Analytics and Reporting
  getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    averageCompletionTime: number;
    questionAnalytics: Array<{
      questionId: string;
      correctRate: number;
      averageTime: number;
      skipRate: number;
    }>;
    difficultyDistribution: Record<string, number>;
  }>;
  getCourseQuizAnalytics(courseId: string): Promise<{
    totalQuizzes: number;
    totalAttempts: number;
    averagePassRate: number;
    studentProgress: Array<{
      userId: string;
      userName: string;
      completedQuizzes: number;
      averageScore: number;
    }>;
  }>;
  getUserQuizPerformance(userId: string): Promise<{
    totalAttempts: number;
    completedQuizzes: number;
    averageScore: number;
    certificatesEarned: number;
    recentAttempts: (QuizAttempt & { quiz: Quiz; course: Course })[];
  }>;
  getSystemQuizMetrics(): Promise<{
    totalQuizzes: number;
    totalAttempts: number;
    totalCertificates: number;
    averagePassRate: number;
    popularQuizzes: (Quiz & { attemptCount: number; averageScore: number })[];
  }>;

  // Quiz Integration with Course Progress
  updateCourseProgressFromQuiz(userId: string, courseId: string, quizPassed: boolean): Promise<void>;
  getRequiredQuizzesForCourse(courseId: string): Promise<Quiz[]>;
  getUserCourseQuizProgress(userId: string, courseId: string): Promise<{
    totalQuizzes: number;
    completedQuizzes: number;
    passedQuizzes: number;
    averageScore: number;
    blockedByQuiz?: Quiz;
  }>;
  checkQuizCompletionRequirements(userId: string, lessonId: string): Promise<{ canProceed: boolean; blockedBy?: Quiz; }>;

  // Support
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  getAllSupportMessages(): Promise<SupportMessage[]>;
  updateSupportMessage(id: string, updates: Partial<SupportMessage>): Promise<SupportMessage | undefined>;

  // CSV Uploads
  createCsvUpload(upload: InsertCsvUpload, userId: string): Promise<CsvUpload>;
  getCsvUpload(id: string): Promise<CsvUpload | undefined>;
  getUserCsvUploads(userId: string): Promise<CsvUpload[]>;
  updateCsvUpload(id: string, updates: Partial<CsvUpload>): Promise<CsvUpload | undefined>;
  deleteCsvUpload(id: string): Promise<boolean>;

  // Anomalies
  createAnomaly(anomaly: InsertAnomaly): Promise<Anomaly>;
  getUploadAnomalies(uploadId: string): Promise<Anomaly[]>;
  getUserAnomalies(userId: string): Promise<(Anomaly & { upload: CsvUpload })[]>;
  getAllAnomalies(): Promise<(Anomaly & { upload: CsvUpload })[]>;
  deleteAnomaly(id: string): Promise<boolean>;

  // Shared Results
  createSharedResult(sharedResult: InsertSharedResult, userId: string): Promise<SharedResult>;
  getSharedResult(id: string): Promise<SharedResult | undefined>;
  getSharedResultByToken(token: string): Promise<(SharedResult & { upload: CsvUpload; user: User }) | undefined>;
  getUserSharedResults(userId: string): Promise<(SharedResult & { upload: CsvUpload })[]>;
  updateSharedResult(id: string, updates: Partial<SharedResult>): Promise<SharedResult | undefined>;
  deleteSharedResult(id: string): Promise<boolean>;
  incrementViewCount(id: string): Promise<void>;
  logAccess(id: string, accessInfo: { ip: string; userAgent: string; timestamp: Date }): Promise<void>;

  // GDPR Compliance - Consent Management
  createUserConsent(consent: InsertUserConsent): Promise<UserConsent>;
  getUserConsent(userId: string, consentType?: ConsentType): Promise<UserConsent[]>;
  updateUserConsent(userId: string, consentType: ConsentType, consentGiven: boolean, metadata?: { ipAddress?: string; userAgent?: string }): Promise<UserConsent>;
  withdrawConsent(userId: string, consentType: ConsentType, metadata?: { ipAddress?: string; userAgent?: string }): Promise<UserConsent>;
  getUserConsentStatus(userId: string): Promise<Record<ConsentType, boolean>>;

  // GDPR Compliance - Anonymous Consent Management (for unauthenticated users)
  createAnonymousConsent(consent: InsertAnonymousConsent): Promise<AnonymousConsent>;
  getAnonymousConsent(email: string, consentType?: ConsentType): Promise<AnonymousConsent[]>;
  updateAnonymousConsent(email: string, consentType: ConsentType, consentGiven: boolean, metadata?: { ipAddress?: string; userAgent?: string }): Promise<AnonymousConsent>;
  linkAnonymousConsentToUser(email: string, userId: string): Promise<number>; // Returns number of records linked

  // GDPR Compliance - Data Processing Audit
  logDataProcessing(log: InsertDataProcessingLog): Promise<DataProcessingLog>;
  getUserProcessingLogs(userId: string, limit?: number): Promise<DataProcessingLog[]>;
  getProcessingLogsByAction(action: ProcessingAction, limit?: number): Promise<DataProcessingLog[]>;
  getProcessingLogsByDataType(dataType: DataType, limit?: number): Promise<DataProcessingLog[]>;

  // GDPR Compliance - Data Portability (Right to Data Portability - Article 20)
  exportUserData(userId: string): Promise<{
    user: User;
    consents: UserConsent[];
    csvUploads: CsvUpload[];
    courseEnrollments: (CourseEnrollment & { course: Course })[];
    quizResults: QuizResult[];
    supportMessages: SupportMessage[];
    sharedResults: SharedResult[];
    processingLogs: DataProcessingLog[];
  }>;

  // GDPR Compliance - Right to Erasure (Right to be Forgotten - Article 17)
  deleteUserData(userId: string, options?: {
    keepAuditLogs?: boolean;
    keepAnonymizedData?: boolean;
    reason?: string;
  }): Promise<{
    deletedRecords: Record<string, number>;
    retainedRecords: Record<string, number>;
    auditLog: DataProcessingLog;
  }>;

  // GDPR Compliance - Data Retention Management
  applyRetentionPolicies(): Promise<{
    usersAffected: number;
    recordsDeleted: Record<string, number>;
    errors: string[];
  }>;
  setUserRetention(userId: string, retentionUntil: Date, reason: string): Promise<User | undefined>;

  // GDPR Compliance - Access Rights (Right of Access - Article 15)
  getUserAccessReport(userId: string): Promise<{
    personalData: any;
    processingPurposes: string[];
    dataCategories: string[];
    recipients: string[];
    retentionPeriod: string;
    rights: string[];
  }>;

  // Security - Authentication Audit Logging
  createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog>;
  getAuthAuditLogs(userId?: string, limit?: number): Promise<AuthAuditLog[]>;
  getRecentFailedAttempts(ipAddress: string, timeWindow: number): Promise<AuthAuditLog[]>;
  getSecurityMetrics(timeRange: number): Promise<{
    totalEvents: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousEvents: number;
    highRiskEvents: number;
    topRiskIPs: Array<{ ip: string; count: number; riskScore: number }>;
    recentAlerts: AuthAuditLog[];
  }>;

  // Security - Session Management
  getUserActiveSessions(userId: string): Promise<UserSession[]>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateSessionActivity(sessionId: string, data: { userId: string; ipAddress: string; userAgent?: string }): Promise<void>;
  revokeUserSession(sessionId: string, reason: string): Promise<void>;
  revokeAllUserSessions(userId: string, reason: string): Promise<number>;
  cleanupExpiredSessions(): Promise<number>;
  cleanupOldRevokedSessions(): Promise<number>;

  // ===================
  // PERMISSION MANAGEMENT
  // ===================

  // Access Control Methods
  grantAccess(resourceType: ResourceType, resourceId: string, principalType: PrincipalType, principalId: string, permissions: Permission[], grantedBy: string): Promise<AccessGrant>;
  revokeAccess(grantId: string, revokedBy: string): Promise<boolean>;
  checkPermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean>;
  getUserPermissions(userId: string, resourceType: ResourceType, resourceId: string): Promise<Permission[]>;
  getResourceCollaborators(resourceType: ResourceType, resourceId: string): Promise<Array<AccessGrant & { user?: User }>>;
  getAccessibleResources(userId: string, resourceType: ResourceType): Promise<any[]>;
  
  // Team Management
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(teamId: string): Promise<Team | undefined>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: string, userId: string): Promise<boolean>;
  getUserTeams(userId: string): Promise<Array<Team & { role: TeamRole }>>;
  getTeamMembers(teamId: string): Promise<Array<TeamMember & { user: User }>>;
  updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<boolean>;
  
  // Share Invitations
  createShareInvite(invite: InsertShareInvite): Promise<ShareInvite>;
  getShareInvite(token: string): Promise<ShareInvite | undefined>;
  acceptShareInvite(token: string, userId: string): Promise<boolean>;
  declineShareInvite(token: string): Promise<boolean>;
  getShareInvites(email: string): Promise<ShareInvite[]>;
  getUserSentInvites(userId: string): Promise<ShareInvite[]>;
  
  // Share Links
  createShareLink(link: InsertShareLink): Promise<ShareLink>;
  getShareLink(token: string): Promise<ShareLink | undefined>;
  getResourceShareLinks(resourceType: ResourceType, resourceId: string): Promise<ShareLink[]>;
  incrementShareLinkAccess(linkId: string): Promise<void>;
  updateShareLink(linkId: string, updates: Partial<ShareLink>): Promise<ShareLink | undefined>;
  deleteShareLink(linkId: string): Promise<boolean>;
  
  // Database Management and Monitoring
  getDatabaseStatistics(): Promise<{
    totalUsers: number;
    totalCsvUploads: number;
    totalStorageUsed: number;
    totalQueries: number;
    avgQueryTime: number;
    activeConnections: number;
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizeBytes: number;
    }>;
    recentActivity: Array<{
      timestamp: Date;
      action: string;
      count: number;
    }>;
  }>;
  
  getDatabasePerformanceMetrics(): Promise<{
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
    queryStats: {
      totalQueries: number;
      avgDuration: number;
      p95Duration: number;
      p99Duration: number;
    };
    connectionStats: {
      totalConnections: number;
      activeConnections: number;
      idleConnections: number;
      waitingConnections: number;
    };
    indexUsage: Array<{
      tableName: string;
      indexName: string;
      usage: number;
    }>;
  }>;
  
  // Database maintenance operations
  analyzeTablePerformance(tableName?: string): Promise<Array<{
    tableName: string;
    indexScans: number;
    seqScans: number;
    rowsRead: number;
    rowsReturned: number;
  }>>;
  
  optimizeDatabase(): Promise<{
    tablesOptimized: string[];
    indexesCreated: string[];
    performance: {
      before: number;
      after: number;
      improvement: number;
    };
  }>;
  
  // Market Data Management
  createMarketDataDownload(download: InsertMarketDataDownload): Promise<MarketDataDownload>;
  getMarketDataDownload(id: string): Promise<MarketDataDownload | undefined>;
  getUserMarketDataDownloads(userId: string): Promise<MarketDataDownload[]>;
  updateMarketDataDownload(id: string, updates: Partial<MarketDataDownload>): Promise<MarketDataDownload | undefined>;
  deleteMarketDataDownload(id: string): Promise<boolean>;
  
  // Popular Symbols Management
  upsertPopularSymbol(symbol: InsertPopularSymbol): Promise<PopularSymbol>;
  getPopularSymbol(symbol: string): Promise<PopularSymbol | undefined>;
  getPopularSymbols(limit?: number): Promise<PopularSymbol[]>;
  updatePopularSymbolStats(symbol: string, fileSize?: number): Promise<void>;

  // ===========================================
  // COMPREHENSIVE NOTIFICATION SYSTEM METHODS
  // ===========================================

  // Notification Templates
  createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate>;
  getNotificationTemplate(id: string): Promise<NotificationTemplate | undefined>;
  getNotificationTemplates(type?: NotificationTemplateType): Promise<NotificationTemplate[]>;
  updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | undefined>;
  deleteNotificationTemplate(id: string): Promise<boolean>;

  // Alert Rules Management
  createAlertRule(rule: InsertAlertRule): Promise<AlertRule>;
  getAlertRule(id: string): Promise<AlertRule | undefined>;
  getUserAlertRules(userId: string): Promise<AlertRule[]>;
  getActiveAlertRules(): Promise<AlertRule[]>;
  updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule | undefined>;
  updateAlertRuleStatus(id: string, isActive: boolean): Promise<AlertRule | undefined>;
  updateAlertRuleLastTriggered(id: string, triggeredAt: Date): Promise<AlertRule | undefined>;
  deleteAlertRule(id: string): Promise<boolean>;

  // Alert Subscriptions Management
  createAlertSubscription(subscription: InsertAlertSubscription): Promise<AlertSubscription>;
  getAlertSubscription(id: string): Promise<AlertSubscription | undefined>;
  getUserAlertSubscriptions(userId: string): Promise<AlertSubscription[]>;
  getAlertRuleSubscriptions(alertRuleId: string): Promise<AlertSubscription[]>;
  updateAlertSubscription(id: string, updates: Partial<AlertSubscription>): Promise<AlertSubscription | undefined>;
  deleteAlertSubscription(id: string): Promise<boolean>;

  // Notification Queue Management
  createNotificationQueue(notification: InsertNotificationQueue): Promise<string>;
  getNotificationQueue(id: string): Promise<NotificationQueue | undefined>;
  getPendingNotifications(limit?: number): Promise<NotificationQueue[]>;
  getScheduledNotifications(beforeDate?: Date): Promise<NotificationQueue[]>;
  getUserNotifications(userId: string, limit?: number): Promise<NotificationQueue[]>;
  updateNotificationQueueStatus(
    id: string, 
    status: NotificationQueueStatus, 
    processedAt?: Date, 
    errorMessage?: string,
    attempts?: number
  ): Promise<NotificationQueue | undefined>;
  scheduleNotificationRetry(
    id: string, 
    retryAt: Date, 
    errorMessage: string, 
    attempts: number
  ): Promise<NotificationQueue | undefined>;
  getRetryableNotifications(): Promise<NotificationQueue[]>;
  cancelNotificationsByMetadata(metadata: any): Promise<number>;

  // Notification Events (Audit Trail)
  createNotificationEvent(event: InsertNotificationEvent): Promise<NotificationEvent>;
  getNotificationEvents(notificationId: string): Promise<NotificationEvent[]>;
  getNotificationEventsByType(event: NotificationEventType, limit?: number): Promise<NotificationEvent[]>;
  getUserNotificationEvents(userId: string, limit?: number): Promise<NotificationEvent[]>;

  // Admin Approval Workflow
  createAdminApproval(approval: InsertAdminApproval): Promise<string>;
  getAdminApproval(id: string): Promise<AdminApproval | undefined>;
  getPendingAdminApprovals(): Promise<AdminApproval[]>;
  getUserAdminApprovals(userId: string): Promise<AdminApproval[]>;
  getExpiredAdminApprovals(): Promise<AdminApproval[]>;
  updateAdminApprovalStatus(
    id: string, 
    status: AdminApprovalStatus, 
    reviewerId: string | null, 
    notes?: string,
    reviewedAt?: Date
  ): Promise<AdminApproval | undefined>;
  getAdminApprovalStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    total: number;
  }>;

  // Crash Reports Management
  createCrashReport(report: InsertCrashReport): Promise<CrashReport>;
  getCrashReport(id: string): Promise<CrashReport | undefined>;
  getCrashReports(resolved?: boolean, limit?: number): Promise<CrashReport[]>;
  getUserCrashReports(userId: string): Promise<CrashReport[]>;
  updateCrashReportStatus(id: string, resolved: boolean): Promise<CrashReport | undefined>;
  deleteCrashReport(id: string): Promise<boolean>;

  // Market Data Cache Management
  upsertMarketDataCache(data: InsertMarketDataCache): Promise<MarketDataCache>;
  getMarketDataCache(id: string): Promise<MarketDataCache | undefined>;
  getMarketDataCacheByTicker(ticker: string): Promise<MarketDataCache | undefined>;
  getAllMarketDataCache(): Promise<MarketDataCache[]>;
  updateMarketDataCache(ticker: string, updates: Partial<MarketDataCache>): Promise<MarketDataCache | undefined>;
  deleteMarketDataCache(ticker: string): Promise<boolean>;
  cleanupStaleMarketData(olderThanHours: number): Promise<number>;

  // ===========================================
  // PRODUCTIVITY TABLE SYSTEM METHODS
  // ===========================================

  // Productivity Boards Management
  createProductivityBoard(board: InsertProductivityBoard): Promise<ProductivityBoard>;
  getProductivityBoard(id: string): Promise<ProductivityBoard | undefined>;
  getUserProductivityBoards(userId: string): Promise<ProductivityBoard[]>;
  updateProductivityBoard(id: string, updates: Partial<ProductivityBoard>): Promise<ProductivityBoard | undefined>;
  deleteProductivityBoard(id: string): Promise<boolean>;
  duplicateProductivityBoard(id: string, newTitle: string, userId: string): Promise<ProductivityBoard>;
  getPublicTemplateBoards(): Promise<ProductivityBoard[]>;
  getBoardsByType(userId: string, boardType: BoardType): Promise<ProductivityBoard[]>;

  // Productivity Items Management
  createProductivityItem(item: InsertProductivityItem): Promise<ProductivityItem>;
  getProductivityItem(id: string): Promise<ProductivityItem | undefined>;
  getBoardProductivityItems(boardId: string): Promise<ProductivityItem[]>;
  updateProductivityItem(id: string, updates: Partial<ProductivityItem>): Promise<ProductivityItem | undefined>;
  deleteProductivityItem(id: string): Promise<boolean>;
  bulkUpdateProductivityItems(itemIds: string[], updates: Partial<ProductivityItem>): Promise<ProductivityItem[]>;
  bulkDeleteProductivityItems(itemIds: string[]): Promise<boolean>;
  getItemsByStatus(boardId: string, status: ItemStatus): Promise<ProductivityItem[]>;
  getItemsByPriority(boardId: string, priority: ItemPriority): Promise<ProductivityItem[]>;
  getItemsByAssignee(assigneeId: string): Promise<ProductivityItem[]>;
  getOverdueItems(userId: string): Promise<ProductivityItem[]>;
  getDueSoonItems(userId: string, days: number): Promise<ProductivityItem[]>;
  moveItemToBoard(itemId: string, targetBoardId: string): Promise<ProductivityItem | undefined>;
  reorderItems(boardId: string, itemOrders: { id: string; position: number }[]): Promise<void>;
  createItemFromAnomaly(anomalyId: string, boardId: string, userId: string): Promise<ProductivityItem>;
  getItemSubtasks(parentItemId: string): Promise<ProductivityItem[]>;

  // Item Columns Management
  createItemColumn(column: InsertItemColumn): Promise<ItemColumn>;
  getItemColumn(id: string): Promise<ItemColumn | undefined>;
  getBoardColumns(boardId: string): Promise<ItemColumn[]>;
  updateItemColumn(id: string, updates: Partial<ItemColumn>): Promise<ItemColumn | undefined>;
  deleteItemColumn(id: string): Promise<boolean>;
  reorderColumns(boardId: string, columnOrders: { id: string; position: number }[]): Promise<void>;
  duplicateColumn(columnId: string, targetBoardId?: string): Promise<ItemColumn>;

  // Column Values Management
  createColumnValue(value: InsertColumnValue): Promise<ColumnValue>;
  getColumnValue(id: string): Promise<ColumnValue | undefined>;
  getItemColumnValues(itemId: string): Promise<ColumnValue[]>;
  getBoardColumnValues(boardId: string): Promise<ColumnValue[]>;
  updateColumnValue(id: string, updates: Partial<ColumnValue>): Promise<ColumnValue | undefined>;
  deleteColumnValue(id: string): Promise<boolean>;
  getColumnValueByItemAndColumn(itemId: string, columnId: string): Promise<ColumnValue | undefined>;
  bulkUpdateColumnValues(updates: { itemId: string; columnId: string; value: string; metadata?: any }[]): Promise<ColumnValue[]>;

  // Productivity Notifications Management
  createProductivityNotification(notification: InsertProductivityNotification): Promise<ProductivityNotification>;
  getProductivityNotification(id: string): Promise<ProductivityNotification | undefined>;
  getUserProductivityNotifications(userId: string, limit?: number): Promise<ProductivityNotification[]>;
  getUnreadProductivityNotifications(userId: string): Promise<ProductivityNotification[]>;
  markProductivityNotificationRead(id: string): Promise<ProductivityNotification | undefined>;
  markAllProductivityNotificationsRead(userId: string): Promise<number>;
  deleteProductivityNotification(id: string): Promise<boolean>;
  getItemNotifications(itemId: string): Promise<ProductivityNotification[]>;
  createDueDateNotification(itemId: string, userId: string): Promise<ProductivityNotification>;
  createAssignmentNotification(itemId: string, assigneeId: string, assignedBy: string): Promise<ProductivityNotification>;
  createStatusChangeNotification(itemId: string, oldStatus: ItemStatus, newStatus: ItemStatus, changedBy: string): Promise<ProductivityNotification>;

  // Productivity Reminders Management
  createProductivityReminder(reminder: InsertProductivityReminder): Promise<ProductivityReminder>;
  getProductivityReminder(id: string): Promise<ProductivityReminder | undefined>;
  getUserProductivityReminders(userId: string): Promise<ProductivityReminder[]>;
  getActiveReminders(): Promise<ProductivityReminder[]>;
  getDueReminders(): Promise<ProductivityReminder[]>;
  updateProductivityReminder(id: string, updates: Partial<ProductivityReminder>): Promise<ProductivityReminder | undefined>;
  deactivateProductivityReminder(id: string): Promise<ProductivityReminder | undefined>;
  deleteProductivityReminder(id: string): Promise<boolean>;
  updateReminderLastSent(id: string, sentAt: Date): Promise<ProductivityReminder | undefined>;
  scheduleNextReminder(id: string, nextDate: Date): Promise<ProductivityReminder | undefined>;

  // Board Templates Management
  createBoardTemplate(template: InsertBoardTemplate): Promise<BoardTemplate>;
  getBoardTemplate(id: string): Promise<BoardTemplate | undefined>;
  getBoardTemplates(category?: string): Promise<BoardTemplate[]>;
  getPublicBoardTemplates(): Promise<BoardTemplate[]>;
  getUserBoardTemplates(userId: string): Promise<BoardTemplate[]>;
  updateBoardTemplate(id: string, updates: Partial<BoardTemplate>): Promise<BoardTemplate | undefined>;
  deleteBoardTemplate(id: string): Promise<boolean>;
  incrementTemplateUsage(id: string): Promise<BoardTemplate | undefined>;
  rateBoardTemplate(id: string, rating: number): Promise<BoardTemplate | undefined>;
  createBoardFromTemplate(templateId: string, userId: string, boardTitle: string): Promise<ProductivityBoard>;

  // Board Automations Management
  createBoardAutomation(automation: InsertBoardAutomation): Promise<BoardAutomation>;
  getBoardAutomation(id: string): Promise<BoardAutomation | undefined>;
  getBoardAutomations(boardId: string): Promise<BoardAutomation[]>;
  getActiveBoardAutomations(boardId: string): Promise<BoardAutomation[]>;
  updateBoardAutomation(id: string, updates: Partial<BoardAutomation>): Promise<BoardAutomation | undefined>;
  toggleBoardAutomation(id: string, isActive: boolean): Promise<BoardAutomation | undefined>;
  deleteBoardAutomation(id: string): Promise<boolean>;
  updateAutomationLastTriggered(id: string, triggeredAt: Date): Promise<BoardAutomation | undefined>;
  incrementAutomationTriggerCount(id: string): Promise<BoardAutomation | undefined>;

  // Activity Log Management
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(id: string): Promise<ActivityLog | undefined>;
  getBoardActivityLog(boardId: string, limit?: number): Promise<ActivityLog[]>;
  getItemActivityLog(itemId: string, limit?: number): Promise<ActivityLog[]>;
  getUserActivityLog(userId: string, limit?: number): Promise<ActivityLog[]>;
  deleteOldActivityLogs(olderThanDays: number): Promise<number>;

  // Search and Analytics
  searchProductivityItems(
    userId: string, 
    query: string, 
    filters?: {
      boardId?: string;
      status?: ItemStatus[];
      priority?: ItemPriority[];
      assignedTo?: string[];
      tags?: string[];
      dueDateFrom?: Date;
      dueDateTo?: Date;
    }
  ): Promise<ProductivityItem[]>;
  
  getProductivityAnalytics(userId: string, boardId?: string): Promise<{
    totalItems: number;
    completedItems: number;
    overdue: number;
    dueSoon: number;
    byStatus: Record<ItemStatus, number>;
    byPriority: Record<ItemPriority, number>;
    avgCompletionTime: number;
    productivityTrend: Array<{ date: Date; completed: number; created: number }>;
  }>;

  getUserProductivityStats(userId: string): Promise<{
    totalBoards: number;
    totalItems: number;
    completedThisWeek: number;
    overdueItems: number;
    upcomingDeadlines: number;
    mostProductiveDay: string;
    averageCompletionTime: number;
  }>;

  // Data Integration Methods
  createItemsFromAnomalies(anomalyIds: string[], boardId: string, userId: string): Promise<ProductivityItem[]>;
  createItemsFromPatterns(patterns: any[], boardId: string, userId: string): Promise<ProductivityItem[]>;
  linkItemToData(itemId: string, sourceType: string, sourceId: string): Promise<ProductivityItem | undefined>;
  
  // Export and Import Methods
  exportBoardData(boardId: string, format: 'csv' | 'excel' | 'json'): Promise<{
    filename: string;
    data: any;
    downloadUrl?: string;
  }>;
  
  importBoardData(boardId: string, data: any, format: 'csv' | 'excel' | 'json'): Promise<{
    itemsCreated: number;
    itemsUpdated: number;
    errors: string[];
  }>;

  // ===========================================
  // USER NOTIFICATION SYSTEM
  // ===========================================

  // User Notification Preferences Management
  getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | undefined>;
  createUserNotificationPreferences(preferences: InsertUserNotificationPreferences): Promise<UserNotificationPreferences>;
  updateUserNotificationPreferences(userId: string, updates: Partial<UserNotificationPreferences>): Promise<UserNotificationPreferences | undefined>;
  getOrCreateUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences>;

  // In-App Notifications Management
  getInAppNotifications(userId: string, options?: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean;
    type?: InAppNotificationType;
    category?: NotificationCategory;
    priority?: NotificationPriority;
  }): Promise<{ notifications: InAppNotification[]; totalCount: number; unreadCount: number }>;
  
  createInAppNotification(notification: InsertInAppNotification): Promise<InAppNotification>;
  getInAppNotification(id: string): Promise<InAppNotification | undefined>;
  markInAppNotificationRead(id: string, userId: string): Promise<InAppNotification | undefined>;
  markAllInAppNotificationsRead(userId: string): Promise<number>;
  deleteInAppNotification(id: string, userId: string): Promise<boolean>;
  bulkDeleteInAppNotifications(notificationIds: string[], userId: string): Promise<number>;
  
  // Notification counts and analytics
  getUnreadNotificationCount(userId: string): Promise<number>;
  getNotificationCountsByType(userId: string): Promise<Record<InAppNotificationType, number>>;
  
  // Notification cleanup and maintenance
  deleteExpiredInAppNotifications(): Promise<number>;
  getRecentInAppNotifications(userId: string, limit?: number): Promise<InAppNotification[]>;
  
  // Notification creation helpers
  createMarketDataAlertNotification(userId: string, alertData: { title: string; message: string; ticker?: string; price?: number; actionUrl?: string }): Promise<InAppNotification>;
  createCourseUpdateNotification(userId: string, courseData: { title: string; message: string; courseId: string; actionUrl?: string }): Promise<InAppNotification>;
  createProductivityReminderNotification(userId: string, reminderData: { title: string; message: string; itemId?: string; boardId?: string; actionUrl?: string }): Promise<InAppNotification>;
  createShareInvitationNotification(userId: string, inviteData: { title: string; message: string; inviterId: string; resourceType: string; resourceId: string; actionUrl?: string }): Promise<InAppNotification>;
  createAdminNotification(userId: string, adminData: { title: string; message: string; priority?: NotificationPriority; actionUrl?: string }): Promise<InAppNotification>;
  createSystemUpdateNotification(userId: string, systemData: { title: string; message: string; version?: string; actionUrl?: string }): Promise<InAppNotification>;

  // Notification preference validation
  shouldSendEmailNotification(userId: string, notificationType: InAppNotificationType): Promise<boolean>;
  shouldSendInAppNotification(userId: string, notificationType: InAppNotificationType): Promise<boolean>;
  shouldSendPushNotification(userId: string, notificationType: InAppNotificationType): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private courses: Map<string, Course> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private courseMaterials: Map<string, CourseMaterial> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private enrollments: Map<string, CourseEnrollment> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private questions: Map<string, Question> = new Map();
  private questionOptions: Map<string, QuestionOption> = new Map();
  private quizAttempts: Map<string, QuizAttempt> = new Map();
  private questionResponses: Map<string, QuestionResponse> = new Map();
  private certificates: Map<string, Certificate> = new Map();
  private quizResults: Map<string, QuizResult> = new Map();
  private supportMessages: Map<string, SupportMessage> = new Map();
  private csvUploads: Map<string, CsvUpload> = new Map();
  private anomalies: Map<string, Anomaly> = new Map();
  private sharedResults: Map<string, SharedResult> = new Map();
  // GDPR storage
  private userConsents: Map<string, UserConsent> = new Map();
  private anonymousConsents: Map<string, AnonymousConsent> = new Map();
  private dataProcessingLogs: Map<string, DataProcessingLog> = new Map();
  // Security storage
  private authAuditLogs: Map<string, AuthAuditLog> = new Map();
  private userSessions: Map<string, UserSession> = new Map();
  // Permission management storage
  private accessGrants: Map<string, AccessGrant> = new Map();
  private teams: Map<string, Team> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private shareInvites: Map<string, ShareInvite> = new Map();
  private shareLinks: Map<string, ShareLink> = new Map();
  
  // Market Data Storage
  private marketDataDownloads: Map<string, MarketDataDownload> = new Map();
  private marketDataPopularSymbols: Map<string, PopularSymbol> = new Map();
  // User content storage
  public userNotes: Map<string, any> = new Map();
  public userAchievements: Map<string, any> = new Map();

  // Comprehensive Notification System Storage
  private notificationTemplates: Map<string, NotificationTemplate> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertSubscriptions: Map<string, AlertSubscription> = new Map();
  private notificationQueue: Map<string, NotificationQueue> = new Map();
  private notificationEvents: Map<string, NotificationEvent> = new Map();
  private adminApprovals: Map<string, AdminApproval> = new Map();
  private crashReports: Map<string, CrashReport> = new Map();
  private marketDataCache: Map<string, MarketDataCache> = new Map();
  
  // User Notification System Storage
  private userNotificationPreferences: Map<string, UserNotificationPreferences> = new Map();
  private inAppNotifications: Map<string, InAppNotification> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize sample courses
    const sampleCourses: Course[] = [
      {
        id: randomUUID(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "published",
        instructor: "Dr. Sarah Johnson",
        duration: 120,
        category: "Finance",
        tags: ["finance", "markets", "beginner"],
        prerequisites: null,
        difficulty: "beginner",
        language: "English",
        publishedAt: new Date(),
        lastUpdated: new Date(),
        enrollmentCount: 0,
        maxEnrollments: null,
        isPublic: true,
        featured: false,
        ownerId: "tamzid-admin-id"
      },
      {
        id: randomUUID(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "published",
        instructor: "Prof. Michael Chen",
        duration: 180,
        category: "Machine Learning",
        tags: ["ml", "finance", "python", "intermediate"],
        prerequisites: "Basic Python knowledge",
        difficulty: "intermediate",
        language: "English",
        publishedAt: new Date(),
        lastUpdated: new Date(),
        enrollmentCount: 0,
        maxEnrollments: null,
        isPublic: true,
        featured: true,
        ownerId: "tamzid-admin-id"
      },
      {
        id: randomUUID(),
        title: "Algorithmic Trading Strategies",
        description: "Build and deploy sophisticated trading algorithms with real-time market data.",
        level: "advanced",
        price: 299,
        rating: 47,
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240",
        videoUrl: "/api/courses/3/video",
        slidesUrl: "/api/courses/3/slides",
        documentsUrl: "/api/courses/3/documents",
        codeUrl: "/api/courses/3/code",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "published",
        instructor: "Dr. Alex Rodriguez",
        duration: 240,
        category: "Trading",
        tags: ["trading", "algorithms", "advanced"],
        prerequisites: "Financial Markets Fundamentals, Programming experience",
        difficulty: "advanced",
        language: "English",
        publishedAt: new Date(),
        lastUpdated: new Date(),
        enrollmentCount: 0,
        maxEnrollments: null,
        isPublic: true,
        featured: false,
        ownerId: "tamzid-admin-id"
      }
    ];

    sampleCourses.forEach(course => {
      this.courses.set(course.id, course);
    });

    // Initialize admin user for Replit Auth
    const adminUser: User = {
      id: "tamzid-admin-id", // Fixed admin ID for consistency
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
      lastDataExport: null,
      lastLogin: null,
      loginCount: 0,
      accountStatus: "active",
      hasAccessToSharedResources: false,
      defaultSharePermission: "view",
      autoMLCredits: 100,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionTier: null,
      defaultPaymentMethodId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id!,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "student",
        isApproved: userData.isApproved ?? true, // Auto-approve Replit Auth users
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, newUser);
      return newUser;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      role: insertUser.role ?? "student",
      isApproved: insertUser.isApproved ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => !user.isApproved);
  }

  async approveUser(id: string): Promise<User | undefined> {
    return this.updateUser(id, { isApproved: true });
  }

  // Stripe Integration
  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { customerId?: string; subscriptionId?: string }): Promise<User | undefined> {
    const updates: Partial<User> = {};
    if (stripeInfo.customerId !== undefined) {
      updates.stripeCustomerId = stripeInfo.customerId;
    }
    if (stripeInfo.subscriptionId !== undefined) {
      updates.stripeSubscriptionId = stripeInfo.subscriptionId;
    }
    return this.updateUser(userId, updates);
  }

  // Courses
  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = { 
      ...insertCourse,
      id,
      rating: insertCourse.rating ?? null,
      imageUrl: insertCourse.imageUrl ?? null,
      videoUrl: insertCourse.videoUrl ?? null,
      slidesUrl: insertCourse.slidesUrl ?? null,
      documentsUrl: insertCourse.documentsUrl ?? null,
      codeUrl: insertCourse.codeUrl ?? null,
      createdAt: new Date()
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    const updatedCourse = { ...course, ...updates };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const course = this.courses.get(id);
    if (!course) return false;

    // Remove course from storage
    this.courses.delete(id);

    // Also remove all related enrollments
    const enrollmentsToDelete = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.courseId === id);
    
    enrollmentsToDelete.forEach(enrollment => {
      this.enrollments.delete(enrollment.id);
    });

    // Remove all related quizzes
    const quizzesToDelete = Array.from(this.quizzes.values())
      .filter(quiz => quiz.courseId === id);
    
    quizzesToDelete.forEach(quiz => {
      this.quizzes.delete(quiz.id);
    });

    return true;
  }

  async getPublishedCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.publishedAt !== null);
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.category === category);
  }

  async searchCourses(query: string): Promise<Course[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.courses.values()).filter(course =>
      course.title.toLowerCase().includes(searchTerm) ||
      course.description.toLowerCase().includes(searchTerm) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchTerm))
    );
  }

  // Lessons
  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = randomUUID();
    const lesson: Lesson = {
      ...insertLesson,
      id,
      videoUrl: insertLesson.videoUrl ?? null,
      thumbnailUrl: insertLesson.thumbnailUrl ?? null,
      duration: insertLesson.duration ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;

    const updatedLesson = { ...lesson, ...updates, updatedAt: new Date() };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const lesson = this.lessons.get(id);
    if (!lesson) return false;

    // Remove lesson from storage
    this.lessons.delete(id);

    // Remove related materials
    const materialsToDelete = Array.from(this.courseMaterials.values())
      .filter(material => material.lessonId === id);
    
    materialsToDelete.forEach(material => {
      this.courseMaterials.delete(material.id);
    });

    // Remove related user progress
    const progressToDelete = Array.from(this.userProgress.values())
      .filter(progress => progress.lessonId === id);
    
    progressToDelete.forEach(progress => {
      this.userProgress.delete(progress.id);
    });

    return true;
  }

  async updateLessonOrder(courseId: string, lessonOrders: { id: string; order: number }[]): Promise<void> {
    lessonOrders.forEach(({ id, order }) => {
      const lesson = this.lessons.get(id);
      if (lesson && lesson.courseId === courseId) {
        lesson.order = order;
        lesson.updatedAt = new Date();
        this.lessons.set(id, lesson);
      }
    });
  }

  // Course Materials
  async getLessonMaterials(lessonId: string): Promise<CourseMaterial[]> {
    return Array.from(this.courseMaterials.values())
      .filter(material => material.lessonId === lessonId);
  }

  async getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
    return Array.from(this.courseMaterials.values())
      .filter(material => material.courseId === courseId);
  }

  async getMaterial(id: string): Promise<CourseMaterial | undefined> {
    return this.courseMaterials.get(id);
  }

  async createMaterial(insertMaterial: InsertCourseMaterial): Promise<CourseMaterial> {
    const id = randomUUID();
    const material: CourseMaterial = {
      ...insertMaterial,
      id,
      downloadCount: 0,
      createdAt: new Date(),
    };
    this.courseMaterials.set(id, material);
    return material;
  }

  async updateMaterial(id: string, updates: Partial<CourseMaterial>): Promise<CourseMaterial | undefined> {
    const material = this.courseMaterials.get(id);
    if (!material) return undefined;

    const updatedMaterial = { ...material, ...updates };
    this.courseMaterials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const material = this.courseMaterials.get(id);
    if (!material) return false;

    this.courseMaterials.delete(id);
    return true;
  }

  async incrementDownloadCount(materialId: string): Promise<void> {
    const material = this.courseMaterials.get(materialId);
    if (material) {
      material.downloadCount += 1;
      this.courseMaterials.set(materialId, material);
    }
  }

  // User Progress Tracking
  async getUserProgress(userId: string, courseId: string): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId && progress.courseId === courseId);
  }

  async getUserLessonProgress(userId: string, lessonId: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values())
      .find(progress => progress.userId === userId && progress.lessonId === lessonId);
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    // Check if progress already exists
    const existing = Array.from(this.userProgress.values())
      .find(p => p.userId === insertProgress.userId && p.lessonId === insertProgress.lessonId);

    if (existing) {
      // Update existing progress
      const updatedProgress = {
        ...existing,
        ...insertProgress,
        lastWatched: insertProgress.lastWatched ?? existing.lastWatched,
        progressPercentage: insertProgress.progressPercentage ?? existing.progressPercentage,
        completed: insertProgress.completed ?? existing.completed,
        updatedAt: new Date(),
      };
      this.userProgress.set(existing.id, updatedProgress);
      return updatedProgress;
    } else {
      // Create new progress record
      const id = randomUUID();
      const progress: UserProgress = {
        ...insertProgress,
        id,
        lastWatched: insertProgress.lastWatched ?? null,
        progressPercentage: insertProgress.progressPercentage ?? null,
        completed: insertProgress.completed ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userProgress.set(id, progress);
      return progress;
    }
  }

  async markLessonCompleted(userId: string, lessonId: string): Promise<void> {
    const existing = Array.from(this.userProgress.values())
      .find(p => p.userId === userId && p.lessonId === lessonId);

    if (existing) {
      existing.completed = true;
      existing.progressPercentage = 100;
      existing.updatedAt = new Date();
      this.userProgress.set(existing.id, existing);
    } else {
      // Create new completed progress
      const lesson = this.lessons.get(lessonId);
      if (lesson) {
        const id = randomUUID();
        const progress: UserProgress = {
          id,
          userId,
          lessonId,
          courseId: lesson.courseId,
          completed: true,
          progressPercentage: 100,
          lastWatched: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.userProgress.set(id, progress);
      }
    }
  }

  async updateVideoProgress(userId: string, lessonId: string, lastWatched: number, progressPercentage: number): Promise<void> {
    const existing = Array.from(this.userProgress.values())
      .find(p => p.userId === userId && p.lessonId === lessonId);

    const lesson = this.lessons.get(lessonId);
    if (!lesson) return;

    if (existing) {
      existing.lastWatched = lastWatched;
      existing.progressPercentage = progressPercentage;
      existing.completed = progressPercentage >= 95; // Consider 95%+ as completed
      existing.updatedAt = new Date();
      this.userProgress.set(existing.id, existing);
    } else {
      const id = randomUUID();
      const progress: UserProgress = {
        id,
        userId,
        lessonId,
        courseId: lesson.courseId,
        lastWatched,
        progressPercentage,
        completed: progressPercentage >= 95,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userProgress.set(id, progress);
    }
  }

  async getCourseProgressSummary(userId: string, courseId: string): Promise<{ completedLessons: number; totalLessons: number; overallProgress: number }> {
    const courseLessons = Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId);
    
    const userProgressRecords = Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId && progress.courseId === courseId);

    const completedLessons = userProgressRecords.filter(progress => progress.completed).length;
    const totalLessons = courseLessons.length;
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      completedLessons,
      totalLessons,
      overallProgress,
    };
  }

  // Enrollments
  async getUserEnrollments(userId: string): Promise<(CourseEnrollment & { course: Course })[]> {
    const enrollments = Array.from(this.enrollments.values()).filter(e => e.userId === userId);
    return enrollments.map(enrollment => {
      // Calculate real time spent from user progress records
      const userProgressRecords = Array.from(this.userProgress.values())
        .filter(progress => progress.userId === userId && progress.courseId === enrollment.courseId);
      
      // Sum up total watch time from all lessons in this course
      const totalWatchTimeSeconds = userProgressRecords.reduce((total, progress) => {
        return total + (progress.totalWatchTime || 0);
      }, 0);

      return {
        ...enrollment,
        totalTimeSpent: totalWatchTimeSeconds, // Real time spent in seconds
        course: this.courses.get(enrollment.courseId)!
      };
    }).filter(e => e.course);
  }

  async enrollUserInCourse(insertEnrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const id = randomUUID();
    const enrollment: CourseEnrollment = {
      ...insertEnrollment,
      id,
      progress: insertEnrollment.progress ?? null,
      completed: insertEnrollment.completed ?? null,
      enrolledAt: new Date(),
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async getEnrollment(userId: string, courseId: string): Promise<CourseEnrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
  }

  async updateEnrollmentProgress(userId: string, courseId: string, progress: number): Promise<void> {
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
    if (enrollment) {
      enrollment.progress = progress;
      enrollment.completed = progress >= 100;
    }
  }

  async getUserLearningStats(userId: string) {
    const enrollments = await this.getUserEnrollments(userId);
    
    // Calculate real learning hours from total watch time
    const totalWatchTimeSeconds = enrollments.reduce((total, enrollment) => {
      return total + (enrollment.totalTimeSpent || 0);
    }, 0);
    
    const totalLearningHours = totalWatchTimeSeconds / 3600; // Convert to hours
    
    // Count completed courses
    const completedCourses = enrollments.filter(e => e.completed).length;
    
    // Count active courses (enrolled but not completed)
    const activeCourses = enrollments.filter(e => !e.completed).length;
    
    // Calculate average progress across all courses
    const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;
    
    return {
      totalLearningHours: Math.round(totalLearningHours * 10) / 10, // Round to 1 decimal
      completedCourses,
      activeCourses,
      totalCourses: enrollments.length,
      averageProgress: Math.round(averageProgress),
      totalWatchTimeSeconds
    };
  }

  async markCourseComplete(userId: string, courseId: string): Promise<CourseEnrollment | null> {
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
    
    if (enrollment) {
      enrollment.completed = true;
      enrollment.progress = 100;
      enrollment.completionDate = new Date();
      this.enrollments.set(enrollment.id, enrollment);
      return enrollment;
    }
    
    return null;
  }

  async checkCourseCompletion(userId: string, courseId: string): Promise<{ 
    canComplete: boolean; 
    allLessonsComplete: boolean; 
    allRequiredQuizzesComplete: boolean;
    totalLessons: number;
    completedLessons: number;
  }> {
    // Get all lessons for this course
    const courseLessons = Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId);
    
    // Get user progress for all lessons in this course
    const userProgressRecords = Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId && progress.courseId === courseId);
    
    const completedLessons = userProgressRecords.filter(progress => progress.completed).length;
    const allLessonsComplete = completedLessons >= courseLessons.length;
    
    // Get course quizzes
    const courseQuizzes = Array.from(this.quizzes.values())
      .filter(quiz => quiz.courseId === courseId);
    
    const requiredQuizzes = courseQuizzes.filter(quiz => quiz.isRequired);
    
    // Check quiz completion through quiz attempts
    const userQuizAttempts = Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.userId === userId);
    
    const completedRequiredQuizzes = requiredQuizzes.filter(quiz => {
      return userQuizAttempts.some(attempt => 
        attempt.quizId === quiz.id && attempt.passed
      );
    });
    
    const allRequiredQuizzesComplete = completedRequiredQuizzes.length >= requiredQuizzes.length;
    
    return {
      canComplete: allLessonsComplete && allRequiredQuizzesComplete,
      allLessonsComplete,
      allRequiredQuizzesComplete,
      totalLessons: courseLessons.length,
      completedLessons
    };
  }

  // Quizzes - Updated to return with questionsCount
  async getCourseQuizzes(courseId: string): Promise<(Quiz & { questionsCount: number })[]> {
    const quizzes = Array.from(this.quizzes.values()).filter(q => q.courseId === courseId);
    return quizzes.map(quiz => ({
      ...quiz,
      questionsCount: Array.from(this.questions.values()).filter(q => q.quizId === quiz.id).length
    }));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { 
      ...insertQuiz, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: insertQuiz.isActive ?? true,
      description: insertQuiz.description ?? null,
      instructions: insertQuiz.instructions ?? null,
      timeLimit: insertQuiz.timeLimit ?? null,
      maxAttempts: insertQuiz.maxAttempts ?? null,
      availableFrom: insertQuiz.availableFrom ?? null,
      availableUntil: insertQuiz.availableUntil ?? null,
      createdBy: insertQuiz.createdBy ?? null,
      lessonId: insertQuiz.lessonId ?? null,
      passingScore: insertQuiz.passingScore ?? 70,
      shuffleQuestions: insertQuiz.shuffleQuestions ?? false,
      shuffleAnswers: insertQuiz.shuffleAnswers ?? false,
      showResults: insertQuiz.showResults ?? true,
      showCorrectAnswers: insertQuiz.showCorrectAnswers ?? true,
      allowBackNavigation: insertQuiz.allowBackNavigation ?? true,
      requireAllQuestions: insertQuiz.requireAllQuestions ?? true
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async submitQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const id = randomUUID();
    const result: QuizResult = {
      ...insertResult,
      id,
      completedAt: new Date(),
    };
    this.quizResults.set(id, result);
    return result;
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values()).filter(r => r.userId === userId);
  }

  // Missing Quiz Management Methods
  async getAllQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }

  async getQuizWithQuestions(quizId: string): Promise<(Quiz & { questions: (Question & { options: QuestionOption[] })[] }) | undefined> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) return undefined;

    const questions = Array.from(this.questions.values())
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.order - b.order)
      .map(question => ({
        ...question,
        options: Array.from(this.questionOptions.values())
          .filter(opt => opt.questionId === question.id)
          .sort((a, b) => a.order - b.order)
      }));

    return { ...quiz, questions };
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;

    const updatedQuiz = { ...quiz, ...updates, updatedAt: new Date() };
    this.quizzes.set(id, updatedQuiz);
    return updatedQuiz;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return false;

    // Delete associated questions and options
    const questions = Array.from(this.questions.values()).filter(q => q.quizId === id);
    questions.forEach(question => {
      // Delete question options
      Array.from(this.questionOptions.values())
        .filter(opt => opt.questionId === question.id)
        .forEach(opt => this.questionOptions.delete(opt.id));
      // Delete question
      this.questions.delete(question.id);
    });

    // Delete quiz attempts
    Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.quizId === id)
      .forEach(attempt => this.quizAttempts.delete(attempt.id));

    this.quizzes.delete(id);
    return true;
  }

  async publishQuiz(id: string): Promise<Quiz | undefined> {
    return this.updateQuiz(id, { isActive: true });
  }

  async unpublishQuiz(id: string): Promise<Quiz | undefined> {
    return this.updateQuiz(id, { isActive: false });
  }

  async duplicateQuiz(id: string, newTitle: string): Promise<Quiz> {
    const originalQuiz = this.quizzes.get(id);
    if (!originalQuiz) throw new Error('Quiz not found');

    const newQuizId = randomUUID();
    const duplicatedQuiz: Quiz = {
      ...originalQuiz,
      id: newQuizId,
      title: newTitle,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizzes.set(newQuizId, duplicatedQuiz);

    // Duplicate questions and options
    const questions = Array.from(this.questions.values()).filter(q => q.quizId === id);
    for (const question of questions) {
      const newQuestionId = randomUUID();
      const duplicatedQuestion: Question = {
        ...question,
        id: newQuestionId,
        quizId: newQuizId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.questions.set(newQuestionId, duplicatedQuestion);

      // Duplicate options
      const options = Array.from(this.questionOptions.values()).filter(opt => opt.questionId === question.id);
      for (const option of options) {
        const newOptionId = randomUUID();
        const duplicatedOption: QuestionOption = {
          ...option,
          id: newOptionId,
          questionId: newQuestionId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.questionOptions.set(newOptionId, duplicatedOption);
      }
    }

    return duplicatedQuiz;
  }

  // Missing Quiz Question Methods
  async getQuizQuestions(quizId: string): Promise<(Question & { options: QuestionOption[] })[]> {
    const questions = Array.from(this.questions.values())
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.order - b.order);

    return questions.map(question => ({
      ...question,
      options: Array.from(this.questionOptions.values())
        .filter(opt => opt.questionId === question.id)
        .sort((a, b) => a.order - b.order)
    }));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: insertQuestion.metadata ?? null,
      explanation: insertQuestion.explanation ?? null,
      points: insertQuestion.points ?? 1,
      required: insertQuestion.required ?? true
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;

    const updatedQuestion = { ...question, ...updates, updatedAt: new Date() };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const question = this.questions.get(id);
    if (!question) return false;

    // Delete associated options
    Array.from(this.questionOptions.values())
      .filter(opt => opt.questionId === id)
      .forEach(opt => this.questionOptions.delete(opt.id));

    this.questions.delete(id);
    return true;
  }

  async reorderQuestions(quizId: string, questionOrders: { id: string; order: number }[]): Promise<void> {
    questionOrders.forEach(({ id, order }) => {
      const question = this.questions.get(id);
      if (question && question.quizId === quizId) {
        this.questions.set(id, { ...question, order, updatedAt: new Date() });
      }
    });
  }

  // Missing Quiz Attempt Methods
  async canUserAttemptQuiz(userId: string, quizId: string): Promise<{ canAttempt: boolean; reason?: string; attemptsUsed: number; maxAttempts?: number }> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      return { canAttempt: false, reason: 'Quiz not found', attemptsUsed: 0 };
    }

    const userAttempts = Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.userId === userId && attempt.quizId === quizId);

    const attemptsUsed = userAttempts.length;
    const maxAttempts = quiz.maxAttempts;

    if (maxAttempts && attemptsUsed >= maxAttempts) {
      return {
        canAttempt: false,
        reason: 'Maximum attempts exceeded',
        attemptsUsed,
        maxAttempts
      };
    }

    // Check if there's an active attempt
    const activeAttempt = userAttempts.find(attempt => attempt.status === 'in_progress');
    if (activeAttempt) {
      return {
        canAttempt: false,
        reason: 'Active attempt in progress',
        attemptsUsed,
        maxAttempts
      };
    }

    return { canAttempt: true, attemptsUsed, maxAttempts };
  }

  async getActiveQuizAttempt(userId: string, quizId: string): Promise<QuizAttempt | undefined> {
    return Array.from(this.quizAttempts.values())
      .find(attempt => 
        attempt.userId === userId && 
        attempt.quizId === quizId && 
        attempt.status === 'in_progress'
      );
  }

  async startQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const attempt: QuizAttempt = {
      ...insertAttempt,
      id,
      status: 'in_progress',
      startTime: new Date(),
      endTime: null,
      score: null,
      pointsEarned: null,
      passed: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  async getUserQuizAttempts(userId: string, quizId?: string): Promise<(QuizAttempt & { quiz: Quiz })[]> {
    const attempts = Array.from(this.quizAttempts.values())
      .filter(attempt => {
        if (attempt.userId !== userId) return false;
        if (quizId && attempt.quizId !== quizId) return false;
        return true;
      });

    return attempts.map(attempt => ({
      ...attempt,
      quiz: this.quizzes.get(attempt.quizId)!
    })).filter(attempt => attempt.quiz);
  }

  async saveQuestionResponse(insertResponse: InsertQuestionResponse): Promise<QuestionResponse> {
    const id = randomUUID();
    const response: QuestionResponse = {
      ...insertResponse,
      id,
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null,
      flaggedForReview: false,
      timeTaken: null
    };
    this.questionResponses.set(id, response);
    return response;
  }

  async completeQuizAttempt(id: string, endTime: Date, score: number, pointsEarned: number, passed: boolean): Promise<QuizAttempt | undefined> {
    const attempt = this.quizAttempts.get(id);
    if (!attempt) return undefined;

    // Update attempt with provided values
    const updatedAttempt: QuizAttempt = {
      ...attempt,
      status: 'completed',
      endTime,
      score,
      pointsEarned,
      passed,
      updatedAt: new Date()
    };
    this.quizAttempts.set(id, updatedAttempt);

    return updatedAttempt;
  }

  async abandonQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const attempt = this.quizAttempts.get(id);
    if (!attempt) return undefined;

    const updatedAttempt: QuizAttempt = {
      ...attempt,
      status: 'abandoned',
      endTime: new Date(),
      updatedAt: new Date()
    };
    this.quizAttempts.set(id, updatedAttempt);
    return updatedAttempt;
  }

  async autoSaveQuizProgress(attemptId: string, responses: any): Promise<void> {
    // This would typically save progress to allow resuming later
    // For now, we'll just update the attempt timestamp
    const attempt = this.quizAttempts.get(attemptId);
    if (attempt) {
      this.quizAttempts.set(attemptId, { 
        ...attempt, 
        updatedAt: new Date() 
      });
    }
  }

  // Missing Certificate Methods
  async generateCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const id = randomUUID();
    const certificate: Certificate = {
      ...insertCertificate,
      id,
      verificationCode: randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase(),
      downloadCount: 0,
      shareCount: 0,
      isValid: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.certificates.set(id, certificate);
    return certificate;
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getUserCertificates(userId: string): Promise<(Certificate & { course: Course; quiz: Quiz })[]> {
    const certificates = Array.from(this.certificates.values())
      .filter(cert => cert.userId === userId);

    return certificates.map(cert => ({
      ...cert,
      course: this.courses.get(cert.courseId)!,
      quiz: this.quizzes.get(cert.quizId)!
    })).filter(cert => cert.course && cert.quiz);
  }

  async verifyCertificate(verificationCode: string): Promise<boolean> {
    const certificate = Array.from(this.certificates.values())
      .find(cert => cert.verificationCode === verificationCode);
    return certificate ? certificate.isValid : false;
  }

  // Missing Course Completion Methods  
  async markCourseComplete(userId: string, courseId: string): Promise<CourseEnrollment> {
    const enrollmentKey = `${userId}-${courseId}`;
    const enrollment = this.enrollments.get(enrollmentKey);
    if (!enrollment) throw new Error('Enrollment not found');

    const updatedEnrollment: CourseEnrollment = {
      ...enrollment,
      completed: true,
      progress: 100,
      completionDate: new Date()
    };
    this.enrollments.set(enrollmentKey, updatedEnrollment);
    return updatedEnrollment;
  }

  async checkCourseCompletion(userId: string, courseId: string): Promise<boolean> {
    const enrollmentKey = `${userId}-${courseId}`;
    const enrollment = this.enrollments.get(enrollmentKey);
    return enrollment ? enrollment.completed : false;
  }

  // Missing completeCourse method that's called in routes.ts
  async completeCourse(userId: string, courseId: string): Promise<void> {
    const enrollmentKey = `${userId}-${courseId}`;
    const enrollment = this.enrollments.get(enrollmentKey);
    if (enrollment) {
      const updatedEnrollment: CourseEnrollment = {
        ...enrollment,
        completed: true,
        progress: 100,
        completionDate: new Date(),
        lastAccessedAt: new Date()
      };
      this.enrollments.set(enrollmentKey, updatedEnrollment);
    }
  }

  // Missing Question Option Methods
  async getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
    return Array.from(this.questionOptions.values())
      .filter(opt => opt.questionId === questionId)
      .sort((a, b) => a.order - b.order);
  }

  async createQuestionOption(insertOption: InsertQuestionOption): Promise<QuestionOption> {
    const id = randomUUID();
    const option: QuestionOption = {
      ...insertOption,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.questionOptions.set(id, option);
    return option;
  }

  async updateQuestionOption(id: string, updates: Partial<QuestionOption>): Promise<QuestionOption | undefined> {
    const option = this.questionOptions.get(id);
    if (!option) return undefined;

    const updatedOption = { ...option, ...updates, updatedAt: new Date() };
    this.questionOptions.set(id, updatedOption);
    return updatedOption;
  }

  async deleteQuestionOption(id: string): Promise<boolean> {
    return this.questionOptions.delete(id);
  }

  // Missing Quiz Attempt Methods  
  async getQuizAttempt(id: string): Promise<(QuizAttempt & { quiz: Quiz; responses: QuestionResponse[] }) | undefined> {
    const attempt = this.quizAttempts.get(id);
    if (!attempt) return undefined;

    const quiz = this.quizzes.get(attempt.quizId);
    if (!quiz) return undefined;

    const responses = Array.from(this.questionResponses.values())
      .filter(r => r.attemptId === id);

    return { ...attempt, quiz, responses };
  }

  async getAttemptResponses(attemptId: string): Promise<(QuestionResponse & { question: Question; selectedOption?: QuestionOption })[]> {
    const responses = Array.from(this.questionResponses.values())
      .filter(r => r.attemptId === attemptId);

    return responses.map(response => {
      const question = this.questions.get(response.questionId)!;
      const selectedOption = response.selectedOptionId ? 
        this.questionOptions.get(response.selectedOptionId) : undefined;
      return { ...response, question, selectedOption };
    }).filter(r => r.question);
  }

  // Missing Lesson Quiz Methods
  async getLessonQuizzes(lessonId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values())
      .filter(quiz => quiz.lessonId === lessonId);
  }

  async getQuestion(id: string): Promise<(Question & { options: QuestionOption[] }) | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;

    const options = Array.from(this.questionOptions.values())
      .filter(opt => opt.questionId === id)
      .sort((a, b) => a.order - b.order);

    return { ...question, options };
  }

  // Missing Grading Methods
  async getResponsesNeedingGrading(quizId?: string): Promise<(QuestionResponse & { attempt: QuizAttempt & { user: User }; question: Question })[]> {
    const responses = Array.from(this.questionResponses.values())
      .filter(response => {
        const question = this.questions.get(response.questionId);
        if (quizId && question?.quizId !== quizId) return false;
        // Return responses that need manual grading (essays, short answers)
        return question?.type === 'essay' || question?.type === 'short_answer';
      });

    return responses.map(response => {
      const attempt = this.quizAttempts.get(response.attemptId)!;
      const user = this.users.get(attempt.userId)!;
      const question = this.questions.get(response.questionId)!;
      return { ...response, attempt: { ...attempt, user }, question };
    }).filter(r => r.attempt && r.question);
  }

  async gradeResponse(responseId: string, grade: number, feedback: string, gradedBy: string): Promise<QuestionResponse | undefined> {
    const response = this.questionResponses.get(responseId);
    if (!response) return undefined;

    const updatedResponse: QuestionResponse = {
      ...response,
      grade,
      feedback,
      gradedBy,
      gradedAt: new Date()
    };
    this.questionResponses.set(responseId, updatedResponse);
    return updatedResponse;
  }

  async bulkGradeResponses(grades: { responseId: string; grade: number; feedback: string }[], gradedBy: string): Promise<number> {
    let gradedCount = 0;
    for (const grade of grades) {
      const response = await this.gradeResponse(grade.responseId, grade.grade, grade.feedback, gradedBy);
      if (response) gradedCount++;
    }
    return gradedCount;
  }

  async updateAttemptScoreAfterGrading(attemptId: string): Promise<QuizAttempt | undefined> {
    const attempt = this.quizAttempts.get(attemptId);
    if (!attempt) return undefined;

    // Recalculate score based on all responses including graded ones
    const responses = Array.from(this.questionResponses.values())
      .filter(r => r.attemptId === attemptId);

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const response of responses) {
      const question = this.questions.get(response.questionId);
      if (question) {
        totalPoints += question.points || 0;
        if (response.isCorrect || (response.grade && response.grade > 0)) {
          earnedPoints += response.grade || question.points || 0;
        }
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const quiz = this.quizzes.get(attempt.quizId);
    const passed = quiz ? score >= quiz.passingScore : false;

    const updatedAttempt: QuizAttempt = {
      ...attempt,
      score,
      pointsEarned: earnedPoints,
      passed,
      updatedAt: new Date()
    };
    this.quizAttempts.set(attemptId, updatedAttempt);
    return updatedAttempt;
  }

  // Missing Certificate Methods  
  async downloadCertificate(id: string, userId: string): Promise<{ url: string; filename: string } | undefined> {
    const certificate = this.certificates.get(id);
    if (!certificate || certificate.userId !== userId) return undefined;

    // Increment download count
    this.certificates.set(id, { 
      ...certificate, 
      downloadCount: certificate.downloadCount + 1 
    });

    return {
      url: `/api/certificates/${id}/download`,
      filename: `certificate-${certificate.verificationCode}.pdf`
    };
  }

  async incrementCertificateDownload(id: string): Promise<void> {
    const certificate = this.certificates.get(id);
    if (certificate) {
      this.certificates.set(id, { 
        ...certificate, 
        downloadCount: certificate.downloadCount + 1 
      });
    }
  }

  // Missing Quiz Analytics Methods
  async getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    averageCompletionTime: number;
    questionAnalytics: Array<{
      questionId: string;
      correctRate: number;
      averageTime: number;
      skipRate: number;
    }>;
    difficultyDistribution: Record<string, number>;
  }> {
    const attempts = Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.quizId === quizId && attempt.status === 'completed');

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0 ? 
      attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts : 0;
    const passedAttempts = attempts.filter(attempt => attempt.passed).length;
    const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;
    
    const totalTime = attempts.reduce((sum, attempt) => {
      const duration = attempt.endTime && attempt.startTime ? 
        attempt.endTime.getTime() - attempt.startTime.getTime() : 0;
      return sum + duration;
    }, 0);
    const averageCompletionTime = totalAttempts > 0 ? totalTime / totalAttempts / 1000 : 0; // Convert to seconds

    return {
      totalAttempts,
      averageScore,
      passRate,
      averageCompletionTime,
      questionAnalytics: [],
      difficultyDistribution: {}
    };
  }

  async getCourseQuizAnalytics(courseId: string): Promise<{
    totalQuizzes: number;
    totalAttempts: number;
    averagePassRate: number;
    studentProgress: Array<{
      userId: string;
      userName: string;
      completedQuizzes: number;
      averageScore: number;
    }>;
  }> {
    const quizzes = Array.from(this.quizzes.values()).filter(q => q.courseId === courseId);
    const totalQuizzes = quizzes.length;
    
    const attempts = Array.from(this.quizAttempts.values())
      .filter(attempt => quizzes.some(q => q.id === attempt.quizId));
    
    return {
      totalQuizzes,
      totalAttempts: attempts.length,
      averagePassRate: 0,
      studentProgress: []
    };
  }

  async getUserQuizPerformance(userId: string): Promise<{
    totalAttempts: number;
    completedQuizzes: number;
    averageScore: number;
    certificatesEarned: number;
    recentAttempts: (QuizAttempt & { quiz: Quiz; course: Course })[];
  }> {
    const attempts = Array.from(this.quizAttempts.values()).filter(a => a.userId === userId);
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const averageScore = completedAttempts.length > 0 ? 
      completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length : 0;
    
    const certificates = Array.from(this.certificates.values()).filter(c => c.userId === userId);
    
    return {
      totalAttempts: attempts.length,
      completedQuizzes: completedAttempts.length,
      averageScore,
      certificatesEarned: certificates.length,
      recentAttempts: []
    };
  }

  async getSystemQuizMetrics(): Promise<{
    totalQuizzes: number;
    totalAttempts: number;
    totalCertificates: number;
    averagePassRate: number;
    popularQuizzes: (Quiz & { attemptCount: number; averageScore: number })[];
  }> {
    const totalQuizzes = this.quizzes.size;
    const totalAttempts = this.quizAttempts.size;
    const totalCertificates = this.certificates.size;
    
    return {
      totalQuizzes,
      totalAttempts,
      totalCertificates,
      averagePassRate: 0,
      popularQuizzes: []
    };
  }

  // Missing Quiz Integration Methods
  async updateCourseProgressFromQuiz(userId: string, courseId: string, quizPassed: boolean): Promise<void> {
    const enrollmentKey = `${userId}-${courseId}`;
    const enrollment = this.enrollments.get(enrollmentKey);
    if (enrollment && quizPassed) {
      // Update course progress when quiz is passed
      const updatedEnrollment = { 
        ...enrollment, 
        progress: Math.min(100, (enrollment.progress || 0) + 10),
        lastAccessedAt: new Date()
      };
      this.enrollments.set(enrollmentKey, updatedEnrollment);
    }
  }

  async getRequiredQuizzesForCourse(courseId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values())
      .filter(quiz => quiz.courseId === courseId && quiz.isRequired);
  }

  async getUserCourseQuizProgress(userId: string, courseId: string): Promise<{
    totalQuizzes: number;
    completedQuizzes: number;
    passedQuizzes: number;
    averageScore: number;
    blockedByQuiz?: Quiz;
  }> {
    const courseQuizzes = Array.from(this.quizzes.values()).filter(q => q.courseId === courseId);
    const userAttempts = Array.from(this.quizAttempts.values())
      .filter(attempt => attempt.userId === userId && courseQuizzes.some(q => q.id === attempt.quizId));
    
    const completedAttempts = userAttempts.filter(a => a.status === 'completed');
    const passedAttempts = completedAttempts.filter(a => a.passed);
    
    return {
      totalQuizzes: courseQuizzes.length,
      completedQuizzes: completedAttempts.length,
      passedQuizzes: passedAttempts.length,
      averageScore: completedAttempts.length > 0 ? 
        completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length : 0
    };
  }

  async checkQuizCompletionRequirements(userId: string, lessonId: string): Promise<{ canProceed: boolean; blockedBy?: Quiz; }> {
    const lessonQuizzes = Array.from(this.quizzes.values())
      .filter(quiz => quiz.lessonId === lessonId && quiz.isRequired);
    
    for (const quiz of lessonQuizzes) {
      const userAttempts = Array.from(this.quizAttempts.values())
        .filter(attempt => attempt.userId === userId && attempt.quizId === quiz.id && attempt.passed);
      
      if (userAttempts.length === 0) {
        return { canProceed: false, blockedBy: quiz };
      }
    }
    
    return { canProceed: true };
  }

  // Support
  async createSupportMessage(insertMessage: InsertSupportMessage): Promise<SupportMessage> {
    const id = randomUUID();
    const message: SupportMessage = {
      ...insertMessage,
      id,
      status: insertMessage.status ?? null,
      userId: insertMessage.userId ?? null,
      createdAt: new Date(),
    };
    this.supportMessages.set(id, message);
    return message;
  }

  async getAllSupportMessages(): Promise<SupportMessage[]> {
    return Array.from(this.supportMessages.values());
  }

  async updateSupportMessage(id: string, updates: Partial<SupportMessage>): Promise<SupportMessage | undefined> {
    const message = this.supportMessages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...updates };
    this.supportMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  // CSV Uploads
  async createCsvUpload(insertUpload: InsertCsvUpload, userId: string): Promise<CsvUpload> {
    const id = randomUUID();
    const upload: CsvUpload = {
      ...insertUpload,
      id,
      userId, // Add userId from authenticated session
      status: insertUpload.status ?? "uploaded",
      fileMetadata: insertUpload.fileMetadata ?? null,
      uploadedAt: new Date(),
      processedAt: null, // Set when processing completes
    };
    this.csvUploads.set(id, upload);
    return upload;
  }

  async getCsvUpload(id: string): Promise<CsvUpload | undefined> {
    return this.csvUploads.get(id);
  }

  async getUserCsvUploads(userId: string): Promise<CsvUpload[]> {
    return Array.from(this.csvUploads.values()).filter(upload => upload.userId === userId);
  }

  async updateCsvUpload(id: string, updates: Partial<CsvUpload>): Promise<CsvUpload | undefined> {
    const upload = this.csvUploads.get(id);
    if (!upload) return undefined;

    const updatedUpload = { ...upload, ...updates };
    this.csvUploads.set(id, updatedUpload);
    return updatedUpload;
  }

  // Anomalies
  async createAnomaly(insertAnomaly: InsertAnomaly): Promise<Anomaly> {
    const id = randomUUID();
    const anomaly: Anomaly = {
      ...insertAnomaly,
      id,
      weekBeforeValue: insertAnomaly.weekBeforeValue ?? null,
      p90Value: insertAnomaly.p90Value ?? null,
      openaiAnalysis: insertAnomaly.openaiAnalysis ?? null,
      createdAt: new Date(),
    };
    this.anomalies.set(id, anomaly);
    return anomaly;
  }

  async getUploadAnomalies(uploadId: string): Promise<Anomaly[]> {
    return Array.from(this.anomalies.values()).filter(anomaly => anomaly.uploadId === uploadId);
  }

  async getUserAnomalies(userId: string): Promise<(Anomaly & { upload: CsvUpload })[]> {
    const userUploads = await this.getUserCsvUploads(userId);
    const uploadIds = new Set(userUploads.map(u => u.id));
    
    return Array.from(this.anomalies.values())
      .filter(anomaly => uploadIds.has(anomaly.uploadId))
      .map(anomaly => ({
        ...anomaly,
        upload: this.csvUploads.get(anomaly.uploadId)!
      }));
  }

  async getAllAnomalies(): Promise<(Anomaly & { upload: CsvUpload })[]> {
    return Array.from(this.anomalies.values()).map(anomaly => ({
      ...anomaly,
      upload: this.csvUploads.get(anomaly.uploadId)!
    })).filter(a => a.upload);
  }

  async deleteCsvUpload(id: string): Promise<boolean> {
    return this.csvUploads.delete(id);
  }

  async deleteAnomaly(id: string): Promise<boolean> {
    return this.anomalies.delete(id);
  }

  // Shared Results
  async createSharedResult(insertSharedResult: InsertSharedResult, userId: string): Promise<SharedResult> {
    const id = randomUUID();
    
    // Generate secure share token
    const shareToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').substring(0, 16);
    
    // Calculate expiration date based on option
    let expiresAt: Date | null = null;
    if (insertSharedResult.expirationOption) {
      const now = new Date();
      switch (insertSharedResult.expirationOption) {
        case '24h':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'never':
          expiresAt = null;
          break;
      }
    }
    
    const sharedResult: SharedResult = {
      id,
      csvUploadId: insertSharedResult.csvUploadId,
      userId,
      shareToken,
      permissions: insertSharedResult.permissions || "view_only",
      expiresAt,
      viewCount: 0,
      accessLogs: [],
      title: insertSharedResult.title || null,
      description: insertSharedResult.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sharedResults.set(id, sharedResult);
    return sharedResult;
  }

  async getSharedResult(id: string): Promise<SharedResult | undefined> {
    return this.sharedResults.get(id);
  }

  async getSharedResultByToken(token: string): Promise<(SharedResult & { upload: CsvUpload; user: User }) | undefined> {
    const sharedResult = Array.from(this.sharedResults.values()).find(sr => sr.shareToken === token);
    if (!sharedResult) return undefined;
    
    // Check if expired
    if (sharedResult.expiresAt && new Date() > sharedResult.expiresAt) {
      return undefined;
    }
    
    const upload = this.csvUploads.get(sharedResult.csvUploadId);
    const user = this.users.get(sharedResult.userId);
    
    if (!upload || !user) return undefined;
    
    return {
      ...sharedResult,
      upload,
      user,
    };
  }

  async getUserSharedResults(userId: string): Promise<(SharedResult & { upload: CsvUpload })[]> {
    return Array.from(this.sharedResults.values())
      .filter(sr => sr.userId === userId)
      .map(sr => ({
        ...sr,
        upload: this.csvUploads.get(sr.csvUploadId)!
      }))
      .filter(sr => sr.upload);
  }

  async updateSharedResult(id: string, updates: Partial<SharedResult>): Promise<SharedResult | undefined> {
    const sharedResult = this.sharedResults.get(id);
    if (!sharedResult) return undefined;

    const updatedSharedResult = {
      ...sharedResult,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.sharedResults.set(id, updatedSharedResult);
    return updatedSharedResult;
  }

  async deleteSharedResult(id: string): Promise<boolean> {
    return this.sharedResults.delete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    const sharedResult = this.sharedResults.get(id);
    if (sharedResult) {
      sharedResult.viewCount += 1;
      sharedResult.updatedAt = new Date();
      this.sharedResults.set(id, sharedResult);
    }
  }

  async logAccess(id: string, accessInfo: { ip: string; userAgent: string; timestamp: Date }): Promise<void> {
    const sharedResult = this.sharedResults.get(id);
    if (sharedResult) {
      const currentLogs = Array.isArray(sharedResult.accessLogs) ? sharedResult.accessLogs : [];
      const updatedLogs = [...currentLogs, accessInfo];
      
      // Keep only the last 100 access logs to prevent unbounded growth
      if (updatedLogs.length > 100) {
        updatedLogs.splice(0, updatedLogs.length - 100);
      }
      
      sharedResult.accessLogs = updatedLogs;
      sharedResult.updatedAt = new Date();
      this.sharedResults.set(id, sharedResult);
    }
  }

  // GDPR Compliance Methods
  
  // Consent Management
  async createUserConsent(consent: InsertUserConsent): Promise<UserConsent> {
    const id = randomUUID();
    const userConsent: UserConsent = {
      ...consent,
      id,
      consentDate: consent.consentDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      withdrawnAt: consent.withdrawnAt || null,
      purpose: consent.purpose || null,
      legalBasis: consent.legalBasis || null,
      ipAddress: consent.ipAddress || null,
      userAgent: consent.userAgent || null,
    };
    this.userConsents.set(id, userConsent);
    
    // Log the consent action
    await this.logDataProcessing({
      userId: consent.userId,
      action: "create",
      dataType: "consent",
      recordId: id,
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      requestDetails: `User ${consent.consentGiven ? 'granted' : 'denied'} consent for ${consent.consentType}`,
      legalBasis: "consent",
      processingPurpose: "compliance",
    });
    
    return userConsent;
  }

  async getUserConsent(userId: string, consentType?: ConsentType): Promise<UserConsent[]> {
    const consents = Array.from(this.userConsents.values())
      .filter(consent => consent.userId === userId);
      
    if (consentType) {
      return consents.filter(consent => consent.consentType === consentType);
    }
    
    return consents;
  }

  async updateUserConsent(userId: string, consentType: ConsentType, consentGiven: boolean, metadata?: { ipAddress?: string; userAgent?: string }): Promise<UserConsent> {
    // Find existing consent or create new one
    const existingConsents = await this.getUserConsent(userId, consentType);
    const existingConsent = existingConsents.find(c => !c.withdrawnAt);
    
    if (existingConsent) {
      existingConsent.consentGiven = consentGiven;
      existingConsent.consentDate = new Date();
      existingConsent.updatedAt = new Date();
      if (metadata?.ipAddress) existingConsent.ipAddress = metadata.ipAddress;
      if (metadata?.userAgent) existingConsent.userAgent = metadata.userAgent;
      this.userConsents.set(existingConsent.id, existingConsent);
      
      await this.logDataProcessing({
        userId,
        action: "modify",
        dataType: "consent",
        recordId: existingConsent.id,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        requestDetails: `User ${consentGiven ? 'granted' : 'denied'} consent for ${consentType}`,
        legalBasis: "consent",
        processingPurpose: "compliance",
      });
      
      return existingConsent;
    } else {
      // Create new consent
      return await this.createUserConsent({
        userId,
        consentType,
        consentGiven,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
    }
  }

  async withdrawConsent(userId: string, consentType: ConsentType, metadata?: { ipAddress?: string; userAgent?: string }): Promise<UserConsent> {
    const existingConsents = await this.getUserConsent(userId, consentType);
    const activeConsent = existingConsents.find(c => !c.withdrawnAt);
    
    if (!activeConsent) {
      throw new Error(`No active consent found for user ${userId} and type ${consentType}`);
    }
    
    activeConsent.withdrawnAt = new Date();
    activeConsent.consentGiven = false;
    activeConsent.updatedAt = new Date();
    if (metadata?.ipAddress) activeConsent.ipAddress = metadata.ipAddress;
    if (metadata?.userAgent) activeConsent.userAgent = metadata.userAgent;
    
    this.userConsents.set(activeConsent.id, activeConsent);
    
    await this.logDataProcessing({
      userId,
      action: "modify",
      dataType: "consent",
      recordId: activeConsent.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      requestDetails: `User withdrew consent for ${consentType}`,
      legalBasis: "consent",
      processingPurpose: "compliance",
    });
    
    return activeConsent;
  }

  async getUserConsentStatus(userId: string): Promise<Record<ConsentType, boolean>> {
    const consents = await this.getUserConsent(userId);
    const status: Record<ConsentType, boolean> = {
      marketing: false,
      analytics: false,
      essential: true, // Essential cookies are typically required
      cookies: false,
    };
    
    // Get the latest consent for each type
    consents.forEach(consent => {
      if (!consent.withdrawnAt && consent.consentGiven) {
        status[consent.consentType as ConsentType] = true;
      }
    });
    
    return status;
  }

  // Anonymous Consent Management (for unauthenticated users)
  async createAnonymousConsent(consent: InsertAnonymousConsent): Promise<AnonymousConsent> {
    const id = randomUUID();
    const anonymousConsent: AnonymousConsent = {
      ...consent,
      id,
      consentDate: consent.consentDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      withdrawnAt: consent.withdrawnAt || null,
      purpose: consent.purpose || null,
      legalBasis: consent.legalBasis || "consent",
      processingActivity: consent.processingActivity || null,
      linkedUserId: consent.linkedUserId || null,
      ipAddress: consent.ipAddress || null,
      userAgent: consent.userAgent || null,
    };
    
    this.anonymousConsents.set(id, anonymousConsent);
    
    // Log the anonymous consent creation for audit trail
    await this.logDataProcessing({
      userId: `anonymous:${consent.email}`, // Use email as anonymous identifier
      action: "create",
      dataType: "consent",
      recordId: id,
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      requestDetails: `Anonymous user ${consent.email} ${consent.consentGiven ? 'granted' : 'denied'} consent for ${consent.consentType} (${consent.processingActivity || 'general'})`,
      legalBasis: consent.legalBasis || "consent",
      processingPurpose: "compliance",
    });
    
    return anonymousConsent;
  }

  async getAnonymousConsent(email: string, consentType?: ConsentType): Promise<AnonymousConsent[]> {
    const consents = Array.from(this.anonymousConsents.values())
      .filter(consent => consent.email === email && !consent.withdrawnAt);
      
    if (consentType) {
      return consents.filter(consent => consent.consentType === consentType);
    }
    
    return consents;
  }

  async updateAnonymousConsent(email: string, consentType: ConsentType, consentGiven: boolean, metadata?: { ipAddress?: string; userAgent?: string }): Promise<AnonymousConsent> {
    // Find existing consent or create new one
    const existingConsents = await this.getAnonymousConsent(email, consentType);
    const existingConsent = existingConsents.find(c => !c.withdrawnAt);
    
    if (existingConsent) {
      existingConsent.consentGiven = consentGiven;
      existingConsent.consentDate = new Date();
      existingConsent.updatedAt = new Date();
      if (metadata?.ipAddress) existingConsent.ipAddress = metadata.ipAddress;
      if (metadata?.userAgent) existingConsent.userAgent = metadata.userAgent;
      this.anonymousConsents.set(existingConsent.id, existingConsent);
      
      await this.logDataProcessing({
        userId: `anonymous:${email}`,
        action: "modify",
        dataType: "consent",
        recordId: existingConsent.id,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        requestDetails: `Anonymous user ${email} ${consentGiven ? 'granted' : 'denied'} consent for ${consentType}`,
        legalBasis: "consent",
        processingPurpose: "compliance",
      });
      
      return existingConsent;
    } else {
      // Create new consent
      return await this.createAnonymousConsent({
        email,
        consentType,
        consentGiven,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        legalBasis: "consent",
      });
    }
  }

  async linkAnonymousConsentToUser(email: string, userId: string): Promise<number> {
    const anonymousConsents = Array.from(this.anonymousConsents.values())
      .filter(consent => consent.email === email && !consent.linkedUserId);
    
    let linkedCount = 0;
    for (const consent of anonymousConsents) {
      consent.linkedUserId = userId;
      consent.updatedAt = new Date();
      this.anonymousConsents.set(consent.id, consent);
      linkedCount++;
      
      // Log the linking for audit trail
      await this.logDataProcessing({
        userId,
        action: "modify",
        dataType: "consent",
        recordId: consent.id,
        requestDetails: `Linked anonymous consent for ${email} to user account ${userId}`,
        legalBasis: "contract",
        processingPurpose: "service_provision",
      });
    }
    
    return linkedCount;
  }

  // Data Processing Audit
  async logDataProcessing(log: InsertDataProcessingLog): Promise<DataProcessingLog> {
    const id = randomUUID();
    const dataLog: DataProcessingLog = {
      ...log,
      id,
      timestamp: new Date(),
      ipAddress: log.ipAddress || null,
      userAgent: log.userAgent || null,
      recordId: log.recordId || null,
      requestDetails: log.requestDetails || null,
      legalBasis: log.legalBasis || null,
      processingPurpose: log.processingPurpose || null,
      dataSubjects: log.dataSubjects || null,
      retentionPeriod: log.retentionPeriod || null,
    };
    
    this.dataProcessingLogs.set(id, dataLog);
    return dataLog;
  }

  async getUserProcessingLogs(userId: string, limit = 100): Promise<DataProcessingLog[]> {
    return Array.from(this.dataProcessingLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getProcessingLogsByAction(action: ProcessingAction, limit = 100): Promise<DataProcessingLog[]> {
    return Array.from(this.dataProcessingLogs.values())
      .filter(log => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getProcessingLogsByDataType(dataType: DataType, limit = 100): Promise<DataProcessingLog[]> {
    return Array.from(this.dataProcessingLogs.values())
      .filter(log => log.dataType === dataType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Data Portability
  async exportUserData(userId: string): Promise<{
    user: User;
    consents: UserConsent[];
    csvUploads: CsvUpload[];
    courseEnrollments: (CourseEnrollment & { course: Course })[];
    quizResults: QuizResult[];
    supportMessages: SupportMessage[];
    sharedResults: SharedResult[];
    processingLogs: DataProcessingLog[];
  }> {
    await this.logDataProcessing({
      userId,
      action: "export",
      dataType: "profile",
      requestDetails: "User requested data export (GDPR Article 20)",
      legalBasis: "legitimate_interest",
      processingPurpose: "compliance",
    });
    
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    return {
      user,
      consents: await this.getUserConsent(userId),
      csvUploads: await this.getUserCsvUploads(userId),
      courseEnrollments: await this.getUserEnrollments(userId),
      quizResults: await this.getUserQuizResults(userId),
      supportMessages: Array.from(this.supportMessages.values()).filter(msg => msg.userId === userId),
      sharedResults: await this.getUserSharedResults(userId),
      processingLogs: await this.getUserProcessingLogs(userId),
    };
  }

  // Right to Erasure (Right to be Forgotten)
  async deleteUserData(userId: string, options?: {
    keepAuditLogs?: boolean;
    keepAnonymizedData?: boolean;
    reason?: string;
  }): Promise<{
    deletedRecords: Record<string, number>;
    retainedRecords: Record<string, number>;
    auditLog: DataProcessingLog;
  }> {
    const deletedRecords: Record<string, number> = {};
    const retainedRecords: Record<string, number> = {};
    
    // Delete user data from all tables
    
    // Delete CSV uploads
    const userCsvs = await this.getUserCsvUploads(userId);
    for (const csv of userCsvs) {
      await this.deleteCsvUpload(csv.id);
    }
    deletedRecords.csvUploads = userCsvs.length;
    
    // Delete shared results
    const userShares = await this.getUserSharedResults(userId);
    for (const share of userShares) {
      await this.deleteSharedResult(share.id);
    }
    deletedRecords.sharedResults = userShares.length;
    
    // Delete enrollments
    const enrollments = Array.from(this.enrollments.values()).filter(e => e.userId === userId);
    enrollments.forEach(enrollment => this.enrollments.delete(enrollment.id));
    deletedRecords.courseEnrollments = enrollments.length;
    
    // Delete quiz results
    const quizResults = Array.from(this.quizResults.values()).filter(q => q.userId === userId);
    quizResults.forEach(result => this.quizResults.delete(result.id));
    deletedRecords.quizResults = quizResults.length;
    
    // Delete support messages
    const supportMsgs = Array.from(this.supportMessages.values()).filter(msg => msg.userId === userId);
    supportMsgs.forEach(msg => this.supportMessages.delete(msg.id));
    deletedRecords.supportMessages = supportMsgs.length;
    
    // Delete anomalies (through CSV deletion cascade)
    const anomalies = Array.from(this.anomalies.values()).filter(a => {
      const upload = this.csvUploads.get(a.uploadId);
      return upload?.userId === userId;
    });
    anomalies.forEach(anomaly => this.anomalies.delete(anomaly.id));
    deletedRecords.anomalies = anomalies.length;
    
    // Delete consents
    const consents = Array.from(this.userConsents.values()).filter(c => c.userId === userId);
    if (!options?.keepAuditLogs) {
      consents.forEach(consent => this.userConsents.delete(consent.id));
      deletedRecords.userConsents = consents.length;
    } else {
      retainedRecords.userConsents = consents.length;
    }
    
    // Handle processing logs
    const processingLogs = Array.from(this.dataProcessingLogs.values()).filter(log => log.userId === userId);
    if (!options?.keepAuditLogs) {
      processingLogs.forEach(log => this.dataProcessingLogs.delete(log.id));
      deletedRecords.dataProcessingLogs = processingLogs.length;
    } else {
      retainedRecords.dataProcessingLogs = processingLogs.length;
    }
    
    // Delete user record
    const userDeleted = this.users.delete(userId);
    deletedRecords.users = userDeleted ? 1 : 0;
    
    // Create audit log for the deletion
    const auditLog = await this.logDataProcessing({
      userId,
      action: "delete",
      dataType: "profile",
      requestDetails: `User data deletion completed. Reason: ${options?.reason || 'User request'}`,
      legalBasis: "consent",
      processingPurpose: "compliance",
      dataSubjects: [{ userId, deletedRecords, retainedRecords }],
    });
    
    return {
      deletedRecords,
      retainedRecords,
      auditLog,
    };
  }

  // Data Retention Management
  async applyRetentionPolicies(): Promise<{
    usersAffected: number;
    recordsDeleted: Record<string, number>;
    errors: string[];
  }> {
    const result = {
      usersAffected: 0,
      recordsDeleted: {} as Record<string, number>,
      errors: [] as string[],
    };
    
    const now = new Date();
    const usersToDelete = Array.from(this.users.values())
      .filter(user => user.dataRetentionUntil && user.dataRetentionUntil < now);
    
    for (const user of usersToDelete) {
      try {
        const deletion = await this.deleteUserData(user.id, {
          keepAuditLogs: true,
          reason: 'Automatic retention policy cleanup',
        });
        
        Object.keys(deletion.deletedRecords).forEach(key => {
          result.recordsDeleted[key] = (result.recordsDeleted[key] || 0) + deletion.deletedRecords[key];
        });
        
        result.usersAffected++;
      } catch (error: any) {
        result.errors.push(`Failed to delete user ${user.id}: ${error.message}`);
      }
    }
    
    return result;
  }

  async setUserRetention(userId: string, retentionUntil: Date, reason: string): Promise<User | undefined> {
    const user = await this.updateUser(userId, { dataRetentionUntil: retentionUntil });
    
    if (user) {
      await this.logDataProcessing({
        userId,
        action: "modify",
        dataType: "profile",
        requestDetails: `Data retention period set until ${retentionUntil.toISOString()}. Reason: ${reason}`,
        legalBasis: "legitimate_interest",
        processingPurpose: "compliance",
      });
    }
    
    return user;
  }

  // Access Rights Report
  async getUserAccessReport(userId: string): Promise<{
    personalData: any;
    processingPurposes: string[];
    dataCategories: string[];
    recipients: string[];
    retentionPeriod: string;
    rights: string[];
  }> {
    await this.logDataProcessing({
      userId,
      action: "access",
      dataType: "profile",
      requestDetails: "User requested access report (GDPR Article 15)",
      legalBasis: "legitimate_interest",
      processingPurpose: "compliance",
    });
    
    const userData = await this.exportUserData(userId);
    
    return {
      personalData: {
        profile: userData.user,
        consents: userData.consents,
        fileUploads: userData.csvUploads.length,
        courseEnrollments: userData.courseEnrollments.length,
        quizResults: userData.quizResults.length,
        supportMessages: userData.supportMessages.length,
        sharedResults: userData.sharedResults.length,
      },
      processingPurposes: [
        "Service provision (contract)",
        "User analytics (consent)",
        "Marketing communications (consent)",
        "Legal compliance (legal obligation)",
        "Security and fraud prevention (legitimate interest)",
      ],
      dataCategories: [
        "Identity data (name, email)",
        "Profile data (preferences, settings)",
        "Usage data (course progress, file uploads)",
        "Technical data (IP address, browser info)",
        "Communication data (support messages)",
      ],
      recipients: [
        "Replit (authentication provider)",
        "Firebase/Google (file storage)",
        "OpenAI (AI support chat)",
        "Neon Database (data storage)",
      ],
      retentionPeriod: userData.user.dataRetentionUntil 
        ? `Until ${userData.user.dataRetentionUntil.toISOString()}`
        : "Indefinite (until account deletion)",
      rights: [
        "Right to access your data",
        "Right to rectify inaccurate data",
        "Right to erase your data",
        "Right to restrict processing",
        "Right to data portability",
        "Right to object to processing",
        "Right to withdraw consent",
      ],
    };
  }

  // Security - Authentication Audit Logging
  async createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const id = randomUUID();
    const auditLog: AuthAuditLog = {
      id,
      ...log,
      timestamp: new Date(),
      metadata: log.metadata || null,
    };
    
    this.authAuditLogs.set(id, auditLog);
    return auditLog;
  }

  async getAuthAuditLogs(userId?: string, limit: number = 100): Promise<AuthAuditLog[]> {
    const logs = Array.from(this.authAuditLogs.values());
    
    const filteredLogs = userId 
      ? logs.filter(log => log.userId === userId)
      : logs;
    
    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getRecentFailedAttempts(ipAddress: string, timeWindow: number): Promise<AuthAuditLog[]> {
    const cutoff = new Date(Date.now() - timeWindow);
    
    return Array.from(this.authAuditLogs.values())
      .filter(log => 
        log.ipAddress === ipAddress && 
        !log.success && 
        log.timestamp > cutoff
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getSecurityMetrics(timeRange: number): Promise<{
    totalEvents: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousEvents: number;
    highRiskEvents: number;
    topRiskIPs: Array<{ ip: string; count: number; riskScore: number }>;
    recentAlerts: AuthAuditLog[];
  }> {
    const cutoff = new Date(Date.now() - timeRange);
    const recentLogs = Array.from(this.authAuditLogs.values())
      .filter(log => log.timestamp > cutoff);
    
    const failedLogins = recentLogs.filter(log => !log.success && log.action === 'failed_login');
    const successfulLogins = recentLogs.filter(log => log.success && log.action === 'login');
    const suspiciousEvents = recentLogs.filter(log => log.riskScore && log.riskScore >= 5);
    const highRiskEvents = recentLogs.filter(log => log.riskScore && log.riskScore >= 8);
    
    // Group by IP and calculate risk scores
    const ipMap = new Map<string, { count: number; totalRisk: number }>();
    failedLogins.forEach(log => {
      const existing = ipMap.get(log.ipAddress) || { count: 0, totalRisk: 0 };
      ipMap.set(log.ipAddress, {
        count: existing.count + 1,
        totalRisk: existing.totalRisk + (log.riskScore || 0)
      });
    });
    
    const topRiskIPs = Array.from(ipMap.entries())
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        riskScore: Math.round(data.totalRisk / data.count)
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);
    
    return {
      totalEvents: recentLogs.length,
      failedLogins: failedLogins.length,
      successfulLogins: successfulLogins.length,
      suspiciousEvents: suspiciousEvents.length,
      highRiskEvents: highRiskEvents.length,
      topRiskIPs,
      recentAlerts: highRiskEvents.slice(0, 20)
    };
  }

  // Security - Session Management
  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    const now = new Date();
    return Array.from(this.userSessions.values())
      .filter(session => 
        session.userId === userId && 
        session.isActive && 
        session.expiresAt > now &&
        !session.revokedAt
      )
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const id = randomUUID();
    const now = new Date();
    const userSession: UserSession = {
      id,
      ...session,
      isActive: true,
      createdAt: now,
      lastActivity: now,
      revokedAt: null,
      revokedReason: null,
    };
    
    this.userSessions.set(id, userSession);
    return userSession;
  }

  async updateSessionActivity(sessionId: string, data: { userId: string; ipAddress: string; userAgent?: string }): Promise<void> {
    // Find session by sessionId (sid)
    const session = Array.from(this.userSessions.values()).find(s => s.sid === sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.userId = data.userId;
      session.ipAddress = data.ipAddress;
      if (data.userAgent) {
        session.userAgent = data.userAgent;
      }
      this.userSessions.set(session.id, session);
    }
  }

  async revokeUserSession(sessionId: string, reason: string): Promise<void> {
    const session = Array.from(this.userSessions.values()).find(s => s.sid === sessionId);
    if (session) {
      session.isActive = false;
      session.revokedAt = new Date();
      session.revokedReason = reason;
      this.userSessions.set(session.id, session);
    }
  }

  async revokeAllUserSessions(userId: string, reason: string): Promise<number> {
    const userSessions = Array.from(this.userSessions.values())
      .filter(session => session.userId === userId && session.isActive);
    
    userSessions.forEach(session => {
      session.isActive = false;
      session.revokedAt = new Date();
      session.revokedReason = reason;
      this.userSessions.set(session.id, session);
    });
    
    return userSessions.length;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const expiredSessions = Array.from(this.userSessions.values())
      .filter(session => session.expiresAt < now && session.isActive);
    
    expiredSessions.forEach(session => {
      session.isActive = false;
      session.revokedAt = now;
      session.revokedReason = 'expired';
      this.userSessions.set(session.id, session);
    });
    
    return expiredSessions.length;
  }

  async cleanupOldRevokedSessions(): Promise<number> {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldRevokedSessions = Array.from(this.userSessions.values())
      .filter(session => 
        session.revokedAt && 
        session.revokedAt < dayAgo
      );
    
    oldRevokedSessions.forEach(session => {
      this.userSessions.delete(session.id);
    });
    
    return oldRevokedSessions.length;
  }

  // ==================
  // USER CONTENT STORAGE METHODS
  // ==================

  async getUserProfile(userId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      preferences: user.preferences || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateUserProfile(userId: string, profileData: {
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    preferences?: any;
  }): Promise<any> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      ...profileData,
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUserStorageQuota(userId: string): Promise<any> {
    // For memory storage, return default quota
    return {
      userId,
      totalQuotaBytes: 1024 * 1024 * 1024, // 1GB default
      usedBytes: 0,
      fileCount: 0,
      lastUpdated: new Date()
    };
  }

  async updateUserStorageQuota(userId: string, updates: {
    usedBytes?: number;
    fileCount?: number;
  }): Promise<any> {
    // For memory storage, return updated quota
    return {
      userId,
      totalQuotaBytes: 1024 * 1024 * 1024,
      usedBytes: updates.usedBytes || 0,
      fileCount: updates.fileCount || 0,
      lastUpdated: new Date()
    };
  }

  async getUserLearningProgress(userId: string): Promise<any[]> {
    const userEnrollments = Array.from(this.userEnrollments.values())
      .filter(enrollment => enrollment.userId === userId);
    
    return userEnrollments.map(enrollment => ({
      courseId: enrollment.courseId,
      progress: enrollment.progress,
      completedAt: enrollment.completedAt,
      enrolledAt: enrollment.enrolledAt
    }));
  }

  async updateUserLearningProgress(userId: string, courseId: string, progress: number): Promise<any> {
    const enrollment = Array.from(this.userEnrollments.values())
      .find(e => e.userId === userId && e.courseId === courseId);
    
    if (enrollment) {
      enrollment.progress = progress;
      if (progress >= 100) {
        enrollment.completedAt = new Date();
      }
      this.userEnrollments.set(enrollment.id, enrollment);
      return enrollment;
    }
    
    throw new Error("Enrollment not found");
  }

  async createUserNote(userId: string, noteData: {
    courseId?: string;
    title: string;
    content: string;
    tags?: string[];
  }): Promise<any> {
    const id = randomUUID();
    const note = {
      id,
      userId,
      courseId: noteData.courseId || null,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in a notes map (would need to add this to class properties)
    if (!this.userNotes) {
      this.userNotes = new Map();
    }
    this.userNotes.set(id, note);
    return note;
  }

  async getUserNotes(userId: string, courseId?: string): Promise<any[]> {
    if (!this.userNotes) return [];
    
    return Array.from(this.userNotes.values())
      .filter(note => {
        if (note.userId !== userId) return false;
        if (courseId && note.courseId !== courseId) return false;
        return true;
      });
  }

  async updateUserNote(noteId: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
  }): Promise<any> {
    if (!this.userNotes) throw new Error("Note not found");
    
    const note = this.userNotes.get(noteId);
    if (!note) throw new Error("Note not found");
    
    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: new Date()
    };
    
    this.userNotes.set(noteId, updatedNote);
    return updatedNote;
  }

  async deleteUserNote(noteId: string): Promise<boolean> {
    if (!this.userNotes) return false;
    return this.userNotes.delete(noteId);
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    // Placeholder for user achievements
    return [];
  }

  async addUserAchievement(userId: string, achievementData: {
    type: string;
    title: string;
    description: string;
    earnedAt?: Date;
  }): Promise<any> {
    const id = randomUUID();
    const achievement = {
      id,
      userId,
      type: achievementData.type,
      title: achievementData.title,
      description: achievementData.description,
      earnedAt: achievementData.earnedAt || new Date()
    };
    
    if (!this.userAchievements) {
      this.userAchievements = new Map();
    }
    this.userAchievements.set(id, achievement);
    return achievement;
  }

  async createUserBackup(userId: string): Promise<any> {
    const user = await this.getUserProfile(userId);
    const enrollments = await this.getUserLearningProgress(userId);
    const notes = await this.getUserNotes(userId);
    const achievements = await this.getUserAchievements(userId);
    const csvUploads = await this.getUserCsvUploads(userId);
    
    const backup = {
      userId,
      timestamp: new Date(),
      data: {
        profile: user,
        enrollments,
        notes,
        achievements,
        csvUploads: csvUploads.map(upload => ({
          ...upload,
          timeSeriesData: null // Exclude large data from backup
        }))
      }
    };
    
    return backup;
  }

  async getUserExportData(userId: string): Promise<any> {
    // GDPR-compliant user data export
    const user = await this.getUserProfile(userId);
    const enrollments = await this.getUserLearningProgress(userId);
    const notes = await this.getUserNotes(userId);
    const achievements = await this.getUserAchievements(userId);
    const csvUploads = await this.getUserCsvUploads(userId);
    const quizResults = await this.getUserQuizResults(userId);
    const anomalies = await this.getUserAnomalies(userId);
    
    return {
      exportDate: new Date(),
      userId,
      personalData: {
        profile: user,
        learningData: {
          enrollments,
          quizResults,
          achievements,
          notes
        },
        uploadedFiles: csvUploads.map(upload => ({
          id: upload.id,
          filename: upload.filename,
          customFilename: upload.customFilename,
          uploadedAt: upload.uploadedAt,
          fileSize: upload.fileSize,
          status: upload.status
        })),
        analysisResults: anomalies.map(anomaly => ({
          id: anomaly.id,
          uploadId: anomaly.uploadId,
          type: anomaly.anomalyType,
          description: anomaly.description,
          detectedAt: anomaly.createdAt
        }))
      }
    };
  }

  async deleteAllUserData(userId: string): Promise<{
    deletedFiles: number;
    deletedData: string[];
  }> {
    // GDPR-compliant user data deletion
    const deletedData: string[] = [];
    let deletedFiles = 0;
    
    // Delete user's CSV uploads
    const uploads = await this.getUserCsvUploads(userId);
    for (const upload of uploads) {
      await this.deleteCsvUpload(upload.id);
      deletedFiles++;
    }
    deletedData.push('CSV uploads');
    
    // Delete user's anomalies
    const anomalies = await this.getUserAnomalies(userId);
    for (const anomaly of anomalies) {
      await this.deleteAnomaly(anomaly.id);
    }
    deletedData.push('Analysis results');
    
    // Delete user's notes
    if (this.userNotes) {
      const notes = await this.getUserNotes(userId);
      for (const note of notes) {
        this.userNotes.delete(note.id);
      }
      deletedData.push('User notes');
    }
    
    // Delete user's achievements
    if (this.userAchievements) {
      const achievements = Array.from(this.userAchievements.values())
        .filter(a => a.userId === userId);
      for (const achievement of achievements) {
        this.userAchievements.delete(achievement.id);
      }
      deletedData.push('Achievements');
    }
    
    // Delete enrollments
    const enrollments = Array.from(this.userEnrollments.values())
      .filter(e => e.userId === userId);
    for (const enrollment of enrollments) {
      this.userEnrollments.delete(enrollment.id);
    }
    deletedData.push('Course enrollments');
    
    // Delete quiz results
    const quizResults = await this.getUserQuizResults(userId);
    for (const result of quizResults) {
      this.quizResults.delete(result.id);
    }
    deletedData.push('Quiz results');
    
    // Delete sessions
    const sessions = Array.from(this.userSessions.values())
      .filter(s => s.userId === userId);
    for (const session of sessions) {
      this.userSessions.delete(session.id);
    }
    deletedData.push('User sessions');
    
    return { deletedFiles, deletedData };
  }

  // ===================
  // PERMISSION MANAGEMENT IMPLEMENTATION
  // ===================

  // Access Control Methods
  async grantAccess(resourceType: ResourceType, resourceId: string, principalType: PrincipalType, principalId: string, permissions: Permission[], grantedBy: string): Promise<AccessGrant> {
    const grant: AccessGrant = {
      id: randomUUID(),
      resourceType,
      resourceId,
      principalType,
      principalId,
      permissions,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: null,
      isActive: true,
    };
    this.accessGrants.set(grant.id, grant);
    return grant;
  }

  async revokeAccess(grantId: string, revokedBy: string): Promise<boolean> {
    const grant = this.accessGrants.get(grantId);
    if (!grant) return false;
    
    // Mark as inactive instead of deleting for audit trail
    grant.isActive = false;
    this.accessGrants.set(grantId, grant);
    return true;
  }

  async checkPermission(userId: string, resourceType: ResourceType, resourceId: string, permission: Permission): Promise<boolean> {
    // Check if user has direct access grant
    const userGrants = Array.from(this.accessGrants.values()).filter(grant => 
      grant.isActive &&
      grant.resourceType === resourceType &&
      grant.resourceId === resourceId &&
      grant.principalType === 'user' &&
      grant.principalId === userId &&
      grant.permissions.includes(permission) &&
      (!grant.expiresAt || grant.expiresAt > new Date())
    );

    if (userGrants.length > 0) return true;

    // Check if user is in a team that has access
    const userTeams = await this.getUserTeams(userId);
    for (const team of userTeams) {
      const teamGrants = Array.from(this.accessGrants.values()).filter(grant =>
        grant.isActive &&
        grant.resourceType === resourceType &&
        grant.resourceId === resourceId &&
        grant.principalType === 'group' &&
        grant.principalId === team.id &&
        grant.permissions.includes(permission) &&
        (!grant.expiresAt || grant.expiresAt > new Date())
      );
      if (teamGrants.length > 0) return true;
    }

    return false;
  }

  async getUserPermissions(userId: string, resourceType: ResourceType, resourceId: string): Promise<Permission[]> {
    const permissions = new Set<Permission>();

    // Direct user permissions
    const userGrants = Array.from(this.accessGrants.values()).filter(grant =>
      grant.isActive &&
      grant.resourceType === resourceType &&
      grant.resourceId === resourceId &&
      grant.principalType === 'user' &&
      grant.principalId === userId &&
      (!grant.expiresAt || grant.expiresAt > new Date())
    );

    userGrants.forEach(grant => {
      grant.permissions.forEach(permission => permissions.add(permission));
    });

    // Team-based permissions
    const userTeams = await this.getUserTeams(userId);
    for (const team of userTeams) {
      const teamGrants = Array.from(this.accessGrants.values()).filter(grant =>
        grant.isActive &&
        grant.resourceType === resourceType &&
        grant.resourceId === resourceId &&
        grant.principalType === 'group' &&
        grant.principalId === team.id &&
        (!grant.expiresAt || grant.expiresAt > new Date())
      );
      teamGrants.forEach(grant => {
        grant.permissions.forEach(permission => permissions.add(permission));
      });
    }

    return Array.from(permissions);
  }

  async getResourceCollaborators(resourceType: ResourceType, resourceId: string): Promise<Array<AccessGrant & { user?: User }>> {
    const grants = Array.from(this.accessGrants.values()).filter(grant =>
      grant.isActive &&
      grant.resourceType === resourceType &&
      grant.resourceId === resourceId &&
      (!grant.expiresAt || grant.expiresAt > new Date())
    );

    const collaborators = [];
    for (const grant of grants) {
      if (grant.principalType === 'user') {
        const user = this.users.get(grant.principalId);
        collaborators.push({ ...grant, user });
      } else {
        collaborators.push(grant);
      }
    }

    return collaborators;
  }

  async getAccessibleResources(userId: string, resourceType: ResourceType): Promise<any[]> {
    const allResources = [];
    
    // Get resources based on resource type
    let resourceMap;
    switch (resourceType) {
      case 'csv':
        resourceMap = this.csvUploads;
        break;
      case 'course':
        resourceMap = this.courses;
        break;
      default:
        return [];
    }

    // Check each resource for access
    for (const [resourceId, resource] of resourceMap) {
      const hasAccess = await this.checkPermission(userId, resourceType, resourceId, 'view');
      if (hasAccess) {
        allResources.push(resource);
      }
    }

    return allResources;
  }

  // Team Management
  async createTeam(team: InsertTeam): Promise<Team> {
    const newTeam: Team = {
      id: randomUUID(),
      name: team.name,
      description: team.description || null,
      ownerId: team.ownerId || null,
      createdAt: new Date(),
      isActive: true,
    };
    this.teams.set(newTeam.id, newTeam);

    // Add creator as owner member
    if (team.ownerId) {
      await this.addTeamMember({
        teamId: newTeam.id,
        userId: team.ownerId,
        role: 'owner',
      });
    }

    return newTeam;
  }

  async getTeam(teamId: string): Promise<Team | undefined> {
    return this.teams.get(teamId);
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const newMember: TeamMember = {
      id: randomUUID(),
      teamId: member.teamId || '',
      userId: member.userId || '',
      role: member.role || 'member',
      joinedAt: new Date(),
    };
    this.teamMembers.set(newMember.id, newMember);
    return newMember;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const member = Array.from(this.teamMembers.values()).find(m =>
      m.teamId === teamId && m.userId === userId
    );
    if (!member) return false;
    
    this.teamMembers.delete(member.id);
    return true;
  }

  async getUserTeams(userId: string): Promise<Array<Team & { role: TeamRole }>> {
    const userMemberships = Array.from(this.teamMembers.values()).filter(m =>
      m.userId === userId
    );

    const teams = [];
    for (const membership of userMemberships) {
      const team = this.teams.get(membership.teamId);
      if (team && team.isActive) {
        teams.push({ ...team, role: membership.role as TeamRole });
      }
    }

    return teams;
  }

  async getTeamMembers(teamId: string): Promise<Array<TeamMember & { user: User }>> {
    const members = Array.from(this.teamMembers.values()).filter(m =>
      m.teamId === teamId
    );

    const membersWithUsers = [];
    for (const member of members) {
      const user = this.users.get(member.userId);
      if (user) {
        membersWithUsers.push({ ...member, user });
      }
    }

    return membersWithUsers;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: TeamRole): Promise<boolean> {
    const member = Array.from(this.teamMembers.values()).find(m =>
      m.teamId === teamId && m.userId === userId
    );
    if (!member) return false;

    member.role = role;
    this.teamMembers.set(member.id, member);
    return true;
  }

  // Share Invitations
  async createShareInvite(invite: InsertShareInvite): Promise<ShareInvite> {
    const newInvite: ShareInvite = {
      id: randomUUID(),
      resourceType: invite.resourceType,
      resourceId: invite.resourceId,
      inviterUserId: invite.inviterUserId || null,
      inviteeEmail: invite.inviteeEmail,
      permissions: invite.permissions,
      token: randomUUID(),
      status: 'pending',
      expiresAt: invite.expiresAt,
      createdAt: new Date(),
    };
    this.shareInvites.set(newInvite.id, newInvite);
    return newInvite;
  }

  async getShareInvite(token: string): Promise<ShareInvite | undefined> {
    return Array.from(this.shareInvites.values()).find(invite =>
      invite.token === token
    );
  }

  async acceptShareInvite(token: string, userId: string): Promise<boolean> {
    const invite = await this.getShareInvite(token);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
      return false;
    }

    // Create access grant
    await this.grantAccess(
      invite.resourceType,
      invite.resourceId,
      'user',
      userId,
      invite.permissions,
      invite.inviterUserId || ''
    );

    // Update invite status
    invite.status = 'accepted';
    this.shareInvites.set(invite.id, invite);
    return true;
  }

  async declineShareInvite(token: string): Promise<boolean> {
    const invite = await this.getShareInvite(token);
    if (!invite || invite.status !== 'pending') {
      return false;
    }

    invite.status = 'declined';
    this.shareInvites.set(invite.id, invite);
    return true;
  }

  async getShareInvites(email: string): Promise<ShareInvite[]> {
    return Array.from(this.shareInvites.values()).filter(invite =>
      invite.inviteeEmail === email && invite.status === 'pending'
    );
  }

  async getUserSentInvites(userId: string): Promise<ShareInvite[]> {
    return Array.from(this.shareInvites.values()).filter(invite =>
      invite.inviterUserId === userId
    );
  }

  // Share Links
  async createShareLink(link: InsertShareLink): Promise<ShareLink> {
    const newLink: ShareLink = {
      id: randomUUID(),
      resourceType: link.resourceType,
      resourceId: link.resourceId,
      createdBy: link.createdBy || null,
      token: randomUUID(),
      permissions: link.permissions,
      accessCount: 0,
      maxAccessCount: link.maxAccessCount || null,
      expiresAt: link.expiresAt || null,
      isActive: true,
      createdAt: new Date(),
    };
    this.shareLinks.set(newLink.id, newLink);
    return newLink;
  }

  async getShareLink(token: string): Promise<ShareLink | undefined> {
    const link = Array.from(this.shareLinks.values()).find(l =>
      l.token === token && l.isActive
    );
    
    if (!link) return undefined;
    
    // Check expiration
    if (link.expiresAt && link.expiresAt < new Date()) {
      return undefined;
    }
    
    // Check access limit
    if (link.maxAccessCount && link.accessCount >= link.maxAccessCount) {
      return undefined;
    }
    
    return link;
  }

  async getResourceShareLinks(resourceType: ResourceType, resourceId: string): Promise<ShareLink[]> {
    return Array.from(this.shareLinks.values()).filter(link =>
      link.resourceType === resourceType &&
      link.resourceId === resourceId &&
      link.isActive
    );
  }

  async incrementShareLinkAccess(linkId: string): Promise<void> {
    const link = this.shareLinks.get(linkId);
    if (link) {
      link.accessCount++;
      this.shareLinks.set(linkId, link);
    }
  }

  async updateShareLink(linkId: string, updates: Partial<ShareLink>): Promise<ShareLink | undefined> {
    const link = this.shareLinks.get(linkId);
    if (!link) return undefined;
    
    Object.assign(link, updates);
    this.shareLinks.set(linkId, link);
    return link;
  }

  async deleteShareLink(linkId: string): Promise<boolean> {
    const link = this.shareLinks.get(linkId);
    if (!link) return false;
    
    link.isActive = false;
    this.shareLinks.set(linkId, link);
    return true;
  }

  // Database Management and Monitoring Implementation
  async getDatabaseStatistics(): Promise<{
    totalUsers: number;
    totalCsvUploads: number;
    totalStorageUsed: number;
    totalQueries: number;
    avgQueryTime: number;
    activeConnections: number;
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizeBytes: number;
    }>;
    recentActivity: Array<{
      timestamp: Date;
      action: string;
      count: number;
    }>;
  }> {
    // Mock implementation for in-memory storage
    const totalStorageUsed = Array.from(this.csvUploads.values())
      .reduce((sum, upload) => sum + (upload.fileSize || 0), 0);

    const recentActivity = [
      { timestamp: new Date(Date.now() - 3600000), action: 'csv_upload', count: 5 },
      { timestamp: new Date(Date.now() - 1800000), action: 'user_login', count: 12 },
      { timestamp: new Date(Date.now() - 900000), action: 'shared_result', count: 3 },
    ];

    return {
      totalUsers: this.users.size,
      totalCsvUploads: this.csvUploads.size,
      totalStorageUsed,
      totalQueries: 1250, // Mock value
      avgQueryTime: 45, // Mock value in ms
      activeConnections: 2, // Mock value
      tableStats: [
        { tableName: 'users', rowCount: this.users.size, sizeBytes: this.users.size * 512 },
        { tableName: 'csv_uploads', rowCount: this.csvUploads.size, sizeBytes: totalStorageUsed },
        { tableName: 'courses', rowCount: this.courses.size, sizeBytes: this.courses.size * 1024 },
        { tableName: 'shared_results', rowCount: this.sharedResults.size, sizeBytes: this.sharedResults.size * 256 },
      ],
      recentActivity,
    };
  }

  async getDatabasePerformanceMetrics(): Promise<{
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
    queryStats: {
      totalQueries: number;
      avgDuration: number;
      p95Duration: number;
      p99Duration: number;
    };
    connectionStats: {
      totalConnections: number;
      activeConnections: number;
      idleConnections: number;
      waitingConnections: number;
    };
    indexUsage: Array<{
      tableName: string;
      indexName: string;
      usage: number;
    }>;
  }> {
    // Mock implementation for in-memory storage
    return {
      slowQueries: [
        {
          query: 'SELECT * FROM csv_uploads WHERE status = ? ORDER BY uploaded_at DESC',
          duration: 145,
          timestamp: new Date(Date.now() - 600000),
        },
        {
          query: 'SELECT u.*, COUNT(c.id) FROM users u LEFT JOIN csv_uploads c ON u.id = c.user_id GROUP BY u.id',
          duration: 89,
          timestamp: new Date(Date.now() - 1200000),
        },
      ],
      queryStats: {
        totalQueries: 1250,
        avgDuration: 23,
        p95Duration: 67,
        p99Duration: 145,
      },
      connectionStats: {
        totalConnections: 5,
        activeConnections: 2,
        idleConnections: 2,
        waitingConnections: 0,
      },
      indexUsage: [
        { tableName: 'users', indexName: 'IDX_users_email', usage: 89 },
        { tableName: 'csv_uploads', indexName: 'IDX_csv_uploads_user_id', usage: 95 },
        { tableName: 'csv_uploads', indexName: 'IDX_csv_uploads_status', usage: 78 },
        { tableName: 'shared_results', indexName: 'IDX_shared_results_user_id', usage: 65 },
      ],
    };
  }

  async analyzeTablePerformance(tableName?: string): Promise<Array<{
    tableName: string;
    indexScans: number;
    seqScans: number;
    rowsRead: number;
    rowsReturned: number;
  }>> {
    // Mock implementation for in-memory storage
    const tables = tableName ? [tableName] : ['users', 'csv_uploads', 'courses', 'shared_results'];
    
    return tables.map(table => ({
      tableName: table,
      indexScans: Math.floor(Math.random() * 1000) + 500,
      seqScans: Math.floor(Math.random() * 100) + 10,
      rowsRead: Math.floor(Math.random() * 10000) + 1000,
      rowsReturned: Math.floor(Math.random() * 5000) + 500,
    }));
  }

  async optimizeDatabase(): Promise<{
    tablesOptimized: string[];
    indexesCreated: string[];
    performance: {
      before: number;
      after: number;
      improvement: number;
    };
  }> {
    // Mock implementation for in-memory storage
    const before = 156;
    const after = 89;
    
    return {
      tablesOptimized: ['users', 'csv_uploads', 'shared_results'],
      indexesCreated: ['IDX_users_created_at', 'IDX_csv_uploads_processed_at'],
      performance: {
        before,
        after,
        improvement: Math.round(((before - after) / before) * 100),
      },
    };
  }

  // Missing critical methods for TypeScript compliance
  async deductAutoMLCredits(userId: string, credits: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.automlCreditsRemaining = Math.max(0, (user.automlCreditsRemaining || 0) - credits);
      this.users.set(userId, user);
    }
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async updateUserSubscription(userId: string, subscriptionData: any): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, subscriptionData);
      this.users.set(userId, user);
      return user;
    }
    return undefined;
  }

  async cancelUserSubscription(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.subscriptionStatus = 'cancelled';
      this.users.set(userId, user);
    }
  }

  async recordPayment(paymentData: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      id: randomUUID(),
      ...paymentData,
      createdAt: new Date(),
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async createAutoMLJob(jobData: InsertAutoMLJob): Promise<AutoMLJob> {
    const job: AutoMLJob = {
      id: randomUUID(),
      ...jobData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.autoMLJobs.set(job.id, job);
    return job;
  }

  async updateAutoMLJob(jobId: string, updates: Partial<AutoMLJob>): Promise<AutoMLJob | undefined> {
    const job = this.autoMLJobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date() });
      this.autoMLJobs.set(jobId, job);
      return job;
    }
    return undefined;
  }

  async getUserAutoMLJobs(userId: string): Promise<AutoMLJob[]> {
    return Array.from(this.autoMLJobs.values()).filter(job => job.userId === userId);
  }
  
  // Market Data Implementation
  async createMarketDataDownload(download: InsertMarketDataDownload): Promise<MarketDataDownload> {
    const id = randomUUID();
    const newDownload: MarketDataDownload = {
      id,
      ...download,
      downloadedAt: new Date(),
    };
    this.marketDataDownloads.set(id, newDownload);
    
    // Update popular symbols stats
    await this.updatePopularSymbolStats(download.symbol, download.fileSize);
    
    return newDownload;
  }

  async getMarketDataDownload(id: string): Promise<MarketDataDownload | undefined> {
    return this.marketDataDownloads.get(id);
  }

  async getUserMarketDataDownloads(userId: string): Promise<MarketDataDownload[]> {
    return Array.from(this.marketDataDownloads.values())
      .filter(download => download.userId === userId)
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
  }

  async updateMarketDataDownload(id: string, updates: Partial<MarketDataDownload>): Promise<MarketDataDownload | undefined> {
    const download = this.marketDataDownloads.get(id);
    if (!download) return undefined;
    
    const updated = { ...download, ...updates };
    this.marketDataDownloads.set(id, updated);
    return updated;
  }

  async deleteMarketDataDownload(id: string): Promise<boolean> {
    return this.marketDataDownloads.delete(id);
  }

  async upsertPopularSymbol(symbolData: InsertPopularSymbol): Promise<PopularSymbol> {
    const existing = this.marketDataPopularSymbols.get(symbolData.symbol);
    
    if (existing) {
      const updated: PopularSymbol = {
        ...existing,
        downloadCount: existing.downloadCount + (symbolData.downloadCount || 1),
        lastDownloaded: new Date(),
        companyName: symbolData.companyName || existing.companyName,
        sector: symbolData.sector || existing.sector,
        marketCap: symbolData.marketCap || existing.marketCap,
        avgFileSize: symbolData.avgFileSize || existing.avgFileSize,
      };
      this.marketDataPopularSymbols.set(symbolData.symbol, updated);
      return updated;
    } else {
      const newSymbol: PopularSymbol = {
        ...symbolData,
        downloadCount: symbolData.downloadCount || 1,
        lastDownloaded: new Date(),
        isActive: true,
      };
      this.marketDataPopularSymbols.set(symbolData.symbol, newSymbol);
      return newSymbol;
    }
  }

  async getPopularSymbol(symbol: string): Promise<PopularSymbol | undefined> {
    return this.marketDataPopularSymbols.get(symbol);
  }

  async getPopularSymbols(limit: number = 10): Promise<PopularSymbol[]> {
    return Array.from(this.marketDataPopularSymbols.values())
      .filter(symbol => symbol.isActive)
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, limit);
  }

  async updatePopularSymbolStats(symbol: string, fileSize?: number): Promise<void> {
    const existing = this.marketDataPopularSymbols.get(symbol);
    
    if (existing) {
      const updated: PopularSymbol = {
        ...existing,
        downloadCount: existing.downloadCount + 1,
        lastDownloaded: new Date(),
        avgFileSize: fileSize && existing.avgFileSize 
          ? Math.round((existing.avgFileSize + fileSize) / 2)
          : fileSize || existing.avgFileSize,
      };
      this.marketDataPopularSymbols.set(symbol, updated);
    } else {
      const newSymbol: PopularSymbol = {
        symbol: symbol.toUpperCase(),
        downloadCount: 1,
        lastDownloaded: new Date(),
        avgFileSize: fileSize,
        isActive: true,
        companyName: undefined,
        sector: undefined,
        marketCap: undefined,
      };
      this.marketDataPopularSymbols.set(symbol, newSymbol);
    }
  }

  // ===========================================
  // USER NOTIFICATION SYSTEM IMPLEMENTATION
  // ===========================================

  // User Notification Preferences Implementation
  async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | undefined> {
    return Array.from(this.userNotificationPreferences.values()).find(prefs => prefs.userId === userId);
  }

  async createUserNotificationPreferences(preferences: InsertUserNotificationPreferences): Promise<UserNotificationPreferences> {
    const id = randomUUID();
    const newPreferences: UserNotificationPreferences = {
      id,
      ...preferences,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userNotificationPreferences.set(id, newPreferences);
    return newPreferences;
  }

  async updateUserNotificationPreferences(userId: string, updates: Partial<UserNotificationPreferences>): Promise<UserNotificationPreferences | undefined> {
    const existing = Array.from(this.userNotificationPreferences.values()).find(prefs => prefs.userId === userId);
    if (!existing) return undefined;

    const updated: UserNotificationPreferences = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.userNotificationPreferences.set(existing.id, updated);
    return updated;
  }

  async getOrCreateUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
    const existing = await this.getUserNotificationPreferences(userId);
    if (existing) return existing;

    // Create default preferences for new user
    return this.createUserNotificationPreferences({
      userId,
      emailNotifications: true,
      emailMarketDataAlerts: true,
      emailProductivityReminders: true,
      emailCourseUpdates: true,
      emailShareInvitations: true,
      emailAdminNotifications: true,
      pushNotifications: false,
      pushMarketDataAlerts: false,
      pushProductivityReminders: false,
      pushCourseUpdates: false,
      inAppNotifications: true,
      inAppMarketDataAlerts: true,
      inAppProductivityReminders: true,
      inAppCourseUpdates: true,
      inAppShareInvitations: true,
      inAppAdminNotifications: true,
      emailFrequency: "instant",
      digestEmailTime: "09:00",
      weeklyDigestDay: "monday",
      soundEnabled: false,
      desktopNotifications: false,
      allowNotificationAnalytics: true,
    });
  }

  // In-App Notifications Implementation
  async getInAppNotifications(userId: string, options?: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean;
    type?: InAppNotificationType;
    category?: NotificationCategory;
    priority?: NotificationPriority;
  }): Promise<{ notifications: InAppNotification[]; totalCount: number; unreadCount: number }> {
    let notifications = Array.from(this.inAppNotifications.values()).filter(n => n.userId === userId);

    // Apply filters
    if (options?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    if (options?.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }
    if (options?.category) {
      notifications = notifications.filter(n => n.category === options.category);
    }
    if (options?.priority) {
      notifications = notifications.filter(n => n.priority === options.priority);
    }

    // Filter out expired notifications
    const now = new Date();
    notifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);

    // Sort by priority and creation date
    const priorityOrder: Record<NotificationPriority, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
    notifications.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority as NotificationPriority] || 2) - (priorityOrder[a.priority as NotificationPriority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const totalCount = notifications.length;
    const unreadCount = notifications.filter(n => !n.read).length;

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    return {
      notifications: paginatedNotifications,
      totalCount,
      unreadCount
    };
  }

  async createInAppNotification(notification: InsertInAppNotification): Promise<InAppNotification> {
    const id = randomUUID();
    const newNotification: InAppNotification = {
      id,
      ...notification,
      read: false,
      clickCount: 0,
      createdAt: new Date(),
    };
    this.inAppNotifications.set(id, newNotification);
    return newNotification;
  }

  async getInAppNotification(id: string): Promise<InAppNotification | undefined> {
    return this.inAppNotifications.get(id);
  }

  async markInAppNotificationRead(id: string, userId: string): Promise<InAppNotification | undefined> {
    const notification = this.inAppNotifications.get(id);
    if (!notification || notification.userId !== userId) return undefined;

    const updated: InAppNotification = {
      ...notification,
      read: true,
      readAt: new Date(),
    };
    this.inAppNotifications.set(id, updated);
    return updated;
  }

  async markAllInAppNotificationsRead(userId: string): Promise<number> {
    let count = 0;
    for (const [id, notification] of this.inAppNotifications.entries()) {
      if (notification.userId === userId && !notification.read) {
        const updated: InAppNotification = {
          ...notification,
          read: true,
          readAt: new Date(),
        };
        this.inAppNotifications.set(id, updated);
        count++;
      }
    }
    return count;
  }

  async deleteInAppNotification(id: string, userId: string): Promise<boolean> {
    const notification = this.inAppNotifications.get(id);
    if (!notification || notification.userId !== userId) return false;
    return this.inAppNotifications.delete(id);
  }

  async bulkDeleteInAppNotifications(notificationIds: string[], userId: string): Promise<number> {
    let count = 0;
    for (const id of notificationIds) {
      const notification = this.inAppNotifications.get(id);
      if (notification && notification.userId === userId) {
        this.inAppNotifications.delete(id);
        count++;
      }
    }
    return count;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.inAppNotifications.values())
      .filter(n => n.userId === userId && !n.read && (!n.expiresAt || n.expiresAt > new Date())).length;
  }

  async getNotificationCountsByType(userId: string): Promise<Record<InAppNotificationType, number>> {
    const notifications = Array.from(this.inAppNotifications.values())
      .filter(n => n.userId === userId && (!n.expiresAt || n.expiresAt > new Date()));

    const counts: Record<InAppNotificationType, number> = {
      market_alert: 0,
      course_update: 0,
      productivity_reminder: 0,
      share_invitation: 0,
      admin_notification: 0,
      system_update: 0
    };

    for (const notification of notifications) {
      if (notification.type in counts) {
        counts[notification.type as InAppNotificationType]++;
      }
    }

    return counts;
  }

  async deleteExpiredInAppNotifications(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [id, notification] of this.inAppNotifications.entries()) {
      if (notification.expiresAt && notification.expiresAt <= now) {
        this.inAppNotifications.delete(id);
        count++;
      }
    }
    return count;
  }

  async getRecentInAppNotifications(userId: string, limit: number = 5): Promise<InAppNotification[]> {
    return Array.from(this.inAppNotifications.values())
      .filter(n => n.userId === userId && (!n.expiresAt || n.expiresAt > new Date()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Notification creation helpers
  async createMarketDataAlertNotification(userId: string, alertData: { 
    title: string; 
    message: string; 
    ticker?: string; 
    price?: number; 
    actionUrl?: string 
  }): Promise<InAppNotification> {
    return this.createInAppNotification({
      userId,
      title: alertData.title,
      message: alertData.message,
      type: "market_alert",
      category: "info",
      priority: "high",
      actionUrl: alertData.actionUrl,
      actionText: "View Details",
      actionType: "navigate",
      sourceSystem: "market_data",
      sourceId: alertData.ticker,
      metadata: {
        ticker: alertData.ticker,
        price: alertData.price,
        alertType: "price_alert"
      }
    });
  }

  async createCourseUpdateNotification(userId: string, courseData: { 
    title: string; 
    message: string; 
    courseId: string; 
    actionUrl?: string 
  }): Promise<InAppNotification> {
    return this.createInAppNotification({
      userId,
      title: courseData.title,
      message: courseData.message,
      type: "course_update",
      category: "info",
      priority: "normal",
      actionUrl: courseData.actionUrl || `/courses/${courseData.courseId}`,
      actionText: "View Course",
      actionType: "navigate",
      sourceSystem: "courses",
      sourceId: courseData.courseId,
      metadata: {
        courseId: courseData.courseId,
        updateType: "general"
      }
    });
  }

  async createProductivityReminderNotification(userId: string, reminderData: { 
    title: string; 
    message: string; 
    itemId?: string; 
    boardId?: string; 
    actionUrl?: string 
  }): Promise<InAppNotification> {
    return this.createInAppNotification({
      userId,
      title: reminderData.title,
      message: reminderData.message,
      type: "productivity_reminder",
      category: "warning",
      priority: "normal",
      actionUrl: reminderData.actionUrl || (reminderData.boardId ? `/productivity-board-page?boardId=${reminderData.boardId}` : undefined),
      actionText: "View Item",
      actionType: "navigate",
      sourceSystem: "productivity",
      sourceId: reminderData.itemId || reminderData.boardId,
      metadata: {
        itemId: reminderData.itemId,
        boardId: reminderData.boardId,
        reminderType: "due_date"
      }
    });
  }

  async createShareInvitationNotification(userId: string, inviteData: { 
    title: string; 
    message: string; 
    inviterId: string; 
    resourceType: string; 
    resourceId: string; 
    actionUrl?: string 
  }): Promise<InAppNotification> {
    return this.createInAppNotification({
      userId,
      title: inviteData.title,
      message: inviteData.message,
      type: "share_invitation",
      category: "info",
      priority: "high",
      actionUrl: inviteData.actionUrl || "/invitations",
      actionText: "View Invitation",
      actionType: "navigate",
      sourceSystem: "sharing",
      sourceId: inviteData.resourceId,
      metadata: {
        inviterId: inviteData.inviterId,
        resourceType: inviteData.resourceType,
        resourceId: inviteData.resourceId
      }
    });
  }

  async createAdminNotification(userId: string, adminData: { 
    title: string; 
    message: string; 
    priority?: NotificationPriority; 
    actionUrl?: string 
  }): Promise<InAppNotification> {
    return this.createInAppNotification({
      userId,
      title: adminData.title,
      message: adminData.message,
      type: "admin_notification",
      category: "info",
      priority: adminData.priority || "normal",
      actionUrl: adminData.actionUrl,
      actionText: "View Details",
      actionType: "navigate",
      sourceSystem: "admin",
      metadata: {
        adminNotification: true
      }
    });
  }

  async createSystemUpdateNotification(userId: string, systemData: { 
    title: string; 
    message: string; 
    version?: string; 
    actionUrl?: string 
  }): Promise<InAppNotification> {
    return this.createInAppNotification({
      userId,
      title: systemData.title,
      message: systemData.message,
      type: "system_update",
      category: "success",
      priority: "low",
      actionUrl: systemData.actionUrl,
      actionText: "Learn More",
      actionType: "navigate",
      sourceSystem: "system",
      metadata: {
        version: systemData.version,
        systemUpdate: true
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
    });
  }

  // Notification preference validation
  async shouldSendEmailNotification(userId: string, notificationType: InAppNotificationType): Promise<boolean> {
    const preferences = await this.getOrCreateUserNotificationPreferences(userId);
    
    if (!preferences.emailNotifications || preferences.emailFrequency === "off") {
      return false;
    }

    switch (notificationType) {
      case "market_alert":
        return preferences.emailMarketDataAlerts;
      case "course_update":
        return preferences.emailCourseUpdates;
      case "productivity_reminder":
        return preferences.emailProductivityReminders;
      case "share_invitation":
        return preferences.emailShareInvitations;
      case "admin_notification":
        return preferences.emailAdminNotifications;
      case "system_update":
        return true; // Always send important system updates via email
      default:
        return preferences.emailNotifications;
    }
  }

  async shouldSendInAppNotification(userId: string, notificationType: InAppNotificationType): Promise<boolean> {
    const preferences = await this.getOrCreateUserNotificationPreferences(userId);
    
    if (!preferences.inAppNotifications) {
      return false;
    }

    switch (notificationType) {
      case "market_alert":
        return preferences.inAppMarketDataAlerts;
      case "course_update":
        return preferences.inAppCourseUpdates;
      case "productivity_reminder":
        return preferences.inAppProductivityReminders;
      case "share_invitation":
        return preferences.inAppShareInvitations;
      case "admin_notification":
        return preferences.inAppAdminNotifications;
      case "system_update":
        return true; // Always show system updates in-app
      default:
        return preferences.inAppNotifications;
    }
  }

  async shouldSendPushNotification(userId: string, notificationType: InAppNotificationType): Promise<boolean> {
    const preferences = await this.getOrCreateUserNotificationPreferences(userId);
    
    if (!preferences.pushNotifications) {
      return false;
    }

    switch (notificationType) {
      case "market_alert":
        return preferences.pushMarketDataAlerts;
      case "course_update":
        return preferences.pushCourseUpdates;
      case "productivity_reminder":
        return preferences.pushProductivityReminders;
      case "share_invitation":
        return true; // Always send push for urgent invitations
      case "admin_notification":
        return true; // Always send push for admin notifications
      case "system_update":
        return false; // Never push for system updates
      default:
        return preferences.pushNotifications;
    }
  }

  // Additional notification queue method for digest functionality
  async getBatchedNotificationsForUser(userId: string, sinceDate: Date): Promise<NotificationQueue[]> {
    return Array.from(this.notificationQueue.values())
      .filter(notification => 
        notification.userId === userId && 
        notification.status === 'batched' &&
        new Date(notification.updatedAt || notification.createdAt) >= sinceDate
      )
      .sort((a, b) => (a.priority || 0) - (b.priority || 0)); // Sort by priority desc
  }
}

export const storage = new MemStorage();
