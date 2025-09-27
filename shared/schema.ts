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

// ===================
// COMPREHENSIVE QUIZ SYSTEM TABLES
// ===================

// Enhanced Quizzes - Comprehensive quiz configuration
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: 'cascade' }), // Optional: quiz linked to specific lesson
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"), // Detailed instructions for students
  timeLimit: integer("time_limit"), // Time limit in minutes (null = no limit)
  passingScore: integer("passing_score").notNull().default(70), // Percentage required to pass
  maxAttempts: integer("max_attempts").default(3), // Maximum attempts allowed (null = unlimited)
  shuffleQuestions: boolean("shuffle_questions").default(false), // Randomize question order
  shuffleAnswers: boolean("shuffle_answers").default(false), // Randomize answer order
  showResults: boolean("show_results").default(true), // Show results after completion
  showCorrectAnswers: boolean("show_correct_answers").default(true), // Show correct answers in results
  allowBackNavigation: boolean("allow_back_navigation").default(true), // Allow going back to previous questions
  requireAllQuestions: boolean("require_all_questions").default(true), // Must answer all questions
  isActive: boolean("is_active").default(true),
  availableFrom: timestamp("available_from"), // When quiz becomes available
  availableUntil: timestamp("available_until"), // When quiz expires
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_quizzes_course_id").on(table.courseId),
  index("IDX_quizzes_lesson_id").on(table.lessonId),
  index("IDX_quizzes_is_active").on(table.isActive),
  index("IDX_quizzes_available_from").on(table.availableFrom),
  index("IDX_quizzes_available_until").on(table.availableUntil),
  index("IDX_quizzes_created_by").on(table.createdBy),
  index("IDX_quizzes_created_at").on(table.createdAt),
]);

// Questions - Individual quiz questions
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // 'multiple_choice', 'true_false', 'short_answer', 'essay'
  question: text("question").notNull(),
  explanation: text("explanation"), // Explanation shown after answering
  order: integer("order").notNull(), // Question order within quiz
  points: integer("points").default(1), // Points awarded for correct answer
  required: boolean("required").default(true), // Must be answered
  metadata: json("metadata"), // Additional question-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_questions_quiz_id").on(table.quizId),
  index("IDX_questions_type").on(table.type),
  index("IDX_questions_order").on(table.order),
  index("IDX_questions_created_at").on(table.createdAt),
]);

// Question Options - Answer choices for multiple choice questions
export const questionOptions = pgTable("question_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: 'cascade' }),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  order: integer("order").notNull(), // Option order within question
  explanation: text("explanation"), // Explanation for why this option is correct/incorrect
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_question_options_question_id").on(table.questionId),
  index("IDX_question_options_is_correct").on(table.isCorrect),
  index("IDX_question_options_order").on(table.order),
  index("IDX_question_options_created_at").on(table.createdAt),
]);

// Quiz Attempts - Track individual quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  attemptNumber: integer("attempt_number").notNull(), // 1st attempt, 2nd attempt, etc.
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"), // When quiz was completed/submitted
  timeSpent: integer("time_spent"), // Total time in seconds
  score: real("score"), // Final score (percentage)
  pointsEarned: integer("points_earned").default(0), // Total points earned
  totalPoints: integer("total_points").default(0), // Total possible points
  passed: boolean("passed").default(false), // Whether attempt passed
  status: varchar("status").default("in_progress"), // 'in_progress', 'completed', 'abandoned'
  submittedAt: timestamp("submitted_at"), // When final submission occurred
  metadata: json("metadata"), // Additional attempt data (browser info, etc.)
  ipAddress: varchar("ip_address"), // IP address for security
  userAgent: text("user_agent"), // Browser info for security
}, (table) => [
  index("IDX_quiz_attempts_user_id").on(table.userId),
  index("IDX_quiz_attempts_quiz_id").on(table.quizId),
  index("IDX_quiz_attempts_status").on(table.status),
  index("IDX_quiz_attempts_passed").on(table.passed),
  index("IDX_quiz_attempts_start_time").on(table.startTime),
  index("IDX_quiz_attempts_submitted_at").on(table.submittedAt),
  // Composite index for user quiz attempts
  index("IDX_quiz_attempts_user_quiz").on(table.userId, table.quizId),
]);

