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
  // Stripe Integration Fields
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Active subscription ID (nullable)
  
  // Subscription Management
  subscriptionStatus: varchar("subscription_status"), // active, past_due, cancelled, etc.
  subscriptionPlan: varchar("subscription_plan"), // monthly, yearly
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  
  // Usage Tracking
  automlCreditsRemaining: integer("automl_credits_remaining").default(0),
  automlCreditsTotal: integer("automl_credits_total").default(0),
  monthlyUsageResetDate: timestamp("monthly_usage_reset_date"),
  
  // Payment Methods
  defaultPaymentMethodId: varchar("default_payment_method_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_users_role").on(table.role),
  index("IDX_users_is_approved").on(table.isApproved),
  index("IDX_users_created_at").on(table.createdAt),
  index("IDX_users_data_retention_until").on(table.dataRetentionUntil),
]);

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
  // Extended fields for comprehensive video course system
  instructor: text("instructor"),
  duration: integer("duration"), // Total course duration in minutes
  category: text("category"), // finance, trading, ml, analytics, etc.
  thumbnailUrl: text("thumbnail_url"),
  previewVideoUrl: text("preview_video_url"), // Short preview/trailer video
  status: text("status").default("draft"), // draft, published, archived
  totalLessons: integer("total_lessons").default(0),
  estimatedCompletionHours: integer("estimated_completion_hours"),
  prerequisites: text("prerequisites").array(), // Array of prerequisite course IDs or skills
  learningObjectives: text("learning_objectives").array(), // What students will learn
  tags: text("tags").array(), // SEO and filtering tags
  publishedAt: timestamp("published_at"),
  ownerId: varchar("owner_id").references(() => users.id), // Track course ownership for permissions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_courses_owner_id").on(table.ownerId),
  index("IDX_courses_level").on(table.level),
  index("IDX_courses_category").on(table.category),
  index("IDX_courses_status").on(table.status),
  index("IDX_courses_published_at").on(table.publishedAt),
  index("IDX_courses_created_at").on(table.createdAt),
]);

export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  progress: integer("progress").default(0), // Overall course progress percentage
  completed: boolean("completed").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completionDate: timestamp("completion_date"), // When the course was completed
  lastAccessedAt: timestamp("last_accessed_at"), // Track learning engagement
  totalTimeSpent: integer("total_time_spent").default(0), // Minutes spent in course
  certificateIssued: boolean("certificate_issued").default(false),
  certificateUrl: text("certificate_url"), // Link to certificate if issued
}, (table) => [
  index("IDX_course_enrollments_user_id").on(table.userId),
  index("IDX_course_enrollments_course_id").on(table.courseId),
  index("IDX_course_enrollments_completed").on(table.completed),
  index("IDX_course_enrollments_enrolled_at").on(table.enrolledAt),
  index("IDX_course_enrollments_completion_date").on(table.completionDate),
  index("IDX_course_enrollments_last_accessed").on(table.lastAccessedAt),
]);

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  questions: json("questions").notNull(), // Array of question objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_quizzes_course_id").on(table.courseId),
  index("IDX_quizzes_created_at").on(table.createdAt),
]);

export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: json("answers").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_quiz_results_user_id").on(table.userId),
  index("IDX_quiz_results_quiz_id").on(table.quizId),
  index("IDX_quiz_results_completed_at").on(table.completedAt),
]);

// ===================
// VIDEO COURSE LESSON SYSTEM TABLES
// ===================

// Lessons - Individual video lessons within courses
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"), // Object storage video URL
  videoMetadata: json("video_metadata"), // Duration, resolution, file size, etc.
  order: integer("order").notNull(), // Lesson order within course
  duration: integer("duration"), // Video duration in seconds
  isPreview: boolean("is_preview").default(false), // Can be viewed without enrollment
  transcriptUrl: text("transcript_url"), // Captions/transcript file URL
  thumbnailUrl: text("thumbnail_url"),
  objectStoragePath: text("object_storage_path"), // Full object storage path
  uploadStatus: text("upload_status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_lessons_course_id").on(table.courseId),
  index("IDX_lessons_order").on(table.order),
  index("IDX_lessons_upload_status").on(table.uploadStatus),
  index("IDX_lessons_is_preview").on(table.isPreview),
  index("IDX_lessons_created_at").on(table.createdAt),
]);

// Course Materials - Downloadable resources for lessons
export const courseMaterials = pgTable("course_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'cascade' }), // Some materials may be course-wide
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // pdf, doc, docx, zip, code, slides, worksheet
  downloadUrl: text("download_url").notNull(), // Object storage download URL
  objectStoragePath: text("object_storage_path").notNull(),
  fileSize: integer("file_size"), // File size in bytes
  mimeType: text("mime_type"),
  isRequired: boolean("is_required").default(false), // Required for lesson completion
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_course_materials_lesson_id").on(table.lessonId),
  index("IDX_course_materials_course_id").on(table.courseId),
  index("IDX_course_materials_type").on(table.type),
  index("IDX_course_materials_is_required").on(table.isRequired),
  index("IDX_course_materials_created_at").on(table.createdAt),
]);

