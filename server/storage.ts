import { 
  type User, 
  type InsertUser,
  type UpsertUser, 
  type Course,
  type InsertCourse,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  type Quiz,
  type InsertQuiz,
  type QuizResult,
  type InsertQuizResult,
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
  type InviteStatus
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

  // Courses
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined>;

  // Enrollments
  getUserEnrollments(userId: string): Promise<(CourseEnrollment & { course: Course })[]>;
  enrollUserInCourse(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateEnrollmentProgress(userId: string, courseId: string, progress: number): Promise<void>;

  // Quizzes
  getCourseQuizzes(courseId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  submitQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getUserQuizResults(userId: string): Promise<QuizResult[]>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private courses: Map<string, Course> = new Map();
  private enrollments: Map<string, CourseEnrollment> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
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
  // User content storage
  public userNotes: Map<string, any> = new Map();
  public userAchievements: Map<string, any> = new Map();

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

  // Enrollments
  async getUserEnrollments(userId: string): Promise<(CourseEnrollment & { course: Course })[]> {
    const enrollments = Array.from(this.enrollments.values()).filter(e => e.userId === userId);
    return enrollments.map(enrollment => ({
      ...enrollment,
      course: this.courses.get(enrollment.courseId)!
    })).filter(e => e.course);
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

  async updateEnrollmentProgress(userId: string, courseId: string, progress: number): Promise<void> {
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
    if (enrollment) {
      enrollment.progress = progress;
      enrollment.completed = progress >= 100;
    }
  }

  // Quizzes
  async getCourseQuizzes(courseId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(q => q.courseId === courseId);
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { ...insertQuiz, id, createdAt: new Date() };
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
}

export const storage = new MemStorage();