// Question Responses - Individual responses to questions
export const questionResponses = pgTable("question_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: 'cascade' }),
  response: text("response"), // User's response (text for short answer, option ID for multiple choice)
  selectedOptionId: varchar("selected_option_id").references(() => questionOptions.id), // For multiple choice
  isCorrect: boolean("is_correct"), // Whether response is correct (null for manual grading)
  pointsEarned: integer("points_earned").default(0), // Points earned for this response
  timeSpent: integer("time_spent"), // Time spent on this question in seconds
  responseOrder: integer("response_order"), // Order in which question was answered
  flaggedForReview: boolean("flagged_for_review").default(false), // Student flagged for review
  manualGrade: integer("manual_grade"), // Manual grade for essay/short answer questions
  manualFeedback: text("manual_feedback"), // Manual feedback from instructor
  gradedBy: varchar("graded_by").references(() => users.id), // Who graded manually
  gradedAt: timestamp("graded_at"), // When manual grading occurred
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_question_responses_attempt_id").on(table.attemptId),
  index("IDX_question_responses_question_id").on(table.questionId),
  index("IDX_question_responses_is_correct").on(table.isCorrect),
  index("IDX_question_responses_flagged_for_review").on(table.flaggedForReview),
  index("IDX_question_responses_graded_by").on(table.gradedBy),
  index("IDX_question_responses_answered_at").on(table.answeredAt),
]);

// Certificates - Generated certificates for passed quizzes
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  attemptId: varchar("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  certificateNumber: varchar("certificate_number").notNull().unique(), // Unique certificate identifier
  studentName: text("student_name").notNull(), // Student name at time of certification
  courseName: text("course_name").notNull(), // Course name at time of certification
  quizName: text("quiz_name").notNull(), // Quiz name at time of certification
  score: real("score").notNull(), // Final score achieved
  completionDate: timestamp("completion_date").notNull(), // Date quiz was completed
  pdfUrl: text("pdf_url"), // URL to generated PDF certificate
  pdfPath: text("pdf_path"), // Object storage path to PDF
  digitalSignature: text("digital_signature"), // Digital signature for verification
  verificationCode: varchar("verification_code").notNull().unique(), // Code for certificate verification
  isValid: boolean("is_valid").default(true), // Certificate validity status
  downloadCount: integer("download_count").default(0), // Number of times downloaded
  sharedCount: integer("shared_count").default(0), // Number of times shared
  metadata: json("metadata"), // Additional certificate data
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"), // Last time certificate was viewed
}, (table) => [
  index("IDX_certificates_user_id").on(table.userId),
  index("IDX_certificates_quiz_id").on(table.quizId),
  index("IDX_certificates_course_id").on(table.courseId),
  index("IDX_certificates_attempt_id").on(table.attemptId),
  index("IDX_certificates_is_valid").on(table.isValid),
  index("IDX_certificates_completion_date").on(table.completionDate),
  index("IDX_certificates_generated_at").on(table.generatedAt),
  // Composite index for user certificates
  index("IDX_certificates_user_course").on(table.userId, table.courseId),
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

// Course Materials - Comprehensive content support for courses and lessons
export const courseMaterials = pgTable("course_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'cascade' }), // Some materials may be course-wide
  title: text("title").notNull(),
  description: text("description"),
  // Expanded content type support
  type: text("type").notNull(), // document, presentation, spreadsheet, image, audio, video, archive, code, ebook, design
  fileExtension: text("file_extension").notNull(), // pdf, docx, pptx, xlsx, png, mp3, mp4, zip, js, epub, psd, etc.
  category: text("category"), // learning_material, assignment, reference, template, example
  downloadUrl: text("download_url").notNull(), // Object storage download URL
  objectStoragePath: text("object_storage_path").notNull(),
  
  // Enhanced file metadata
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(),
  checksum: text("checksum"), // File integrity verification
  
  // Content organization and management
  order: integer("order").default(0), // Content ordering within lesson/course
  isRequired: boolean("is_required").default(false), // Required for lesson completion
  isPreviewable: boolean("is_previewable").default(false), // Can be previewed without download
  tags: text("tags").array(), // Content tags for organization
  
  // Version and access control
  version: integer("version").default(1), // Content versioning
  isActive: boolean("is_active").default(true), // Content visibility
  accessLevel: text("access_level").default("enrolled"), // enrolled, preview, free
  
  // Usage tracking and analytics
  downloadCount: integer("download_count").default(0),
  viewCount: integer("view_count").default(0), // For previewable content
  lastAccessedAt: timestamp("last_accessed_at"),
  
  // Additional metadata for different content types
  metadata: json("metadata"), // Type-specific metadata (duration for audio/video, page count for docs, etc.)
  thumbnailUrl: text("thumbnail_url"), // Preview thumbnail for images/videos/documents
  previewUrl: text("preview_url"), // Preview version (lower quality/watermarked)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_course_materials_lesson_id").on(table.lessonId),
  index("IDX_course_materials_course_id").on(table.courseId),
  index("IDX_course_materials_type").on(table.type),
  index("IDX_course_materials_file_extension").on(table.fileExtension),
  index("IDX_course_materials_category").on(table.category),
  index("IDX_course_materials_is_required").on(table.isRequired),
  index("IDX_course_materials_is_active").on(table.isActive),
  index("IDX_course_materials_access_level").on(table.accessLevel),
  index("IDX_course_materials_order").on(table.order),
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
  updatedAt: true,
  downloadCount: true,
  viewCount: true,
  lastAccessedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastAccessedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
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
// Note: New comprehensive quiz types are defined in the quiz system section above
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
// COMPREHENSIVE AI CHAT SYSTEM TABLES
// ===========================================

// Chat Sessions - Manage conversation sessions with context awareness
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull().default("New Chat"),
  contextType: text("context_type").notNull().default("general"), // course, quiz, lesson, general
  contextId: varchar("context_id"), // courseId, lessonId, quizId when contextType is not general
  isActive: boolean("is_active").notNull().default(true),
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  metadata: json("metadata"), // Additional context data, user preferences, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_chat_sessions_user_id").on(table.userId),
  index("IDX_chat_sessions_context_type").on(table.contextType),
  index("IDX_chat_sessions_context_id").on(table.contextId),
  index("IDX_chat_sessions_is_active").on(table.isActive),
  index("IDX_chat_sessions_created_at").on(table.createdAt),
  index("IDX_chat_sessions_last_message_at").on(table.lastMessageAt),
]);