// User Progress - Detailed progress tracking for lessons
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean("completed").default(false),
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  lastWatched: integer("last_watched").default(0), // Seconds into video where user left off
  totalWatchTime: integer("total_watch_time").default(0), // Total seconds watched (for analytics)
  watchingSessions: json("watching_sessions"), // Array of session data for analytics
  startedAt: timestamp("started_at"), // When user first started this lesson
  completedAt: timestamp("completed_at"), // When user completed this lesson
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_user_progress_user_id").on(table.userId),
  index("IDX_user_progress_course_id").on(table.courseId),
  index("IDX_user_progress_lesson_id").on(table.lessonId),
  index("IDX_user_progress_completed").on(table.completed),
  index("IDX_user_progress_last_accessed").on(table.lastAccessedAt),
  // Composite index for efficient user course progress queries
  index("IDX_user_progress_user_course").on(table.userId, table.courseId),
]);

export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending"), // pending, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_support_messages_user_id").on(table.userId),
  index("IDX_support_messages_status").on(table.status),
  index("IDX_support_messages_created_at").on(table.createdAt),
]);

export const csvUploads = pgTable("csv_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(), // Original filename
  customFilename: text("custom_filename").notNull(), // User-defined filename
  objectStoragePath: text("object_storage_path").notNull(), // Object Storage full path
  fileSize: integer("file_size").notNull(),
  columnCount: integer("column_count").notNull(),
  rowCount: integer("row_count").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, error
  fileMetadata: json("file_metadata"), // Additional metadata: contentType, percentileColumns, validation results
  timeSeriesData: json("time_series_data").notNull(), // Array of CSV row objects
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  // Legacy Firebase fields for migration compatibility
  firebaseStorageUrl: text("firebase_storage_url"), // Firebase Storage download URL (legacy)
  firebaseStoragePath: text("firebase_storage_path"), // Firebase Storage full path (legacy)
}, (table) => [
  index("IDX_csv_uploads_user_id").on(table.userId),
  index("IDX_csv_uploads_status").on(table.status),
  index("IDX_csv_uploads_uploaded_at").on(table.uploadedAt),
  index("IDX_csv_uploads_file_size").on(table.fileSize),
]);

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
}, (table) => [
  index("IDX_anomalies_upload_id").on(table.uploadId),
  index("IDX_anomalies_anomaly_type").on(table.anomalyType),
  index("IDX_anomalies_detected_date").on(table.detectedDate),
  index("IDX_anomalies_created_at").on(table.createdAt),
]);

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
}, (table) => [
  index("IDX_shared_results_csv_upload_id").on(table.csvUploadId),
  index("IDX_shared_results_user_id").on(table.userId),
  index("IDX_shared_results_expires_at").on(table.expiresAt),
  index("IDX_shared_results_created_at").on(table.createdAt),
]);

// ===================
// PERMISSION MANAGEMENT TABLES
// ===================

// Access Grants - Core permission tracking
export const accessGrants = pgTable("access_grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: varchar("resource_type").notNull(), // 'csv', 'course', 'report', 'user_content'
  resourceId: varchar("resource_id").notNull(),
  principalType: varchar("principal_type").notNull(), // 'user', 'group', 'link'
  principalId: varchar("principal_id").notNull(),
  permissions: varchar("permissions").array().notNull(), // ['view', 'edit', 'share', 'delete']
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // For temporary access
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("IDX_access_grants_resource_type_id").on(table.resourceType, table.resourceId),
  index("IDX_access_grants_principal_type_id").on(table.principalType, table.principalId),
  index("IDX_access_grants_granted_by").on(table.grantedBy),
  index("IDX_access_grants_expires_at").on(table.expiresAt),
  index("IDX_access_grants_is_active").on(table.isActive),
]);

// Teams/Groups for bulk sharing
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("IDX_teams_owner_id").on(table.ownerId),
  index("IDX_teams_is_active").on(table.isActive),
  index("IDX_teams_created_at").on(table.createdAt),
]);

// Team Members
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role").default('member'), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("IDX_team_members_team_id").on(table.teamId),
  index("IDX_team_members_user_id").on(table.userId),
  index("IDX_team_members_role").on(table.role),
]);

