import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, json, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table updated for Replit Auth with GDPR fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("user"), // user, moderator, admin, superadmin
  isApproved: boolean("is_approved").notNull().default(false),
  // GDPR Compliance Fields
  dataRetentionUntil: timestamp("data_retention_until"),
  marketingConsent: boolean("marketing_consent").default(false),
  analyticsConsent: boolean("analytics_consent").default(false),
  dataProcessingBasis: varchar("data_processing_basis"), // contract, consent, legitimate_interest
  lastConsentUpdate: timestamp("last_consent_update"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(), // beginner, intermediate, advanced
  price: integer("price").notNull(),
  rating: integer("rating").default(0),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  slidesUrl: text("slides_url"),
  documentsUrl: text("documents_url"),
  codeUrl: text("code_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  questions: json("questions").notNull(), // Array of question objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: json("answers").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending"), // pending, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const csvUploads = pgTable("csv_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(), // Original filename
  customFilename: text("custom_filename").notNull(), // User-defined filename
  firebaseStorageUrl: text("firebase_storage_url").notNull(), // Firebase Storage download URL
  firebaseStoragePath: text("firebase_storage_path").notNull(), // Firebase Storage full path for deletion
  fileSize: integer("file_size").notNull(),
  columnCount: integer("column_count").notNull(),
  rowCount: integer("row_count").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, error
  fileMetadata: json("file_metadata"), // Additional metadata: contentType, percentileColumns, validation results
  timeSeriesData: json("time_series_data").notNull(), // Array of CSV row objects
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const anomalies = pgTable("anomalies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadId: varchar("upload_id").notNull().references(() => csvUploads.id),
  anomalyType: text("anomaly_type").notNull(), // p50_median_spike, p10_consecutive_low
  detectedDate: text("detected_date").notNull(), // The date where anomaly was detected
  weekBeforeValue: real("week_before_value"), // p90 value from week before anomaly
  p90Value: real("p90_value"), // p90 value at time of anomaly
  description: text("description").notNull(),
  openaiAnalysis: text("openai_analysis"), // OpenAI analysis of the anomaly
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sharedResults = pgTable("shared_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  csvUploadId: varchar("csv_upload_id").notNull().references(() => csvUploads.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  shareToken: varchar("share_token").notNull().unique(),
  permissions: text("permissions").notNull().default("view_only"), // view_only, view_download
  expiresAt: timestamp("expires_at"), // null means never expires
  viewCount: integer("view_count").notNull().default(0),
  accessLogs: json("access_logs").notNull().default('[]'), // Track access attempts for security
  title: text("title"), // Optional custom title for the shared result
  description: text("description"), // Optional description for the shared result
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// GDPR Compliance Tables
export const userConsent = pgTable("user_consent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  consentType: varchar("consent_type").notNull(), // marketing, analytics, essential, cookies
  consentGiven: boolean("consent_given").notNull(),
  consentDate: timestamp("consent_date").notNull().defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  withdrawnAt: timestamp("withdrawn_at"),
  purpose: text("purpose"), // Detailed purpose description
  legalBasis: varchar("legal_basis"), // contract, consent, legitimate_interest, vital_interests, public_task, legal_obligation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Anonymous consent table for unauthenticated users (GDPR compliance)
export const anonymousConsent = pgTable("anonymous_consent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(), // Email as identifier for anonymous users
  consentType: varchar("consent_type").notNull(), // marketing, analytics, essential, cookies, data_processing
  consentGiven: boolean("consent_given").notNull(),
  consentDate: timestamp("consent_date").notNull().defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  purpose: text("purpose"), // Detailed purpose description
  legalBasis: varchar("legal_basis"), // contract, consent, legitimate_interest, vital_interests, public_task, legal_obligation
  processingActivity: varchar("processing_activity"), // contact_form, newsletter_signup, etc.
  withdrawnAt: timestamp("withdrawn_at"),
  linkedUserId: varchar("linked_user_id").references(() => users.id), // Link to user account when they register later
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dataProcessingLog = pgTable("data_processing_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // access, modify, export, delete, create, share
  dataType: varchar("data_type").notNull(), // profile, csv, sharing, course, quiz, support
  recordId: varchar("record_id"), // ID of the specific record being processed
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  requestDetails: text("request_details"), // Additional context about the action
  legalBasis: varchar("legal_basis"), // contract, consent, legitimate_interest, etc.
  processingPurpose: varchar("processing_purpose"), // service_provision, analytics, marketing, support
  dataSubjects: json("data_subjects"), // Array of affected data subjects (for bulk operations)
  retentionPeriod: varchar("retention_period"), // How long this log should be kept
});

// Authentication Audit Log table for OWASP ASVS V1/V2 compliance
export const authAuditLog = pgTable("auth_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: varchar("action").notNull(), // login, logout, failed_login, session_expired, session_hijack_attempt
  ipAddress: varchar("ip_address").notNull(),
  userAgent: varchar("user_agent"),
  success: boolean("success").notNull(),
  failureReason: varchar("failure_reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sessionId: varchar("session_id"),
  riskScore: integer("risk_score").default(0),
  metadata: json("metadata"), // Additional security metadata
});

// Enhanced Sessions table with security features
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sid: varchar("sid").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: varchar("user_agent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  revokedReason: varchar("revoked_reason"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
}).partial().required({ id: true });

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCsvUploadSchema = createInsertSchema(csvUploads).omit({
  id: true,
  userId: true,
  uploadedAt: true,
  processedAt: true,
}).refine((data) => {
  // Validate file size (max 100MB)
  if (data.fileSize && data.fileSize > 100 * 1024 * 1024) {
    throw new Error('File size must be less than 100MB');
  }
  
  // Validate row count (max 10,000 rows)
  if (data.rowCount && data.rowCount > 10000) {
    throw new Error('CSV file too large. Maximum 10,000 rows allowed.');
  }
  
  // Validate column count (max 100 columns)
  if (data.columnCount && data.columnCount > 100) {
    throw new Error('CSV file has too many columns. Maximum 100 columns allowed.');
  }
  
  // Validate timeSeriesData size (max 50MB JSON)
  if (data.timeSeriesData && Array.isArray(data.timeSeriesData)) {
    const jsonSize = Buffer.byteLength(JSON.stringify(data.timeSeriesData), 'utf8');
    if (jsonSize > 50 * 1024 * 1024) {
      throw new Error('Parsed CSV data too large. Maximum 50MB JSON size allowed.');
    }
  }
  
  return true;
});

export const insertAnomalySchema = createInsertSchema(anomalies).omit({
  id: true,
  createdAt: true,
});

export const insertSharedResultSchema = createInsertSchema(sharedResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  permissions: z.enum(["view_only", "view_download"]).default("view_only"),
  expirationOption: z.enum(["24h", "7d", "30d", "never"]).optional(),
});

// GDPR Insert Schemas
export const insertUserConsentSchema = createInsertSchema(userConsent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  consentType: z.enum(["marketing", "analytics", "essential", "cookies"]),
  legalBasis: z.enum(["contract", "consent", "legitimate_interest", "vital_interests", "public_task", "legal_obligation"]).optional(),
});

export const insertAnonymousConsentSchema = createInsertSchema(anonymousConsent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  consentType: z.enum(["marketing", "analytics", "essential", "cookies", "data_processing"]),
  legalBasis: z.enum(["contract", "consent", "legitimate_interest", "vital_interests", "public_task", "legal_obligation"]).optional(),
});