// Chat Messages - Individual messages within chat sessions
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  contentType: text("content_type").default("text"), // text, markdown, code, image_url
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  // Context and learning assistance metadata
  courseContext: json("course_context"), // Course info, lesson details, quiz context
  aiModelUsed: varchar("ai_model_used"), // Track which AI model generated the response
  promptTokens: integer("prompt_tokens"), // For usage tracking and optimization
  completionTokens: integer("completion_tokens"),
  responseTime: integer("response_time"), // Response generation time in milliseconds
  qualityScore: real("quality_score"), // AI response quality rating (0-1)
  userFeedback: integer("user_feedback"), // User feedback: -1 (negative), 0 (neutral), 1 (positive)
  metadata: json("metadata"), // Additional context, citations, suggested follow-ups
  editedAt: timestamp("edited_at"), // Track message edits
  isEdited: boolean("is_edited").default(false),
}, (table) => [
  index("IDX_chat_messages_session_id").on(table.sessionId),
  index("IDX_chat_messages_role").on(table.role),
  index("IDX_chat_messages_timestamp").on(table.timestamp),
  index("IDX_chat_messages_content_type").on(table.contentType),
  index("IDX_chat_messages_user_feedback").on(table.userFeedback),
  index("IDX_chat_messages_quality_score").on(table.qualityScore),
]);

// Chat Contexts - Store and manage contextual information for intelligent responses
export const chatContexts = pgTable("chat_contexts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  contextType: text("context_type").notNull(), // course, lesson, quiz, user_progress, learning_path
  contextId: varchar("context_id").notNull(), // The ID of the referenced entity
  priority: integer("priority").default(1), // Context priority for response generation (1-10)
  relevanceScore: real("relevance_score"), // How relevant this context is (0-1)
  lastUsedAt: timestamp("last_used_at"), // Track when context was last referenced
  // Rich contextual metadata for intelligent assistance
  metadata: json("metadata"), // Detailed context info: course content, progress, preferences
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_chat_contexts_session_id").on(table.sessionId),
  index("IDX_chat_contexts_type").on(table.contextType),
  index("IDX_chat_contexts_context_id").on(table.contextId),
  index("IDX_chat_contexts_priority").on(table.priority),
  index("IDX_chat_contexts_relevance_score").on(table.relevanceScore),
  index("IDX_chat_contexts_is_active").on(table.isActive),
  index("IDX_chat_contexts_last_used_at").on(table.lastUsedAt),
]);