// Share Invitations
export const shareInvites = pgTable("share_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  inviterUserId: varchar("inviter_user_id").references(() => users.id),
  inviteeEmail: varchar("invitee_email").notNull(),
  permissions: varchar("permissions").array().notNull(),
  token: varchar("token").notNull().unique(),
  status: varchar("status").default('pending'), // 'pending', 'accepted', 'declined', 'expired'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_share_invites_resource_type_id").on(table.resourceType, table.resourceId),
  index("IDX_share_invites_inviter_user_id").on(table.inviterUserId),
  index("IDX_share_invites_invitee_email").on(table.inviteeEmail),
  index("IDX_share_invites_status").on(table.status),
  index("IDX_share_invites_expires_at").on(table.expiresAt),
]);

// Share Links for public/link-based sharing
export const shareLinks = pgTable("share_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  token: varchar("token").notNull().unique(),
  permissions: varchar("permissions").array().notNull(),
  accessCount: integer("access_count").default(0),
  maxAccessCount: integer("max_access_count"), // Optional limit
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===================
// GDPR Compliance Tables
// ===================
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
}, (table) => [
  index("IDX_user_consent_user_id").on(table.userId),
  index("IDX_user_consent_consent_type").on(table.consentType),
  index("IDX_user_consent_consent_date").on(table.consentDate),
  index("IDX_user_consent_withdrawn_at").on(table.withdrawnAt),
]);

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
}, (table) => [
  index("IDX_anonymous_consent_email").on(table.email),
  index("IDX_anonymous_consent_consent_type").on(table.consentType),
  index("IDX_anonymous_consent_linked_user_id").on(table.linkedUserId),
]);

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
}, (table) => [
  index("IDX_data_processing_log_user_id").on(table.userId),
  index("IDX_data_processing_log_action").on(table.action),
  index("IDX_data_processing_log_data_type").on(table.dataType),
  index("IDX_data_processing_log_timestamp").on(table.timestamp),
  index("IDX_data_processing_log_record_id").on(table.recordId),
]);

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
}, (table) => [
  index("IDX_auth_audit_log_user_id").on(table.userId),
  index("IDX_auth_audit_log_action").on(table.action),
  index("IDX_auth_audit_log_ip_address").on(table.ipAddress),
  index("IDX_auth_audit_log_success").on(table.success),
  index("IDX_auth_audit_log_timestamp").on(table.timestamp),
  index("IDX_auth_audit_log_risk_score").on(table.riskScore),
]);

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
}, (table) => [
  index("IDX_user_sessions_user_id").on(table.userId),
  index("IDX_user_sessions_is_active").on(table.isActive),
  index("IDX_user_sessions_expires_at").on(table.expiresAt),
  index("IDX_user_sessions_last_activity").on(table.lastActivity),
]);

// ===================
// OBJECT STORAGE TABLES
// ===================

// Object Storage Files - General file metadata tracking
export const objectStorageFiles = pgTable("object_storage_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(), // Original filename
  storagePath: text("storage_path").notNull().unique(), // Full Object Storage path
  fileType: varchar("file_type").notNull(), // csv, image, pdf, video, json, etc.
  contentType: varchar("content_type"), // MIME type
  fileSize: integer("file_size").notNull(),
  status: varchar("status").notNull().default("uploaded"), // uploaded, processing, completed, error, deleted
  tags: json("tags").default('[]'), // Array of tags for organization
  metadata: json("metadata"), // Additional file metadata
  isPublic: boolean("is_public").notNull().default(false),
  downloadCount: integer("download_count").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete for GDPR compliance
}, (table) => [
  index("IDX_object_storage_files_user_id").on(table.userId),
  index("IDX_object_storage_files_file_type").on(table.fileType),
  index("IDX_object_storage_files_status").on(table.status),
  index("IDX_object_storage_files_uploaded_at").on(table.uploadedAt),
  index("IDX_object_storage_files_is_public").on(table.isPublic),
]);

