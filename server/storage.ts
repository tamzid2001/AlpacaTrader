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
  type InsertSharedResult
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
}

export const storage = new MemStorage();