// Chat Analytics - Track usage patterns and AI performance for optimization
export const chatAnalytics = pgTable("chat_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id").references(() => chatSessions.id, { onDelete: 'cascade' }),
  messageId: varchar("message_id").references(() => chatMessages.id, { onDelete: 'cascade' }),
  eventType: text("event_type").notNull(), // session_start, message_sent, feedback_given, export_request, etc.
  contextType: text("context_type"), // course, lesson, quiz, general
  contextId: varchar("context_id"),
  // Performance and usage metrics
  responseTime: integer("response_time"), // AI response time in milliseconds
  tokenUsage: integer("token_usage"), // Total tokens used
  successfulResponse: boolean("successful_response").default(true),
  errorType: text("error_type"), // Track error patterns
  userSatisfaction: integer("user_satisfaction"), // User rating (1-5)
  metadata: json("metadata"), // Additional analytics data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_chat_analytics_user_id").on(table.userId),
  index("IDX_chat_analytics_session_id").on(table.sessionId),
  index("IDX_chat_analytics_event_type").on(table.eventType),
  index("IDX_chat_analytics_context_type").on(table.contextType),
  index("IDX_chat_analytics_created_at").on(table.createdAt),
  index("IDX_chat_analytics_successful_response").on(table.successfulResponse),
  index("IDX_chat_analytics_user_satisfaction").on(table.userSatisfaction),
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

// ===========================================
// COMPREHENSIVE AI CHAT SYSTEM SCHEMAS & TYPES
// ===========================================

// Chat System Insert Schemas
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertChatContextSchema = createInsertSchema(chatContexts).omit({
  id: true,
  createdAt: true,
});

export const insertChatAnalyticsSchema = createInsertSchema(chatAnalytics).omit({
  id: true,
  createdAt: true,
});

// Chat System Type Exports
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatContext = z.infer<typeof insertChatContextSchema>;
export type ChatContext = typeof chatContexts.$inferSelect;
export type InsertChatAnalytics = z.infer<typeof insertChatAnalyticsSchema>;
export type ChatAnalytics = typeof chatAnalytics.$inferSelect;

// Chat System Constants
export const CHAT_ROLES = ["user", "assistant", "system"] as const;
export const CHAT_CONTEXT_TYPES = ["course", "lesson", "quiz", "user_progress", "learning_path", "general"] as const;
export const CHAT_CONTENT_TYPES = ["text", "markdown", "code", "image_url"] as const;
export const CHAT_EVENT_TYPES = ["session_start", "session_end", "message_sent", "feedback_given", "export_request", "context_switch"] as const;

export type ChatRole = typeof CHAT_ROLES[number];
export type ChatContextType = typeof CHAT_CONTEXT_TYPES[number];
export type ChatContentType = typeof CHAT_CONTENT_TYPES[number];
export type ChatEventType = typeof CHAT_EVENT_TYPES[number];

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

// ===========================================
// COMPREHENSIVE QUIZ SYSTEM SCHEMAS & TYPES
// ===========================================

// Quiz System Insert Schemas
export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({
  id: true,
  createdAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  startTime: true,
});

export const insertQuestionResponseSchema = createInsertSchema(questionResponses).omit({
  id: true,
  answeredAt: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  generatedAt: true,
});

// Quiz System Type Exports
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestionOption = z.infer<typeof insertQuestionOptionSchema>;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuestionResponse = z.infer<typeof insertQuestionResponseSchema>;
export type QuestionResponse = typeof questionResponses.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Quiz System Constants
export const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer", "essay"] as const;
export const QUIZ_ATTEMPT_STATUSES = ["in_progress", "completed", "abandoned"] as const;

export type QuestionType = typeof QUESTION_TYPES[number];
export type QuizAttemptStatus = typeof QUIZ_ATTEMPT_STATUSES[number];

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