// User Storage Quotas and Usage Tracking
export const userStorageQuotas = pgTable("user_storage_quotas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  storageQuotaBytes: integer("storage_quota_bytes").notNull().default(1073741824), // 1GB default quota
  usedStorageBytes: integer("used_storage_bytes").notNull().default(0),
  fileCount: integer("file_count").notNull().default(0),
  csvFileCount: integer("csv_file_count").notNull().default(0),
  imageFileCount: integer("image_file_count").notNull().default(0),
  documentFileCount: integer("document_file_count").notNull().default(0),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  isOverQuota: boolean("is_over_quota").notNull().default(false),
  quotaWarningsSent: integer("quota_warnings_sent").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Storage Analytics for monitoring and optimization
export const storageAnalytics = pgTable("storage_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fileId: varchar("file_id").references(() => objectStorageFiles.id),
  eventType: varchar("event_type").notNull(), // upload, download, delete, share, access
  eventData: json("event_data"), // Additional event metadata
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  fileSize: integer("file_size"),
  processingTimeMs: integer("processing_time_ms"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// File Sharing and Permissions
export const fileSharing = pgTable("file_sharing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => objectStorageFiles.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  shareToken: varchar("share_token").notNull().unique(),
  shareType: varchar("share_type").notNull(), // public_link, specific_users, time_limited
  permissions: varchar("permissions").notNull().default("view_only"), // view_only, view_download, edit
  allowedUsers: json("allowed_users").default('[]'), // Array of user IDs for specific sharing
  maxDownloads: integer("max_downloads"), // null = unlimited
  downloadCount: integer("download_count").notNull().default(0),
  expiresAt: timestamp("expires_at"), // null = never expires
  isActive: boolean("is_active").notNull().default(true),
  accessLogs: json("access_logs").default('[]'), // Track access for security
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course Content Storage (extends existing course system)
export const courseContent = pgTable("course_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  fileId: varchar("file_id").notNull().references(() => objectStorageFiles.id),
  contentType: varchar("content_type").notNull(), // video, document, slides, code, quiz_material
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  accessLevel: varchar("access_level").notNull().default("enrolled"), // public, enrolled, premium
  duration: integer("duration"), // For videos/audio in seconds
  fileVersion: integer("file_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System Assets for generated content and application assets
export const systemAssets = pgTable("system_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetKey: varchar("asset_key").notNull().unique(), // Unique identifier for the asset
  fileId: varchar("file_id").notNull().references(() => objectStorageFiles.id),
  assetType: varchar("asset_type").notNull(), // icon, chart, export, backup, config
  assetCategory: varchar("asset_category"), // generated_icons, user_exports, system_backups
  isPublic: boolean("is_public").notNull().default(false),
  cacheExpiry: timestamp("cache_expiry"), // For caching optimization
  lastOptimized: timestamp("last_optimized"),
  optimizationData: json("optimization_data"), // Compression, resizing data
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// File Processing Queue for async operations
export const fileProcessingQueue = pgTable("file_processing_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => objectStorageFiles.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  processType: varchar("process_type").notNull(), // csv_analysis, image_optimization, video_transcoding
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, error
  priority: integer("priority").notNull().default(5), // 1-10, higher = more priority
  processingData: json("processing_data"), // Parameters for processing
  results: json("results"), // Processing results
  errorMessage: text("error_message"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  nextAttemptAt: timestamp("next_attempt_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===================
// MARKET DATA TABLES
// ===================

// Track market data downloads for user analytics and caching
export const marketDataDownloads = pgTable("market_data_downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: varchar("symbol").notNull(),
  startDate: varchar("start_date").notNull(), // YYYY-MM-DD format
  endDate: varchar("end_date").notNull(), // YYYY-MM-DD format
  interval: varchar("interval").notNull().default("1d"), // 1d, 1w, 1mo
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  filePath: varchar("file_path"), // Object storage path
  fileName: varchar("file_name").notNull(), // Original filename for download
  fileSize: integer("file_size"), // File size in bytes
  recordCount: integer("record_count"), // Number of data records
  downloadType: varchar("download_type").notNull().default("single"), // single, batch
  status: varchar("status").notNull().default("completed"), // pending, completed, error
  errorMessage: text("error_message"), // Error details if download failed
}, (table) => [
  index("IDX_market_data_downloads_user_id").on(table.userId),
  index("IDX_market_data_downloads_symbol").on(table.symbol),
  index("IDX_market_data_downloads_downloaded_at").on(table.downloadedAt),
  index("IDX_market_data_downloads_status").on(table.status),
]);

// Track popular symbols for caching and suggestions
export const popularSymbols = pgTable("popular_symbols", {
  symbol: varchar("symbol").primaryKey(),
  companyName: varchar("company_name"), // Company name for display
  downloadCount: integer("download_count").notNull().default(1),
  lastDownloaded: timestamp("last_downloaded").defaultNow().notNull(),
  avgFileSize: integer("avg_file_size"), // Average file size for this symbol
  isActive: boolean("is_active").notNull().default(true), // For symbol availability tracking
  sector: varchar("sector"), // Market sector for categorization
  marketCap: varchar("market_cap"), // Market cap category (large, mid, small)
}, (table) => [
  index("IDX_popular_symbols_download_count").on(table.downloadCount),
  index("IDX_popular_symbols_last_downloaded").on(table.lastDownloaded),
  index("IDX_popular_symbols_is_active").on(table.isActive),
  index("IDX_popular_symbols_sector").on(table.sector),
]);

// ===================
// BILLING AND PAYMENT TABLES
// ===================

// Payment Records Table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  paymentIntentId: varchar("payment_intent_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").default("usd"),
  status: varchar("status").notNull(), // succeeded, failed, pending
  productType: varchar("product_type").notNull(),
  productId: varchar("product_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_payments_user_id").on(table.userId),
  index("IDX_payments_status").on(table.status),
  index("IDX_payments_product_type").on(table.productType),
  index("IDX_payments_created_at").on(table.createdAt),
]);

// AutoML Job Records
export const automlJobs = pgTable("automl_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobName: varchar("job_name").notNull(),
  status: varchar("status").notNull(), // started, running, completed, failed
  sagemakerJobArn: varchar("sagemaker_job_arn"),
  resultsCsvUrl: varchar("results_csv_url"),
  cost: integer("cost"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("IDX_automl_jobs_user_id").on(table.userId),
  index("IDX_automl_jobs_status").on(table.status),
  index("IDX_automl_jobs_created_at").on(table.createdAt),
]);

// Permission Management Insert Schemas
export const insertAccessGrantSchema = createInsertSchema(accessGrants).omit({
  id: true,
  grantedAt: true,
}).extend({
  resourceType: z.enum(["csv", "course", "report", "user_content"]),
  principalType: z.enum(["user", "group", "link"]),
  permissions: z.array(z.enum(["view", "edit", "share", "delete"])),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
}).extend({
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const insertShareInviteSchema = createInsertSchema(shareInvites).omit({
  id: true,
  createdAt: true,
  token: true, // Generated automatically
}).extend({
  resourceType: z.enum(["csv", "course", "report", "user_content"]),
  permissions: z.array(z.enum(["view", "edit", "share", "delete"])),
  status: z.enum(["pending", "accepted", "declined", "expired"]).default("pending"),
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({
  id: true,
  createdAt: true,
  token: true, // Generated automatically
  accessCount: true,
}).extend({
  resourceType: z.enum(["csv", "course", "report", "user_content"]),
  permissions: z.array(z.enum(["view", "edit", "share", "delete"])),
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

// Video course lesson system schemas
export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseMaterialSchema = createInsertSchema(courseMaterials).omit({
  id: true,
  createdAt: true,
  downloadCount: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastAccessedAt: true,
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

// Object Storage Insert Schemas
export const insertObjectStorageFileSchema = createInsertSchema(objectStorageFiles).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
  deletedAt: true,
}).extend({
  fileType: z.enum(["csv", "image", "pdf", "video", "audio", "json", "text", "document", "archive", "other"]),
  status: z.enum(["uploaded", "processing", "completed", "error", "deleted"]).default("uploaded"),
});

export const insertUserStorageQuotaSchema = createInsertSchema(userStorageQuotas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorageAnalyticsSchema = createInsertSchema(storageAnalytics).omit({
  id: true,
  timestamp: true,
}).extend({
  eventType: z.enum(["upload", "download", "delete", "share", "access", "process"]),
});

export const insertFileSharingSchema = createInsertSchema(fileSharing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  shareType: z.enum(["public_link", "specific_users", "time_limited"]),
  permissions: z.enum(["view_only", "view_download", "edit"]).default("view_only"),
});

export const insertCourseContentSchema = createInsertSchema(courseContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contentType: z.enum(["video", "document", "slides", "code", "quiz_material", "audio", "image"]),
  accessLevel: z.enum(["public", "enrolled", "premium"]).default("enrolled"),
});

export const insertSystemAssetSchema = createInsertSchema(systemAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  assetType: z.enum(["icon", "chart", "export", "backup", "config", "template", "cache"]),
});

export const insertFileProcessingQueueSchema = createInsertSchema(fileProcessingQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  processType: z.enum(["csv_analysis", "image_optimization", "video_transcoding", "pdf_processing", "backup_creation"]),
  status: z.enum(["pending", "processing", "completed", "error", "cancelled"]).default("pending"),
  priority: z.number().min(1).max(10).default(5),
});

// Market Data Insert Schemas
export const insertMarketDataDownloadSchema = createInsertSchema(marketDataDownloads).omit({
  id: true,
  downloadedAt: true,
}).extend({
  interval: z.enum(["1d", "1w", "1mo"]).default("1d"),
  downloadType: z.enum(["single", "batch"]).default("single"),
  status: z.enum(["pending", "completed", "error"]).default("completed"),
});

export const insertPopularSymbolSchema = createInsertSchema(popularSymbols).omit({
  lastDownloaded: true,
}).extend({
  downloadCount: z.number().min(1).default(1),
  marketCap: z.enum(["large", "mid", "small"]).optional(),
});

// Billing and Payment Insert Schemas
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["succeeded", "failed", "pending"]),
  productType: z.enum(["course", "subscription_monthly", "subscription_yearly", "automl_usage"]),
  currency: z.string().default("usd"),
});

export const insertAutoMLJobSchema = createInsertSchema(automlJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  status: z.enum(["started", "running", "completed", "failed"]),
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
// Video course lesson system types
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertCourseMaterial = z.infer<typeof insertCourseMaterialSchema>;
export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
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

// Object Storage Types
export type InsertObjectStorageFile = z.infer<typeof insertObjectStorageFileSchema>;
export type ObjectStorageFile = typeof objectStorageFiles.$inferSelect;
export type InsertUserStorageQuota = z.infer<typeof insertUserStorageQuotaSchema>;
export type UserStorageQuota = typeof userStorageQuotas.$inferSelect;
export type InsertStorageAnalytics = z.infer<typeof insertStorageAnalyticsSchema>;
export type StorageAnalytics = typeof storageAnalytics.$inferSelect;
export type InsertFileSharing = z.infer<typeof insertFileSharingSchema>;
export type FileSharing = typeof fileSharing.$inferSelect;
export type InsertCourseContent = z.infer<typeof insertCourseContentSchema>;
export type CourseContent = typeof courseContent.$inferSelect;
export type InsertSystemAsset = z.infer<typeof insertSystemAssetSchema>;
export type SystemAsset = typeof systemAssets.$inferSelect;
export type InsertFileProcessingQueue = z.infer<typeof insertFileProcessingQueueSchema>;
export type FileProcessingQueue = typeof fileProcessingQueue.$inferSelect;

// Market Data Type Exports
export type InsertMarketDataDownload = z.infer<typeof insertMarketDataDownloadSchema>;
export type MarketDataDownload = typeof marketDataDownloads.$inferSelect;
export type InsertPopularSymbol = z.infer<typeof insertPopularSymbolSchema>;
export type PopularSymbol = typeof popularSymbols.$inferSelect;

// Billing and Payment Type Exports
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertAutoMLJob = z.infer<typeof insertAutoMLJobSchema>;
export type AutoMLJob = typeof automlJobs.$inferSelect;

// Permission Management Enums for type safety
export const RESOURCE_TYPES = ["csv", "course", "report", "user_content"] as const;
export const PRINCIPAL_TYPES = ["user", "group", "link"] as const;
export const PERMISSIONS = ["view", "edit", "share", "delete"] as const;
export const TEAM_ROLES = ["owner", "admin", "member"] as const;
export const INVITE_STATUSES = ["pending", "accepted", "declined", "expired"] as const;

// GDPR Enums for type safety
export const CONSENT_TYPES = ["marketing", "analytics", "essential", "cookies", "data_processing"] as const;
export const LEGAL_BASIS = ["contract", "consent", "legitimate_interest", "vital_interests", "public_task", "legal_obligation"] as const;
export const PROCESSING_ACTIONS = ["access", "modify", "export", "delete", "create", "share"] as const;
export const DATA_TYPES = ["profile", "csv", "sharing", "course", "quiz", "support", "consent"] as const;
export const PROCESSING_PURPOSES = ["service_provision", "analytics", "marketing", "support", "compliance", "security"] as const;

// Object Storage Enums for type safety
export const FILE_TYPES = ["csv", "image", "pdf", "video", "audio", "json", "text", "document", "archive", "other"] as const;
export const FILE_STATUSES = ["uploaded", "processing", "completed", "error", "deleted"] as const;
export const STORAGE_EVENT_TYPES = ["upload", "download", "delete", "share", "access", "process"] as const;
export const SHARE_TYPES = ["public_link", "specific_users", "time_limited"] as const;
export const SHARE_PERMISSIONS = ["view_only", "view_download", "edit"] as const;
export const CONTENT_TYPES = ["video", "document", "slides", "code", "quiz_material", "audio", "image"] as const;
export const ACCESS_LEVELS = ["public", "enrolled", "premium"] as const;
export const ASSET_TYPES = ["icon", "chart", "export", "backup", "config", "template", "cache"] as const;
export const PROCESS_TYPES = ["csv_analysis", "image_optimization", "video_transcoding", "pdf_processing", "backup_creation"] as const;
export const PROCESS_STATUSES = ["pending", "processing", "completed", "error", "cancelled"] as const;

// Permission Management Type Exports
export type InsertAccessGrant = z.infer<typeof insertAccessGrantSchema>;
export type AccessGrant = typeof accessGrants.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertShareInvite = z.infer<typeof insertShareInviteSchema>;
export type ShareInvite = typeof shareInvites.$inferSelect;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;
export type ShareLink = typeof shareLinks.$inferSelect;

export type ResourceType = typeof RESOURCE_TYPES[number];
export type PrincipalType = typeof PRINCIPAL_TYPES[number];
export type Permission = typeof PERMISSIONS[number];
export type TeamRole = typeof TEAM_ROLES[number];
export type InviteStatus = typeof INVITE_STATUSES[number];

export type ConsentType = typeof CONSENT_TYPES[number];
export type LegalBasis = typeof LEGAL_BASIS[number];
export type ProcessingAction = typeof PROCESSING_ACTIONS[number];
export type DataType = typeof DATA_TYPES[number];
export type ProcessingPurpose = typeof PROCESSING_PURPOSES[number];

// Object Storage Type Exports
export type FileType = typeof FILE_TYPES[number];
export type FileStatus = typeof FILE_STATUSES[number];
export type StorageEventType = typeof STORAGE_EVENT_TYPES[number];
export type ShareType = typeof SHARE_TYPES[number];
export type SharePermission = typeof SHARE_PERMISSIONS[number];
export type ContentType = typeof CONTENT_TYPES[number];
export type AccessLevel = typeof ACCESS_LEVELS[number];
export type AssetType = typeof ASSET_TYPES[number];
export type ProcessType = typeof PROCESS_TYPES[number];
export type ProcessStatus = typeof PROCESS_STATUSES[number];

// ===========================================
// COMPREHENSIVE EMAIL NOTIFICATIONS SYSTEM TABLES
// Following Architect's Strategic Design
// ===========================================

// Notification Templates (reusable email templates)
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'price_alert', 'scheduled', 'excel_report', 'crash_report'
  name: varchar("name").notNull(),
  subject: text("subject").notNull(),
  htmlTemplate: text("html_template").notNull(),
  textTemplate: text("text_template"),
  variables: json("variables").default('[]'), // Array of template variables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_notification_templates_type").on(table.type),
  index("IDX_notification_templates_is_active").on(table.isActive),
  index("IDX_notification_templates_created_at").on(table.createdAt),
]);

// Alert Rules (user-configurable conditions)
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'price_crossing', 'percentile_threshold', 'volume_spike'
  ticker: varchar("ticker").notNull(),
  conditions: json("conditions").notNull(), // Dynamic conditions based on type
  isActive: boolean("is_active").default(true),
  triggerCount: integer("trigger_count").default(0),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_alert_rules_user_id").on(table.userId),
  index("IDX_alert_rules_ticker").on(table.ticker),
  index("IDX_alert_rules_type").on(table.type),
  index("IDX_alert_rules_is_active").on(table.isActive),
  index("IDX_alert_rules_last_triggered").on(table.lastTriggered),
  index("IDX_alert_rules_created_at").on(table.createdAt),
]);

// Alert Subscriptions (user to rule mapping with channels)
export const alertSubscriptions = pgTable("alert_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  alertRuleId: varchar("alert_rule_id").notNull().references(() => alertRules.id),
  channel: varchar("channel").notNull().default("email"), // 'email', 'sms', 'webhook'
  schedule: json("schedule"), // Timing preferences, frequency limits
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_alert_subscriptions_user_id").on(table.userId),
  index("IDX_alert_subscriptions_alert_rule_id").on(table.alertRuleId),
  index("IDX_alert_subscriptions_channel").on(table.channel),
  index("IDX_alert_subscriptions_is_active").on(table.isActive),
  index("IDX_alert_subscriptions_created_at").on(table.createdAt),
]);

// Notification Queue (pending jobs with payload + status)
export const notificationQueue = pgTable("notification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => notificationTemplates.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  recipient: varchar("recipient").notNull(), // Email address
  payload: json("payload").notNull(), // Template variables and data
  status: varchar("status").default("pending"), // 'pending', 'processing', 'sent', 'failed', 'cancelled'
  priority: integer("priority").default(0), // Higher numbers = higher priority
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  errorMessage: text("error_message"),
  metadata: json("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_notification_queue_user_id").on(table.userId),
  index("IDX_notification_queue_template_id").on(table.templateId),
  index("IDX_notification_queue_status").on(table.status),
  index("IDX_notification_queue_priority").on(table.priority),
  index("IDX_notification_queue_scheduled_at").on(table.scheduledAt),
  index("IDX_notification_queue_created_at").on(table.createdAt),
]);

// Notification Events (history/audit trail)
export const notificationEvents = pgTable("notification_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").references(() => notificationQueue.id),
  event: varchar("event").notNull(), // 'created', 'processing', 'sent', 'failed', 'opened', 'clicked'
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow(),
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
}, (table) => [
  index("IDX_notification_events_notification_id").on(table.notificationId),
  index("IDX_notification_events_event").on(table.event),
  index("IDX_notification_events_timestamp").on(table.timestamp),
]);

