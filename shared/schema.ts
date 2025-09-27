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
  ownerId: varchar("owner_id").references(() => users.id), // Track course ownership for permissions
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
});

// Teams/Groups for bulk sharing
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Team Members
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role").default('member'), // 'owner', 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

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
});

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
});

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