// ===================
// PRODUCTIVITY TABLE SYSTEM - MONDAY.COM INSPIRED
// ===================

// Productivity Boards - Main containers for productivity items
export const productivityBoards = pgTable("productivity_boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  boardType: varchar("board_type").notNull().default("tasks"), // anomalies, patterns, tasks, general
  color: varchar("color").default("#037ffc"), // Board theme color
  isTemplate: boolean("is_template").default(false), // Whether this is a template board
  templateCategory: varchar("template_category"), // Category for template boards
  isPublic: boolean("is_public").default(false), // Public boards visible to all users
  settings: json("settings"), // Board-specific settings and preferences
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_productivity_boards_user_id").on(table.userId),
  index("IDX_productivity_boards_board_type").on(table.boardType),
  index("IDX_productivity_boards_is_template").on(table.isTemplate),
  index("IDX_productivity_boards_created_at").on(table.createdAt),
]);

// Productivity Items - Individual rows/items in boards
export const productivityItems = pgTable("productivity_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => productivityBoards.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  status: varchar("status").default("not_started"), // not_started, in_progress, completed, blocked, cancelled
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  assignedTo: varchar("assigned_to").references(() => users.id), // User assigned to this item
  createdBy: varchar("created_by").notNull().references(() => users.id),
  dueDate: timestamp("due_date"), // When this item is due
  completedAt: timestamp("completed_at"), // When this item was completed
  estimatedHours: real("estimated_hours"), // Estimated time to complete
  actualHours: real("actual_hours"), // Actual time spent
  tags: text("tags").array(), // Tags for categorization and filtering
  position: real("position").notNull().default(0), // Position for ordering items
  parentItemId: varchar("parent_item_id").references(() => productivityItems.id), // For sub-items
  sourceType: varchar("source_type"), // anomaly, pattern, manual, import
  sourceId: varchar("source_id"), // ID of source (e.g., anomaly ID, CSV upload ID)
  metadata: json("metadata"), // Additional item-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_productivity_items_board_id").on(table.boardId),
  index("IDX_productivity_items_status").on(table.status),
  index("IDX_productivity_items_priority").on(table.priority),
  index("IDX_productivity_items_assigned_to").on(table.assignedTo),
  index("IDX_productivity_items_created_by").on(table.createdBy),
  index("IDX_productivity_items_due_date").on(table.dueDate),
  index("IDX_productivity_items_position").on(table.position),
  index("IDX_productivity_items_parent").on(table.parentItemId),
  index("IDX_productivity_items_source").on(table.sourceType, table.sourceId),
  index("IDX_productivity_items_created_at").on(table.createdAt),
]);

// Item Columns - Dynamic column definitions for boards
export const itemColumns = pgTable("item_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => productivityBoards.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: varchar("type").notNull(), // text, date, status, priority, timeline, numbers, people, dropdown, checkbox, rating, formula
  position: integer("position").notNull(), // Column order
  isRequired: boolean("is_required").default(false),
  isVisible: boolean("is_visible").default(true),
  width: integer("width").default(150), // Column width in pixels
  settings: json("settings"), // Column-specific settings (options for dropdown, formula, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_item_columns_board_id").on(table.boardId),
  index("IDX_item_columns_type").on(table.type),
  index("IDX_item_columns_position").on(table.position),
  index("IDX_item_columns_created_at").on(table.createdAt),
]);

// Column Values - Actual values for dynamic columns
export const columnValues = pgTable("column_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => productivityItems.id, { onDelete: 'cascade' }),
  columnId: varchar("column_id").notNull().references(() => itemColumns.id, { onDelete: 'cascade' }),
  value: text("value"), // String representation of the value
  metadata: json("metadata"), // Additional data for complex types (timeline, formula results, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_column_values_item_id").on(table.itemId),
  index("IDX_column_values_column_id").on(table.columnId),
  index("IDX_column_values_created_at").on(table.createdAt),
  // Composite index for efficient lookups
  index("IDX_column_values_item_column").on(table.itemId, table.columnId),
]);