// Admin Approvals (state machine for pending alerts/reports)
export const adminApprovals = pgTable("admin_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: varchar("resource_type").notNull(), // 'alert_rule', 'scheduled_notification', 'excel_report'
  resourceId: varchar("resource_id").notNull(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected', 'expired'
  requestDetails: json("request_details").notNull(),
  reviewNotes: text("review_notes"),
  autoApprove: boolean("auto_approve").default(false),
  expiresAt: timestamp("expires_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_admin_approvals_resource_type").on(table.resourceType),
  index("IDX_admin_approvals_resource_id").on(table.resourceId),
  index("IDX_admin_approvals_requester_id").on(table.requesterId),
  index("IDX_admin_approvals_reviewer_id").on(table.reviewerId),
  index("IDX_admin_approvals_status").on(table.status),
  index("IDX_admin_approvals_expires_at").on(table.expiresAt),
  index("IDX_admin_approvals_created_at").on(table.createdAt),
]);

// Crash Reports (for diagnostics)
export const crashReports = pgTable("crash_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionHash: varchar("session_hash"), // Hashed session ID to protect PII
  errorType: varchar("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  userAgent: varchar("user_agent"),
  url: varchar("url"),
  userId: varchar("user_id").references(() => users.id),
  metadata: json("metadata"),
  resolved: boolean("resolved").default(false),
  reportedAt: timestamp("reported_at").defaultNow(),
}, (table) => [
  index("IDX_crash_reports_user_id").on(table.userId),
  index("IDX_crash_reports_error_type").on(table.errorType),
  index("IDX_crash_reports_resolved").on(table.resolved),
  index("IDX_crash_reports_reported_at").on(table.reportedAt),
]);