export const insertDataProcessingLogSchema = createInsertSchema(dataProcessingLog).omit({
  id: true,
  timestamp: true,
}).extend({
  action: z.enum(["access", "modify", "export", "delete", "create", "share"]),
  dataType: z.enum(["profile", "csv", "sharing", "course", "quiz", "support", "consent"]),
  legalBasis: z.enum(["contract", "consent", "legitimate_interest", "vital_interests", "public_task", "legal_obligation"]).optional(),
  processingPurpose: z.enum(["service_provision", "analytics", "marketing", "support", "compliance", "security"]).optional(),
});

// Security schemas
export const insertAuthAuditLogSchema = createInsertSchema(authAuditLog).omit({
  id: true,
  timestamp: true,
}).extend({
  action: z.enum(["login", "logout", "failed_login", "session_expired", "session_hijack_attempt", "token_refresh", "account_locked"]),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertCsvUpload = z.infer<typeof insertCsvUploadSchema>;
export type CsvUpload = typeof csvUploads.$inferSelect;
export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type Anomaly = typeof anomalies.$inferSelect;
export type InsertSharedResult = z.infer<typeof insertSharedResultSchema>;
export type SharedResult = typeof sharedResults.$inferSelect;

// GDPR Types
export type InsertUserConsent = z.infer<typeof insertUserConsentSchema>;
export type UserConsent = typeof userConsent.$inferSelect;
export type InsertAnonymousConsent = z.infer<typeof insertAnonymousConsentSchema>;
export type AnonymousConsent = typeof anonymousConsent.$inferSelect;
export type InsertDataProcessingLog = z.infer<typeof insertDataProcessingLogSchema>;
export type DataProcessingLog = typeof dataProcessingLog.$inferSelect;

// Security Types
export type InsertAuthAuditLog = z.infer<typeof insertAuthAuditLogSchema>;
export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// GDPR Enums for type safety
export const CONSENT_TYPES = ["marketing", "analytics", "essential", "cookies", "data_processing"] as const;
export const LEGAL_BASIS = ["contract", "consent", "legitimate_interest", "vital_interests", "public_task", "legal_obligation"] as const;
export const PROCESSING_ACTIONS = ["access", "modify", "export", "delete", "create", "share"] as const;
export const DATA_TYPES = ["profile", "csv", "sharing", "course", "quiz", "support", "consent"] as const;
export const PROCESSING_PURPOSES = ["service_provision", "analytics", "marketing", "support", "compliance", "security"] as const;

export type ConsentType = typeof CONSENT_TYPES[number];
export type LegalBasis = typeof LEGAL_BASIS[number];
export type ProcessingAction = typeof PROCESSING_ACTIONS[number];
export type DataType = typeof DATA_TYPES[number];
export type ProcessingPurpose = typeof PROCESSING_PURPOSES[number];