// Productivity Notifications - Board-specific notifications and reminders
export const productivityNotifications = pgTable("productivity_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: varchar("item_id").references(() => productivityItems.id, { onDelete: 'cascade' }),
  boardId: varchar("board_id").references(() => productivityBoards.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // due_date, assignment, status_change, mention, reminder, overdue
  title: text("title").notNull(),
  message: text("message").notNull(),
  scheduledFor: timestamp("scheduled_for"), // When to send the notification
  sentAt: timestamp("sent_at"), // When notification was actually sent
  isRead: boolean("is_read").default(false),
  isActive: boolean("is_active").default(true),
  channel: varchar("channel").default("email"), // email, in_app, push
  metadata: json("metadata"), // Additional notification data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_productivity_notifications_user_id").on(table.userId),
  index("IDX_productivity_notifications_item_id").on(table.itemId),
  index("IDX_productivity_notifications_board_id").on(table.boardId),
  index("IDX_productivity_notifications_type").on(table.type),
  index("IDX_productivity_notifications_scheduled").on(table.scheduledFor),
  index("IDX_productivity_notifications_is_read").on(table.isRead),
  index("IDX_productivity_notifications_created_at").on(table.createdAt),
]);

// Productivity Reminders - Recurring reminders for items
export const productivityReminders = pgTable("productivity_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: varchar("item_id").notNull().references(() => productivityItems.id, { onDelete: 'cascade' }),
  reminderDate: timestamp("reminder_date").notNull(),
  frequency: varchar("frequency"), // once, daily, weekly, monthly, custom
  customSchedule: text("custom_schedule"), // Cron-like expression for custom frequencies
  isActive: boolean("is_active").default(true),
  lastSent: timestamp("last_sent"), // When this reminder was last sent
  nextScheduled: timestamp("next_scheduled"), // When this reminder is next scheduled
  message: text("message"), // Custom reminder message
  channel: varchar("channel").default("email"), // email, in_app, push
  metadata: json("metadata"), // Additional reminder configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_productivity_reminders_user_id").on(table.userId),
  index("IDX_productivity_reminders_item_id").on(table.itemId),
  index("IDX_productivity_reminders_reminder_date").on(table.reminderDate),
  index("IDX_productivity_reminders_is_active").on(table.isActive),
  index("IDX_productivity_reminders_next_scheduled").on(table.nextScheduled),
  index("IDX_productivity_reminders_created_at").on(table.createdAt),
]);

// Board Templates - Predefined board configurations
export const boardTemplates = pgTable("board_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // project_management, data_analysis, marketing, etc.
  icon: varchar("icon"), // Icon identifier
  boardConfig: json("board_config").notNull(), // Complete board configuration
  columnConfig: json("column_config").notNull(), // Default columns configuration
  isPublic: boolean("is_public").default(true), // Public templates available to all users
  createdBy: varchar("created_by").references(() => users.id),
  usageCount: integer("usage_count").default(0), // How many times this template was used
  rating: real("rating").default(0), // User rating for template
  tags: text("tags").array(), // Tags for template discovery
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_board_templates_category").on(table.category),
  index("IDX_board_templates_is_public").on(table.isPublic),
  index("IDX_board_templates_created_by").on(table.createdBy),
  index("IDX_board_templates_usage_count").on(table.usageCount),
  index("IDX_board_templates_rating").on(table.rating),
  index("IDX_board_templates_created_at").on(table.createdAt),
]);

// Board Automations - Workflow automation rules
export const boardAutomations = pgTable("board_automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => productivityBoards.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  trigger: json("trigger").notNull(), // Trigger conditions (when X happens)
  actions: json("actions").notNull(), // Actions to perform (do Y)
  conditions: json("conditions"), // Additional conditions to check
  lastTriggered: timestamp("last_triggered"), // When this automation last ran
  triggerCount: integer("trigger_count").default(0), // How many times this automation has run
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_board_automations_board_id").on(table.boardId),
  index("IDX_board_automations_is_active").on(table.isActive),
  index("IDX_board_automations_created_by").on(table.createdBy),
  index("IDX_board_automations_created_at").on(table.createdAt),
]);