// Market Data Cache (for efficient alert processing) - Enhanced
export const marketDataCache = pgTable("market_data_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: varchar("ticker").notNull().unique(),
  currentPrice: real("current_price").notNull(),
  previousClose: real("previous_close"),
  dayHigh: real("day_high"),
  dayLow: real("day_low"),
  volume: integer("volume"),
  percentileData: json("percentile_data"), // P1-P99 calculations
  priceHistory: json("price_history"), // Recent price array for analysis
  lastUpdated: timestamp("last_updated").defaultNow(),
  isValid: boolean("is_valid").default(true),
  fetchErrorCount: integer("fetch_error_count").default(0),
}, (table) => [
  index("IDX_market_data_cache_ticker").on(table.ticker),
  index("IDX_market_data_cache_last_updated").on(table.lastUpdated),
  index("IDX_market_data_cache_is_valid").on(table.isValid),
  index("IDX_market_data_cache_fetch_error_count").on(table.fetchErrorCount),
]);

// ===========================================
// COMPREHENSIVE NOTIFICATION SYSTEM SCHEMAS & TYPES
// ===========================================

// Notification Template Schemas
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSubscriptionSchema = createInsertSchema(alertSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationEventSchema = createInsertSchema(notificationEvents).omit({
  id: true,
  timestamp: true,
});

export const insertAdminApprovalSchema = createInsertSchema(adminApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertCrashReportSchema = createInsertSchema(crashReports).omit({
  id: true,
  reportedAt: true,
});

export const insertMarketDataCacheSchema = createInsertSchema(marketDataCache).omit({
  id: true,
  lastUpdated: true,
});

// Comprehensive Notification Type Exports
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertSubscription = z.infer<typeof insertAlertSubscriptionSchema>;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationEvent = z.infer<typeof insertNotificationEventSchema>;
export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type InsertAdminApproval = z.infer<typeof insertAdminApprovalSchema>;
export type AdminApproval = typeof adminApprovals.$inferSelect;
export type InsertCrashReport = z.infer<typeof insertCrashReportSchema>;
export type CrashReport = typeof crashReports.$inferSelect;
export type InsertMarketDataCache = z.infer<typeof insertMarketDataCacheSchema>;
export type MarketDataCache = typeof marketDataCache.$inferSelect;

// Comprehensive Notification Constants
export const NOTIFICATION_TEMPLATE_TYPES = ["price_alert", "scheduled", "excel_report", "crash_report"] as const;
export const ALERT_RULE_TYPES = ["price_crossing", "percentile_threshold", "volume_spike"] as const;
export const NOTIFICATION_CHANNELS = ["email", "sms", "webhook"] as const;
export const NOTIFICATION_QUEUE_STATUSES = ["pending", "processing", "sent", "failed", "cancelled"] as const;
export const NOTIFICATION_EVENTS = ["created", "processing", "sent", "failed", "opened", "clicked"] as const;
export const ADMIN_APPROVAL_STATUSES = ["pending", "approved", "rejected", "expired"] as const;
export const ADMIN_APPROVAL_RESOURCE_TYPES = ["alert_rule", "scheduled_notification", "excel_report"] as const;

export type NotificationTemplateType = typeof NOTIFICATION_TEMPLATE_TYPES[number];
export type AlertRuleType = typeof ALERT_RULE_TYPES[number];
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];
export type NotificationQueueStatus = typeof NOTIFICATION_QUEUE_STATUSES[number];
export type NotificationEventType = typeof NOTIFICATION_EVENTS[number];
export type AdminApprovalStatus = typeof ADMIN_APPROVAL_STATUSES[number];
export type AdminApprovalResourceType = typeof ADMIN_APPROVAL_RESOURCE_TYPES[number];