// Activity Log - Track all changes and activities
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  boardId: varchar("board_id").references(() => productivityBoards.id, { onDelete: 'cascade' }),
  itemId: varchar("item_id").references(() => productivityItems.id, { onDelete: 'cascade' }),
  action: varchar("action").notNull(), // created, updated, deleted, assigned, completed, etc.
  entityType: varchar("entity_type").notNull(), // board, item, column, value, etc.
  entityId: varchar("entity_id").notNull(), // ID of the affected entity
  oldValue: json("old_value"), // Previous value (for updates)
  newValue: json("new_value"), // New value (for updates)
  description: text("description"), // Human-readable description of the change
  ipAddress: varchar("ip_address"), // IP address of the user
  userAgent: text("user_agent"), // Browser/client information
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_activity_log_user_id").on(table.userId),
  index("IDX_activity_log_board_id").on(table.boardId),
  index("IDX_activity_log_item_id").on(table.itemId),
  index("IDX_activity_log_action").on(table.action),
  index("IDX_activity_log_entity_type").on(table.entityType),
  index("IDX_activity_log_created_at").on(table.createdAt),
]);

// Productivity Board Insert Schemas
export const insertProductivityBoardSchema = createInsertSchema(productivityBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductivityItemSchema = createInsertSchema(productivityItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemColumnSchema = createInsertSchema(itemColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertColumnValueSchema = createInsertSchema(columnValues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductivityNotificationSchema = createInsertSchema(productivityNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertProductivityReminderSchema = createInsertSchema(productivityReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoardTemplateSchema = createInsertSchema(boardTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  rating: true,
});

export const insertBoardAutomationSchema = createInsertSchema(boardAutomations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggered: true,
  triggerCount: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

// Productivity Types
export type InsertProductivityBoard = z.infer<typeof insertProductivityBoardSchema>;
export type ProductivityBoard = typeof productivityBoards.$inferSelect;
export type InsertProductivityItem = z.infer<typeof insertProductivityItemSchema>;
export type ProductivityItem = typeof productivityItems.$inferSelect;
export type InsertItemColumn = z.infer<typeof insertItemColumnSchema>;
export type ItemColumn = typeof itemColumns.$inferSelect;
export type InsertColumnValue = z.infer<typeof insertColumnValueSchema>;
export type ColumnValue = typeof columnValues.$inferSelect;
export type InsertProductivityNotification = z.infer<typeof insertProductivityNotificationSchema>;
export type ProductivityNotification = typeof productivityNotifications.$inferSelect;
export type InsertProductivityReminder = z.infer<typeof insertProductivityReminderSchema>;
export type ProductivityReminder = typeof productivityReminders.$inferSelect;
export type InsertBoardTemplate = z.infer<typeof insertBoardTemplateSchema>;
export type BoardTemplate = typeof boardTemplates.$inferSelect;
export type InsertBoardAutomation = z.infer<typeof insertBoardAutomationSchema>;
export type BoardAutomation = typeof boardAutomations.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// Productivity Constants
export const BOARD_TYPES = ["anomalies", "patterns", "tasks", "general"] as const;
export const ITEM_STATUSES = ["not_started", "in_progress", "completed", "blocked", "cancelled"] as const;
export const ITEM_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const COLUMN_TYPES = ["text", "date", "status", "priority", "timeline", "numbers", "people", "dropdown", "checkbox", "rating", "formula"] as const;
export const NOTIFICATION_TYPES = ["due_date", "assignment", "status_change", "mention", "reminder", "overdue"] as const;
export const REMINDER_FREQUENCIES = ["once", "daily", "weekly", "monthly", "custom"] as const;
export const PRODUCTIVITY_NOTIFICATION_CHANNELS = ["email", "in_app", "push"] as const;
export const ACTIVITY_ACTIONS = ["created", "updated", "deleted", "assigned", "completed", "moved", "copied", "archived"] as const;
export const ENTITY_TYPES = ["board", "item", "column", "value", "automation", "template"] as const;

export type BoardType = typeof BOARD_TYPES[number];
export type ItemStatus = typeof ITEM_STATUSES[number];
export type ItemPriority = typeof ITEM_PRIORITIES[number];
export type ColumnType = typeof COLUMN_TYPES[number];
export type ProductivityNotificationType = typeof NOTIFICATION_TYPES[number];
export type ReminderFrequency = typeof REMINDER_FREQUENCIES[number];
export type ProductivityNotificationChannel = typeof PRODUCTIVITY_NOTIFICATION_CHANNELS[number];
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];
export type EntityType = typeof ENTITY_TYPES[number];
