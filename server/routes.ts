import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { checkDatabaseHealth, getPoolStatus } from "./db";
import { 
  insertSupportMessageSchema, 
  insertCsvUploadSchema, 
  insertAnomalySchema, 
  insertSharedResultSchema, 
  insertAnonymousConsentSchema,
  insertAccessGrantSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertShareInviteSchema,
  insertShareLinkSchema,
  // Comprehensive Quiz System Schemas
  insertQuizSchema,
  insertQuestionSchema,
  insertQuestionOptionSchema,
  insertQuizAttemptSchema,
  insertQuestionResponseSchema,
  insertCertificateSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerSecurityRoutes } from "./routes/security";
import OpenAI from "openai";
import * as XLSX from "xlsx";
import multer from "multer";
import Stripe from "stripe";
import { 
  uploadCsvFileServerSide, 
  deleteCsvFileServerSide, 
  getSignedDownloadURL, 
  parseCsvFileServerSide,
  generateCustomFirebaseToken,
  createOrUpdateFirebaseUser,
  verifyAndRefreshFirebaseToken 
} from "./firebase-admin";
import { objectStorage } from "./lib/object-storage";
import { marketDataService } from "./lib/market-data";
import { 
  requirePermission,
  requireOwnership,
  requireAnyPermission,
  allowShareLinkAccess,
  requireTeamPermission,
  requireSelfAccess,
  requireAdmin
} from "./middleware/permissions";
import { insertMarketDataDownloadSchema } from "@shared/schema";

// Missing webhook handler functions
async function handlePaymentSuccess(paymentIntent: any) {
  console.log('Payment success handler called for:', paymentIntent.id);
  // TODO: Implement payment success logic
}

async function handlePaymentFailure(failedPayment: any) {
  console.log('Payment failure handler called for:', failedPayment.id);
  // TODO: Implement payment failure logic
}

async function handleSubscriptionChange(subscription: any) {
  console.log('Subscription change handler called for:', subscription.id);
  // TODO: Implement subscription change logic
}

async function handleSubscriptionCancellation(deletedSub: any) {
  console.log('Subscription cancellation handler called for:', deletedSub.id);
  // TODO: Implement subscription cancellation logic
}

async function handleInvoicePayment(invoice: any) {
  console.log('Invoice payment handler called for:', invoice.id);
  // TODO: Implement invoice payment logic
}

async function handleInvoiceFailure(failedInvoice: any) {
  console.log('Invoice failure handler called for:', failedInvoice.id);
  // TODO: Implement invoice failure logic
}

// Missing AutoML functions
async function checkAutoMLAccess(user: any) {
  console.log('CheckAutoMLAccess called for user:', user?.id);
  return { 
    allowed: false, 
    message: "AutoML not implemented",
    reason: "Not implemented",
    needsPayment: false
  };
}

async function createAutoMLJob(user: any, jobData: any) {
  console.log('CreateAutoMLJob called with:', jobData);
  throw new Error("AutoML not implemented");
}

async function chargeAutoMLUsage(userId: string, cost: number) {
  console.log('ChargeAutoMLUsage called for user:', userId, 'cost:', cost);
  // TODO: Implement AutoML usage charging
}

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

// Initialize Stripe with error handling for missing API key
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }
} catch (error) {
  console.warn("Stripe initialization failed:", error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth middleware
  await setupAuth(app);
  
  // Register security routes
  registerSecurityRoutes(app);
  
  // Favicon route - serve with correct content type
  app.get('/favicon.png', express.static('public'));
  
  // Health check endpoints for Cloud Run deployment
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Root health check for load balancers and deployment systems
  app.get('/_health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Simple readiness probe
  app.get('/ready', (req, res) => {
    res.status(200).send('OK');
  });
  
  // Database health and monitoring endpoints
  app.get('/api/health/database', async (req, res) => {
    try {
      const health = await checkDatabaseHealth();
      const poolStatus = getPoolStatus();
      
      res.json({
        database: health,
        connectionPool: poolStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        database: { healthy: false, error: error.message },
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Database statistics endpoint for admin dashboard
  app.get('/api/admin/database/stats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getDatabaseStatistics();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Database performance metrics endpoint for admin dashboard
  app.get('/api/admin/database/performance', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const performance = await storage.getDatabasePerformanceMetrics();
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Database optimization endpoint for admin dashboard
  app.post('/api/admin/database/optimize', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const result = await storage.optimizeDatabase();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Database table analysis endpoint for admin dashboard
  app.get('/api/admin/database/analyze/:tableName?', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const tableName = req.params.tableName;
      const analysis = await storage.analyzeTablePerformance(tableName);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
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
        user.role,
        user.isApproved
      );

      // Generate custom Firebase token
      const tokenData = await generateCustomFirebaseToken(
        userId,
        userEmail,
        user.role,
        user.isApproved
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

  // Error reporting endpoint for crash reports
  app.post('/api/error-report', async (req, res) => {
    try {
      const { error, errorInfo, userAgent, url, timestamp } = req.body;
      
      // Extract user information if available
      const userId = req.user?.claims?.sub || 'anonymous';
      const userEmail = req.user?.claims?.email || 'unknown';
      
      // Log error for debugging
      console.error('Frontend Error Report:', {
        error,
        errorInfo,
        userAgent,
        url,
        timestamp,
        userId,
        userEmail
      });

      // TODO: Implement email notification to tamzid257@gmail.com when email service is available
      // For now, we'll log the error details comprehensively
      console.error('=== CRASH REPORT ===');
      console.error('User ID:', userId);
      console.error('User Email:', userEmail);
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Component Stack:', errorInfo?.componentStack);
      console.error('User Agent:', userAgent);
      console.error('URL:', url);
      console.error('Timestamp:', timestamp);
      console.error('Session ID:', req.sessionID);
      console.error('=== END CRASH REPORT ===');

      res.json({ success: true, message: 'Error report logged successfully' });
    } catch (reportError: any) {
      console.error('Failed to process error report:', reportError);
      res.status(500).json({ error: 'Failed to process error report' });
    }
  });

  // Secure payment intent endpoint with server-controlled pricing
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    const purchaseSchema = z.object({
      productId: z.string(),
      productType: z.enum(['course', 'subscription_monthly', 'subscription_yearly']),
    });

    const validation = purchaseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid request", 
        errors: validation.error.errors 
      });
    }

    const { productId, productType } = validation.data;

    try {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." 
        });
      }

      let amount: number;
      let description: string;

      // SERVER-CONTROLLED PRICING
      switch (productType) {
        case 'course':
          const course = await storage.getCourse(productId);
          if (!course) {
            return res.status(404).json({ message: "Course not found" });
          }
          amount = course.price || 9900;
          description = `Course: ${course.title}`;
          break;
        case 'subscription_monthly':
          amount = 2900; // $29/month
          description = "Premium Monthly Subscription";
          break;
        case 'subscription_yearly':
          amount = 29000; // $290/year (save $58)
          description = "Premium Yearly Subscription";
          break;
        default:
          return res.status(400).json({ message: "Invalid product type" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          userId: req.user.claims.sub,
          userEmail: req.user.claims.email,
          productId,
          productType
        },
        description
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount
      });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  app.post("/api/create-subscription", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." 
        });
      }

      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!userEmail) {
        return res.status(400).json({ message: "User email is required for subscription" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            return res.json({
              subscriptionId: subscription.id,
              clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
              status: subscription.status
            });
          }
        } catch (error) {
          // Subscription doesn't exist anymore, continue to create new one
          console.warn("Existing subscription not found, creating new one:", error);
        }
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
          metadata: {
            userId: userId
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // For now, we'll use a default price. In production, this should come from the request
      // or be configured based on the subscription plan
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          // This should be replaced with actual price ID from Stripe Dashboard
          // For now, we'll return an error asking for configuration
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Placeholder
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, {
        customerId,
        subscriptionId: subscription.id
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        status: subscription.status
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Error creating subscription: " + error.message 
      });
    }
  });

  // Comprehensive Webhook Integration - must be BEFORE express.json() middleware
  app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent ${paymentIntent.id} for $${paymentIntent.amount/100} succeeded!`);
          await handlePaymentSuccess(paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log(`PaymentIntent ${failedPayment.id} failed`);
          await handlePaymentFailure(failedPayment);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          console.log(`Subscription ${subscription.id} ${event.type}`);
          await handleSubscriptionChange(subscription);
          break;

        case 'customer.subscription.deleted':
          const deletedSub = event.data.object;
          console.log(`Subscription ${deletedSub.id} cancelled`);
          await handleSubscriptionCancellation(deletedSub);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          console.log(`Invoice ${invoice.id} payment succeeded`);
          await handleInvoicePayment(invoice);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          console.log(`Invoice ${failedInvoice.id} payment failed`);
          await handleInvoiceFailure(failedInvoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }

    res.json({received: true});
  });

  // Usage-based billing endpoint for AutoML jobs
  app.post("/api/automl/create-job", isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    
    // Check subscription status and credits
    const canUseAutoML = await checkAutoMLAccess(user);
    if (!canUseAutoML.allowed) {
      return res.status(403).json({ 
        message: canUseAutoML.reason,
        needsPayment: canUseAutoML.needsPayment 
      });
    }

    // Create AutoML job (implement AWS SageMaker integration)
    try {
      const jobId = await createAutoMLJob(req.body, req.user.claims.sub);
      
      // Deduct credits if on subscription
      if (user?.subscriptionStatus === 'active') {
        await storage.deductAutoMLCredits(req.user.claims.sub, 1);
      } else {
        // Charge per-use fee
        await chargeAutoMLUsage(req.user.claims.sub, 500); // $5.00 per job
      }

      res.json({ jobId, status: 'started' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Database performance monitoring endpoint
  app.get('/api/admin/database/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const performance = await storage.getDatabasePerformanceMetrics();
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  // ===================
  // COMPREHENSIVE QUIZ SYSTEM API ENDPOINTS
  // ===================

  // Quiz Management CRUD Operations
  app.get("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/:courseId/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getCourseQuizzes(req.params.courseId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lessons/:lessonId/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getLessonQuizzes(req.params.lessonId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/quizzes/:id/questions", async (req, res) => {
    try {
      const quiz = await storage.getQuizWithQuestions(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quizzes", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz({
        ...quizData,
        createdBy: req.user.claims.sub
      });
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/quizzes/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const updates = insertQuizSchema.partial().parse(req.body);
      const quiz = await storage.updateQuiz(req.params.id, updates);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/quizzes/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteQuiz(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quizzes/:id/publish", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const quiz = await storage.publishQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quizzes/:id/unpublish", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const quiz = await storage.unpublishQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quizzes/:id/duplicate", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required for duplication" });
      }
      const quiz = await storage.duplicateQuiz(req.params.id, title);
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Question Management
  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuizQuestions(req.params.quizId);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/questions", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/questions/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const updates = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(req.params.id, updates);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/questions/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteQuestion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/quizzes/:quizId/questions/reorder", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { questionOrders } = req.body;
      if (!Array.isArray(questionOrders)) {
        return res.status(400).json({ error: "questionOrders must be an array" });
      }
      await storage.reorderQuestions(req.params.quizId, questionOrders);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Question Options Management
  app.get("/api/questions/:questionId/options", async (req, res) => {
    try {
      const options = await storage.getQuestionOptions(req.params.questionId);
      res.json(options);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/question-options", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const optionData = insertQuestionOptionSchema.parse(req.body);
      const option = await storage.createQuestionOption(optionData);
      res.status(201).json(option);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/question-options/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const updates = insertQuestionOptionSchema.partial().parse(req.body);
      const option = await storage.updateQuestionOption(req.params.id, updates);
      if (!option) {
        return res.status(404).json({ error: "Question option not found" });
      }
      res.json(option);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/question-options/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteQuestionOption(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Question option not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quiz Attempt Management
  app.post("/api/quizzes/:id/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizId = req.params.id;

      // Check if user can attempt quiz
      const canAttempt = await storage.canUserAttemptQuiz(userId, quizId);
      if (!canAttempt.canAttempt) {
        return res.status(403).json({ 
          error: "Cannot start quiz attempt", 
          reason: canAttempt.reason,
          attemptsUsed: canAttempt.attemptsUsed,
          maxAttempts: canAttempt.maxAttempts
        });
      }

      // Check for existing active attempt
      const existingAttempt = await storage.getActiveQuizAttempt(userId, quizId);
      if (existingAttempt) {
        return res.json(existingAttempt);
      }

      // Create new attempt
      const attemptData = insertQuizAttemptSchema.parse({
        userId,
        quizId,
        attemptNumber: canAttempt.attemptsUsed + 1,
        status: "in_progress",
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { startedFrom: req.get('Origin') }
      });

      const attempt = await storage.startQuizAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/quiz-attempts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const attempt = await storage.getQuizAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }

      // Check if user owns this attempt or is admin
      const userId = req.user.claims.sub;
      const userRole = req.user.claims.role;
      if (attempt.userId !== userId && !['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(attempt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      const userRole = req.user.claims.role;

      // Check if user can access these attempts
      if (requestedUserId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const quizId = req.query.quizId as string;
      const attempts = await storage.getUserQuizAttempts(requestedUserId, quizId);
      res.json(attempts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quiz-attempts/:id/submit", isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = req.params.id;
      const userId = req.user.claims.sub;
      const { responses, timeSpent } = req.body;

      // Get attempt and verify ownership
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }
      if (attempt.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ error: "Quiz attempt is not in progress" });
      }

      // Process and calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      // Save all responses and calculate scores
      for (const response of responses) {
        const responseData = insertQuestionResponseSchema.parse({
          ...response,
          attemptId
        });
        await storage.saveQuestionResponse(responseData);
        
        if (response.isCorrect !== null) {
          totalPoints += response.pointsPossible || 1;
          earnedPoints += response.pointsEarned || 0;
        }
      }

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= (attempt.quiz.passingScore || 70);

      // Complete the attempt
      const completedAttempt = await storage.completeQuizAttempt(
        attemptId,
        new Date(),
        score,
        earnedPoints,
        passed
      );

      // Update course progress if quiz passed
      if (passed && attempt.quiz.courseId) {
        await storage.updateCourseProgressFromQuiz(userId, attempt.quiz.courseId, true);
      }

      // Generate certificate if passed
      if (passed) {
        const certificateData = insertCertificateSchema.parse({
          userId,
          quizId: attempt.quizId,
          courseId: attempt.quiz.courseId,
          attemptId,
          certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          studentName: `${req.user.claims.first_name} ${req.user.claims.last_name}`,
          courseName: attempt.quiz.course?.title || 'Course',
          quizName: attempt.quiz.title,
          score,
          completionDate: new Date(),
          verificationCode: Math.random().toString(36).substr(2, 16).toUpperCase(),
          digitalSignature: `${userId}-${attemptId}-${Date.now()}`,
          metadata: { generatedBy: 'system', version: '1.0' }
        });

        await storage.generateCertificate(certificateData);
      }

      res.json({
        attempt: completedAttempt,
        score,
        passed,
        earnedPoints,
        totalPoints,
        certificateGenerated: passed
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/quiz-attempts/:id/abandon", isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = req.params.id;
      const userId = req.user.claims.sub;

      // Verify ownership
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }
      if (attempt.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const abandonedAttempt = await storage.abandonQuizAttempt(attemptId);
      res.json(abandonedAttempt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Question Response Management and Auto-save
  app.post("/api/question-responses", isAuthenticated, async (req: any, res) => {
    try {
      const responseData = insertQuestionResponseSchema.parse(req.body);
      const response = await storage.saveQuestionResponse(responseData);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/quiz-attempts/:id/auto-save", isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = req.params.id;
      const userId = req.user.claims.sub;
      const { responses } = req.body;

      // Verify ownership
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt || attempt.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.autoSaveQuizProgress(attemptId, responses);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/quiz-attempts/:id/responses", isAuthenticated, async (req: any, res) => {
    try {
      const attemptId = req.params.id;
      const userId = req.user.claims.sub;

      // Verify ownership or admin access
      const attempt = await storage.getQuizAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }
      
      const userRole = req.user.claims.role;
      if (attempt.userId !== userId && !['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const responses = await storage.getAttemptResponses(attemptId);
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manual Grading for Essay and Short Answer Questions
  app.get("/api/responses/grading", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const quizId = req.query.quizId as string;
      const responses = await storage.getResponsesNeedingGrading(quizId);
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/responses/:id/grade", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { grade, feedback } = req.body;
      const gradedBy = req.user.claims.sub;
      
      const response = await storage.gradeResponse(req.params.id, grade, feedback, gradedBy);
      if (!response) {
        return res.status(404).json({ error: "Response not found" });
      }

      // Update attempt score after grading
      await storage.updateAttemptScoreAfterGrading(response.attemptId);

      res.json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/responses/bulk-grade", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { grades } = req.body;
      const gradedBy = req.user.claims.sub;

      if (!Array.isArray(grades)) {
        return res.status(400).json({ error: "grades must be an array" });
      }

      const gradedCount = await storage.bulkGradeResponses(grades, gradedBy);
      res.json({ gradedCount });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Certificate Management
  app.get("/api/certificates/:id", async (req, res) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/certificates", isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      const userRole = req.user.claims.role;

      // Check access permissions
      if (requestedUserId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const certificates = await storage.getUserCertificates(requestedUserId);
      res.json(certificates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/certificates/verify/:code", async (req, res) => {
    try {
      const certificate = await storage.verifyCertificate(req.params.code);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found or invalid" });
      }
      res.json(certificate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/certificates/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const download = await storage.downloadCertificate(req.params.id, userId);
      
      if (!download) {
        return res.status(404).json({ error: "Certificate not found or access denied" });
      }

      await storage.incrementCertificateDownload(req.params.id);
      res.json(download);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quiz Analytics and Reporting
  app.get("/api/quizzes/:id/analytics", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getQuizAnalytics(req.params.id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/:id/quiz-analytics", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getCourseQuizAnalytics(req.params.id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/quiz-performance", isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      const userRole = req.user.claims.role;

      // Check access permissions
      if (requestedUserId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const performance = await storage.getUserQuizPerformance(requestedUserId);
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/quiz-metrics", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getSystemQuizMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quiz Integration with Course Progress
  app.get("/api/courses/:courseId/required-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getRequiredQuizzesForCourse(req.params.courseId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/courses/:courseId/quiz-progress", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, courseId } = req.params;
      const currentUserId = req.user.claims.sub;
      const userRole = req.user.claims.role;

      // Check access permissions
      if (userId !== currentUserId && !['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const progress = await storage.getUserCourseQuizProgress(userId, courseId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lessons/:lessonId/quiz-requirements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requirements = await storage.checkQuizCompletionRequirements(userId, req.params.lessonId);
      res.json(requirements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================
  // COMPREHENSIVE VIDEO COURSE SYSTEM ENDPOINTS
  // ===================

  // Enhanced Course Management
  app.post("/api/courses", isAuthenticated, async (req: any, res) => {
    try {
      const course = await storage.createCourse({
        ...req.body,
        ownerId: req.user.claims.sub
      });
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/courses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const course = await storage.updateCourse(req.params.id, req.body);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/courses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteCourse(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/published", async (req, res) => {
    try {
      const courses = await storage.getPublishedCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const courses = await storage.searchCourses(query || "");
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/category/:category", async (req, res) => {
    try {
      const courses = await storage.getCoursesByCategory(req.params.category);
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lesson Management
  app.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getCourseLessons(req.params.courseId);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/courses/:courseId/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const lesson = await storage.createLesson({
        ...req.body,
        courseId: req.params.courseId
      });
      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const lesson = await storage.updateLesson(req.params.id, req.body);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteLesson(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/courses/:courseId/lessons/reorder", isAuthenticated, async (req: any, res) => {
    try {
      await storage.updateLessonOrder(req.params.courseId, req.body.lessonOrders);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Course Materials Management
  app.get("/api/lessons/:lessonId/materials", async (req, res) => {
    try {
      const materials = await storage.getLessonMaterials(req.params.lessonId);
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses/:courseId/materials", async (req, res) => {
    try {
      const materials = await storage.getCourseMaterials(req.params.courseId);
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/materials", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to object storage
      const uploadPath = `course-materials/${req.body.courseId || req.body.lessonId}/${req.file.originalname}`;
      const downloadUrl = await objectStorage.uploadFile(uploadPath, req.file.buffer, req.file.mimetype);

      const material = await storage.createMaterial({
        ...req.body,
        downloadUrl,
        objectStoragePath: uploadPath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      res.json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/materials/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Increment download count
      await storage.incrementDownloadCount(req.params.id);

      // Generate signed download URL
      const downloadUrl = await objectStorage.getSignedDownloadURL(material.objectStoragePath);
      res.json({ downloadUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/materials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteMaterial(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Progress Tracking
  app.get("/api/user/progress/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId, req.params.courseId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user/progress/:courseId/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await storage.getCourseProgressSummary(userId, req.params.courseId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.updateUserProgress({
        ...req.body,
        userId
      });
      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/user/progress/:lessonId/video", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { lastWatched, progressPercentage } = req.body;
      await storage.updateVideoProgress(userId, req.params.lessonId, lastWatched, progressPercentage);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/user/progress/:lessonId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markLessonCompleted(userId, req.params.lessonId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Enhanced Enrollment System
  app.post("/api/courses/:courseId/enroll", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollment = await storage.enrollUserInCourse({
        userId,
        courseId: req.params.courseId
      });
      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/user/courses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user/courses/:courseId/enrollment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollment = await storage.getEnrollment(userId, req.params.courseId);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/courses/:courseId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.completeCourse(userId, req.params.courseId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Video Upload Endpoints
  app.post("/api/lessons/:lessonId/video", isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      // Validate video file type
      if (!req.file.mimetype.startsWith('video/')) {
        return res.status(400).json({ error: "File must be a video" });
      }

      const uploadPath = `course-videos/${req.params.lessonId}/${req.file.originalname}`;
      const videoUrl = await objectStorage.uploadFile(uploadPath, req.file.buffer, req.file.mimetype);

      // Update lesson with video URL and metadata
      const lesson = await storage.updateLesson(req.params.lessonId, {
        videoUrl,
        objectStoragePath: uploadPath,
        uploadStatus: 'completed',
        videoMetadata: {
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname
        }
      });

      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

      // Using gpt-5-nano model as specifically requested by user
      const response = await openai.chat.completions.create({
        model: "gpt-5-nano",
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

  // ===================
  // MARKET DATA API ENDPOINTS
  // ===================
  
  // Get historical stock data as JSON
  app.get('/api/market-data/historical/:symbol', isAuthenticated, async (req: any, res) => {
    try {
      const { symbol } = req.params;
      const { startDate, endDate, interval = '1d' } = req.query;
      const userId = req.user.claims.sub;
      
      if (!symbol || !startDate || !endDate) {
        return res.status(400).json({ error: 'symbol, startDate, and endDate are required' });
      }

      const data = await marketDataService.getHistoricalData(symbol, startDate, endDate, interval);
      
      // Track the download in database
      await storage.createMarketDataDownload({
        userId,
        symbol: symbol.toUpperCase(),
        startDate,
        endDate,
        interval,
        fileName: `${symbol}_${startDate}_${endDate}.json`,
        fileSize: JSON.stringify(data).length,
        recordCount: data.data.length,
        downloadType: 'single',
        status: 'completed'
      });

      res.json(data);
    } catch (error: any) {
      console.error('Market data historical error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Download historical data as CSV
  app.get('/api/market-data/download/:symbol', isAuthenticated, async (req: any, res) => {
    try {
      const { symbol } = req.params;
      const { startDate, endDate, interval = '1d' } = req.query;
      const userId = req.user.claims.sub;
      
      if (!symbol || !startDate || !endDate) {
        return res.status(400).json({ error: 'symbol, startDate, and endDate are required' });
      }

      const data = await marketDataService.getHistoricalData(symbol, startDate, endDate, interval);
      const { csv, filename } = await marketDataService.exportToCSV(data.data, `${symbol}_${startDate}_${endDate}.csv`);
      
      // Track the download in database
      await storage.createMarketDataDownload({
        userId,
        symbol: symbol.toUpperCase(),
        startDate,
        endDate,
        interval,
        fileName: filename,
        fileSize: Buffer.byteLength(csv, 'utf8'),
        recordCount: data.data.length,
        downloadType: 'single',
        status: 'completed'
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error: any) {
      console.error('Market data CSV download error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get current stock quote
  app.get('/api/market-data/quote/:symbol', isAuthenticated, async (req: any, res) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({ error: 'symbol is required' });
      }

      const quote = await marketDataService.getCurrentQuote(symbol);
      res.json(quote);
    } catch (error: any) {
      console.error('Market data quote error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch download multiple symbols
  app.post('/api/market-data/batch-download', isAuthenticated, async (req: any, res) => {
    try {
      const { symbols, startDate, endDate, interval = '1d' } = req.body;
      const userId = req.user.claims.sub;
      
      if (!symbols || !Array.isArray(symbols) || !startDate || !endDate) {
        return res.status(400).json({ error: 'symbols (array), startDate, and endDate are required' });
      }

      if (symbols.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 symbols allowed per batch' });
      }

      const { results, errors } = await marketDataService.getMultipleHistoricalData(symbols, startDate, endDate, interval);
      
      if (results.length === 0) {
        return res.status(400).json({ error: 'No valid data retrieved', details: errors });
      }

      const batchResult = await marketDataService.createBatchZip(results);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${batchResult.filename}"`);
      res.send(batchResult.zipBuffer);
    } catch (error: any) {
      console.error('Market data batch download error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get supported intervals and periods  
  app.get('/api/market-data/options', async (req, res) => {
    try {
      const intervals = marketDataService.getSupportedIntervals();
      const periods = marketDataService.getSupportedPeriods();
      const popularSymbols = marketDataService.getPopularSymbols();
      
      res.json({
        intervals: intervals.map(interval => ({
          value: interval,
          label: interval === '1d' ? 'Daily' : interval === '1w' ? 'Weekly' : 'Monthly'
        })),
        periods,
        popularSymbols
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's market data download history
  app.get('/api/market-data/downloads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const downloads = await storage.getUserMarketDataDownloads(userId);
      res.json(downloads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get popular symbols statistics
  app.get('/api/market-data/popular-symbols', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const symbols = await storage.getPopularSymbols(Number(limit));
      res.json(symbols);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      
      // Server-side Object Storage upload
      const objectStorageResult = await objectStorage.uploadCSV(
        userId,
        sanitizedCustomFilename,
        file.buffer,
        {
          originalName: file.originalname,
          contentType: file.mimetype,
          percentileColumns,
          hasPercentileColumns,
        }
      );

      if (!objectStorageResult.ok) {
        throw new Error(objectStorageResult.error || 'Object Storage upload failed');
      }

      // Create upload record with server-generated metadata
      const uploadData = insertCsvUploadSchema.parse({
        filename: file.originalname,
        customFilename: sanitizedCustomFilename,
        objectStoragePath: objectStorageResult.path,
        fileSize: objectStorageResult.size || file.buffer.length,
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
          storageProvider: 'object-storage',
        },
        timeSeriesData,
        // Keep legacy Firebase fields as null for migration compatibility
        firebaseStorageUrl: null,
        firebaseStoragePath: null,
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
      } else if (error.message.includes('Object Storage') || error.message.includes('Firebase')) {
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
  app.delete("/api/csv/uploads/:id", isAuthenticated, requirePermission('csv', 'delete'), async (req: any, res) => {
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

      // Delete from Object Storage first (server-side)
      try {
        if (upload.objectStoragePath) {
          // Use Object Storage for new uploads
          const deleteResult = await objectStorage.deleteFile(upload.objectStoragePath);
          if (!deleteResult.ok) {
            console.warn("Object Storage file deletion failed:", deleteResult.error);
          }
        } else if (upload.firebaseStoragePath) {
          // Legacy support for Firebase Storage files
          await deleteCsvFileServerSide(upload.firebaseStoragePath);
        }
      } catch (error) {
        console.warn("File deletion failed:", error);
        // Continue with database deletion even if storage deletion fails
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
  app.get("/api/csv/uploads/:id/download", isAuthenticated, requirePermission('csv', 'view'), async (req: any, res) => {
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

      if (upload.objectStoragePath) {
        // Use Object Storage for new uploads - direct download
        const downloadResult = await objectStorage.downloadCSVByPath(upload.objectStoragePath);
        
        if (!downloadResult.ok) {
          return res.status(500).json({ error: "Failed to download file from storage" });
        }

        // Set appropriate headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${upload.customFilename}.csv"`);
        res.setHeader('Content-Length', downloadResult.data!.length);
        
        // Send the file data directly
        res.send(downloadResult.data);
      } else if (upload.firebaseStoragePath) {
        // Legacy support for Firebase Storage files
        const signedUrl = await getSignedDownloadURL(upload.firebaseStoragePath, userId);

        // Return the signed URL for client-side download
        res.json({ 
          downloadUrl: signedUrl,
          filename: upload.customFilename,
          expiresIn: "1 hour"
        });
      } else {
        return res.status(404).json({ error: "File storage path not found" });
      }

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

  app.post("/api/csv/:id/analyze", isAuthenticated, requirePermission('csv', 'view'), async (req: any, res) => {
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
            model: "gpt-5-nano",
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


  app.get("/api/csv/:id/anomalies", isAuthenticated, requirePermission('csv', 'view'), async (req: any, res) => {
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

  // ===================
  // OBJECT STORAGE API ENDPOINTS
  // ===================

  // File management endpoints
  app.post('/api/storage/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { path, metadata } = req.body;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!path) {
        return res.status(400).json({ error: "File path is required" });
      }

      // Upload to Object Storage
      const result = await objectStorage.uploadFile(path, file.buffer, {
        userId,
        originalName: file.originalname,
        contentType: file.mimetype,
        ...JSON.parse(metadata || '{}')
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        path: result.path,
        size: result.size
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/storage/download/:path(*)', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filePath = req.params.path;

      // Check access permissions
      const hasAccess = await objectStorage.checkUserAccess(userId, filePath);
      if (!hasAccess.ok) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Download from Object Storage
      const result = await objectStorage.downloadFile(filePath);

      if (!result.ok) {
        return res.status(404).json({ error: "File not found" });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename || 'download'}"`);
      res.send(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/storage/delete/:path(*)', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filePath = req.params.path;

      // Check access permissions
      const hasAccess = await objectStorage.checkUserAccess(userId, filePath);
      if (!hasAccess.ok) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete from Object Storage
      const result = await objectStorage.deleteFile(filePath);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/storage/list/:prefix?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefix = req.params.prefix || `users/${userId}/`;

      // List files from Object Storage
      const result = await objectStorage.listFiles(prefix);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ files: result.files });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User-specific storage endpoints
  app.get('/api/storage/user/:userId/files', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;

      // Users can only access their own files unless admin
      const currentUser = await storage.getUser(requestingUserId);
      if (requestingUserId !== targetUserId && currentUser?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = await objectStorage.listUserFiles(targetUserId);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ files: result.files });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/storage/user/:userId/backup', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;

      // Users can only backup their own data
      if (requestingUserId !== targetUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = await objectStorage.backupUserData(targetUserId);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        backupPath: result.backupPath,
        timestamp: result.timestamp
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/storage/user/:userId/restore', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      const { backupPath } = req.body;

      // Users can only restore their own data
      if (requestingUserId !== targetUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!backupPath) {
        return res.status(400).json({ error: "Backup path is required" });
      }

      const result = await objectStorage.restoreUserData(targetUserId, backupPath);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Course content storage endpoints
  app.post('/api/storage/courses/:courseId/content', isAuthenticated, upload.single('content'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = req.params.courseId;
      const file = req.file;
      const { contentType, title } = req.body;

      // Check if user is admin or course instructor
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin role required." });
      }

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!contentType) {
        return res.status(400).json({ error: "Content type is required" });
      }

      const result = await objectStorage.uploadCourseMaterial(courseId, contentType, file.buffer, {
        title: title || file.originalname,
        originalName: file.originalname,
        uploadedBy: userId
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        path: result.path,
        size: result.size
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/storage/courses/:courseId/content/:type', async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const contentType = req.params.type;

      const result = await objectStorage.downloadCourseMaterial(courseId, contentType);

      if (!result.ok) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename || 'course-content'}"`);
      res.send(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Asset management endpoints
  app.post('/api/storage/assets/upload', isAuthenticated, upload.single('asset'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const { assetPath, assetType } = req.body;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!assetPath) {
        return res.status(400).json({ error: "Asset path is required" });
      }

      const result = await objectStorage.uploadAsset(assetPath, file.buffer, {
        assetType: assetType || 'general',
        uploadedBy: userId,
        originalName: file.originalname
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        path: result.path,
        size: result.size
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/storage/assets/:assetPath(*)', async (req, res) => {
    try {
      const assetPath = req.params.assetPath;

      const result = await objectStorage.downloadAsset(assetPath);

      if (!result.ok) {
        return res.status(404).json({ error: "Asset not found" });
      }

      // Set appropriate headers with caching for assets
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache for assets
      res.setHeader('ETag', result.etag || '');
      res.send(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk operations endpoint
  app.post('/api/storage/bulk-upload', isAuthenticated, upload.array('files', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as Express.Multer.File[];
      const { basePath } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadPromises = files.map((file, index) => ({
        path: `${basePath || `users/${userId}/bulk`}/${file.originalname}`,
        content: file.buffer
      }));

      const result = await objectStorage.bulkUpload(uploadPromises);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        results: result.results
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================
  // USER CONTENT MANAGEMENT API ENDPOINTS
  // ===================

  // User Profile Management
  app.get('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, profilePicture, preferences } = req.body;
      
      const updatedProfile = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        profilePicture,
        preferences
      });
      
      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Profile Picture Upload
  app.post('/api/user/profile/picture', isAuthenticated, upload.single('profilePicture'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Object Storage
      const result = await objectStorage.uploadUserData(userId, 'profile-picture', file.buffer, {
        originalName: file.originalname,
        contentType: file.mimetype
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      // Update user profile with new picture path
      const updatedProfile = await storage.updateUserProfile(userId, {
        profilePicture: result.path
      });

      res.json({ 
        success: true, 
        profilePicture: result.path,
        profile: updatedProfile
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Storage Quota Management
  app.get('/api/user/storage/quota', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quota = await storage.getUserStorageQuota(userId);
      res.json(quota);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Learning Progress
  app.get('/api/user/learning/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserLearningProgress(userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/user/learning/progress/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId } = req.params;
      const { progress } = req.body;

      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ error: "Progress must be a number between 0 and 100" });
      }

      const updatedProgress = await storage.updateUserLearningProgress(userId, courseId, progress);
      res.json(updatedProgress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Notes Management
  app.get('/api/user/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId } = req.query;
      const notes = await storage.getUserNotes(userId, courseId as string);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/user/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId, title, content, tags } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const note = await storage.createUserNote(userId, {
        courseId,
        title,
        content,
        tags
      });

      res.json(note);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/user/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const { noteId } = req.params;
      const { title, content, tags } = req.body;

      const updatedNote = await storage.updateUserNote(noteId, {
        title,
        content,
        tags
      });

      res.json(updatedNote);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/user/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const { noteId } = req.params;
      const deleted = await storage.deleteUserNote(noteId);

      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Achievements
  app.get('/api/user/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/user/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, title, description } = req.body;

      if (!type || !title || !description) {
        return res.status(400).json({ error: "Type, title, and description are required" });
      }

      const achievement = await storage.addUserAchievement(userId, {
        type,
        title,
        description
      });

      res.json(achievement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Data Backup and Export
  app.post('/api/user/backup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Create backup data
      const backup = await storage.createUserBackup(userId);
      
      // Upload backup to Object Storage
      const backupJson = JSON.stringify(backup, null, 2);
      const result = await objectStorage.uploadUserData(userId, 'backup', Buffer.from(backupJson), {
        timestamp: backup.timestamp.toISOString(),
        type: 'full_backup'
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        backupPath: result.path,
        timestamp: backup.timestamp,
        size: backupJson.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/user/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportData = await storage.getUserExportData(userId);
      
      // Set headers for file download
      const filename = `user-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GDPR Data Deletion
  app.delete('/api/user/data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { confirmEmail } = req.body;

      // Get user to verify email
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (confirmEmail !== user.email) {
        return res.status(400).json({ error: "Email confirmation does not match" });
      }

      // Delete user data from Object Storage first
      const objectStorageResult = await objectStorage.deleteUserData(userId);

      // Delete user data from database
      const databaseResult = await storage.deleteAllUserData(userId);

      res.json({
        success: true,
        objectStorage: objectStorageResult,
        database: databaseResult
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================
  // COURSE CONTENT MANAGEMENT API ENDPOINTS
  // ===================

  // Course Material Upload
  app.post('/api/courses/:courseId/materials/upload', isAuthenticated, requirePermission('course', 'edit'), upload.single('material'), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const { materialType, lessonId, version } = req.body;
      const file = req.file;

      if (!file || !materialType) {
        return res.status(400).json({ error: "File and material type are required" });
      }

      const result = await objectStorage.uploadCourseMaterial(courseId, materialType, file.buffer, {
        originalName: file.originalname,
        contentType: file.mimetype,
        version,
        lessonId,
        metadata: {
          uploadedBy: req.user.claims.sub,
          uploadedAt: new Date()
        }
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        path: result.path,
        materialType,
        courseId,
        lessonId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Course Material Download
  app.get('/api/courses/:courseId/materials/:materialType/download', isAuthenticated, requirePermission('course', 'view'), async (req: any, res) => {
    try {
      const { courseId, materialType } = req.params;
      const { version, lessonId } = req.query;

      const result = await objectStorage.downloadCourseMaterial(
        courseId, 
        materialType, 
        version as string, 
        lessonId as string
      );

      if (!result.ok || !result.data) {
        return res.status(404).json({ error: result.error || "Course material not found" });
      }

      // Set appropriate headers based on metadata
      if (result.metadata?.originalName) {
        res.setHeader('Content-Disposition', `attachment; filename="${result.metadata.originalName}"`);
      }
      if (result.metadata?.contentType) {
        res.setHeader('Content-Type', result.metadata.contentType);
      }

      res.send(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List Course Materials
  app.get('/api/courses/:courseId/materials', isAuthenticated, requirePermission('course', 'view'), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const { materialType, lessonId } = req.query;

      const result = await objectStorage.listCourseMaterials(
        courseId, 
        materialType as string, 
        lessonId as string
      );

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        materials: result.materials || [],
        courseId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Course Material
  app.delete('/api/courses/:courseId/materials/:materialPath', isAuthenticated, requirePermission('course', 'delete'), async (req: any, res) => {
    try {
      const { courseId, materialPath } = req.params;

      // Decode the material path
      const decodedPath = decodeURIComponent(materialPath);

      const result = await objectStorage.deleteCourseMaterial(courseId, decodedPath);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Course Video Upload
  app.post('/api/courses/:courseId/lessons/:lessonId/video', isAuthenticated, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const { courseId, lessonId } = req.params;
      const { duration, resolution, quality } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const videoFile = files['video']?.[0];
      const thumbnailFile = files['thumbnail']?.[0];

      if (!videoFile) {
        return res.status(400).json({ error: "Video file is required" });
      }

      const result = await objectStorage.uploadCourseVideo(courseId, lessonId, videoFile.buffer, {
        originalName: videoFile.originalname,
        duration: duration ? parseFloat(duration) : undefined,
        resolution,
        quality,
        thumbnailContent: thumbnailFile?.buffer
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath,
        courseId,
        lessonId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Course Certificate Generation and Upload
  app.post('/api/courses/:courseId/certificates/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { courseId, userId } = req.params;
      const { certificateType, grade, courseName, userName } = req.body;

      // TODO: Implement certificate generation logic here
      // For now, we'll create a placeholder PDF
      const certificateContent = Buffer.from(`Course Completion Certificate
      
      Course: ${courseName || courseId}
      Student: ${userName || userId}
      Completion Date: ${new Date().toDateString()}
      Grade: ${grade || 'N/A'}
      Certificate Type: ${certificateType || 'completion'}
      `);

      const result = await objectStorage.uploadCourseCertificate(courseId, userId, certificateContent, {
        completionDate: new Date(),
        grade: grade ? parseFloat(grade) : undefined,
        certificateType,
        courseName,
        userName
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        certificatePath: result.certificatePath,
        courseId,
        userId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get User Course Certificates
  app.get('/api/user/certificates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId } = req.query;

      const result = await objectStorage.getUserCourseCertificates(userId, courseId as string);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        certificates: result.certificates || [],
        userId
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download Course Certificate
  app.get('/api/courses/:courseId/certificates/:userId/download', isAuthenticated, requirePermission('course', 'view'), async (req: any, res) => {
    try {
      const { courseId, userId } = req.params;
      const { certificateType } = req.query;

      // Get user certificates and find the requested one
      const result = await objectStorage.getUserCourseCertificates(userId, courseId);

      if (!result.ok || !result.certificates) {
        return res.status(404).json({ error: "Certificates not found" });
      }

      const certificate = certificateType 
        ? result.certificates.find(cert => cert.metadata?.certificateType === certificateType)
        : result.certificates[result.certificates.length - 1]; // Get latest

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      // Download the certificate file
      const downloadResult = await objectStorage.downloadFile(certificate.path);

      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(404).json({ error: "Certificate file not found" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${courseId}-${userId}.pdf"`);
      res.send(downloadResult.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Course Content Upload
  app.post('/api/courses/:courseId/bulk-upload', isAuthenticated, upload.array('files', 20), async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const files = req.files as Express.Multer.File[];
      const { materialTypes, lessonIds } = req.body; // JSON arrays

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const materialTypesArray = JSON.parse(materialTypes || '[]');
      const lessonIdsArray = JSON.parse(lessonIds || '[]');

      const materials = files.map((file, index) => ({
        type: materialTypesArray[index] || 'document',
        content: file.buffer,
        originalName: file.originalname,
        lessonId: lessonIdsArray[index],
        metadata: {
          uploadedBy: req.user.claims.sub,
          uploadedAt: new Date(),
          contentType: file.mimetype
        }
      }));

      const result = await objectStorage.bulkUploadCourseContent(courseId, materials);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        results: result.results,
        courseId,
        totalFiles: files.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================
  // SYSTEM ASSET STORAGE API ENDPOINTS
  // ===================


  // Upload Chart Asset
  app.post('/api/assets/charts/upload', isAuthenticated, upload.single('chart'), async (req: any, res) => {
    try {
      const { chartId, format, chartType, dataSource, metadata } = req.body;
      const file = req.file;

      if (!file || !chartId) {
        return res.status(400).json({ error: "Chart file and chartId are required" });
      }

      const result = await objectStorage.uploadChartAsset(chartId, file.buffer, {
        format: format || 'png',
        chartType,
        dataSource,
        userId: req.user.claims.sub,
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        path: result.path,
        chartId,
        chartType,
        format: format || 'png'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload Report Asset
  app.post('/api/assets/reports/upload', isAuthenticated, upload.single('report'), async (req: any, res) => {
    try {
      const { reportId, format, reportType, title, metadata } = req.body;
      const file = req.file;

      if (!file || !reportId) {
        return res.status(400).json({ error: "Report file and reportId are required" });
      }

      const result = await objectStorage.uploadReportAsset(reportId, file.buffer, {
        format: format || 'pdf',
        reportType,
        userId: req.user.claims.sub,
        title,
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        path: result.path,
        reportId,
        reportType,
        format: format || 'pdf'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload System Backup
  app.post('/api/assets/backups/upload', isAuthenticated, upload.single('backup'), async (req: any, res) => {
    try {
      const { backupId, backupType, version, description, metadata } = req.body;
      const file = req.file;

      // Check if user has admin permissions for system backups
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required for system backups" });
      }

      if (!file || !backupId) {
        return res.status(400).json({ error: "Backup file and backupId are required" });
      }

      const result = await objectStorage.uploadSystemBackup(backupId, file.buffer, {
        backupType,
        version,
        description,
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        path: result.path,
        backupId,
        backupType,
        version
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload Static Asset
  app.post('/api/assets/static/upload', isAuthenticated, upload.single('asset'), async (req: any, res) => {
    try {
      const { assetPath, category, version, metadata } = req.body;
      const file = req.file;

      if (!file || !assetPath) {
        return res.status(400).json({ error: "Asset file and assetPath are required" });
      }

      const result = await objectStorage.uploadStaticAsset(assetPath, file.buffer, {
        contentType: file.mimetype,
        category,
        version,
        metadata: metadata ? JSON.parse(metadata) : {}
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        path: result.path,
        originalPath: assetPath,
        category,
        version
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List Assets
  app.get('/api/assets/:assetType', isAuthenticated, async (req: any, res) => {
    try {
      const { assetType } = req.params;
      const { category, limit, includeMetadata } = req.query;

      const result = await objectStorage.listAssets(assetType, category as string, {
        limit: limit ? parseInt(limit as string) : undefined,
        includeMetadata: includeMetadata === 'true'
      });

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        assetType,
        category,
        assets: result.assets || []
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download Asset
  app.get('/api/assets/download/:assetPath(*)', isAuthenticated, async (req: any, res) => {
    try {
      const assetPath = req.params.assetPath;

      const result = await objectStorage.downloadAsset(assetPath);

      if (!result.ok || !result.data) {
        return res.status(404).json({ error: result.error || "Asset not found" });
      }

      // Set appropriate headers based on metadata
      if (result.metadata?.contentType) {
        res.setHeader('Content-Type', result.metadata.contentType);
      }
      
      const filename = assetPath.split('/').pop() || 'asset';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Asset
  app.delete('/api/assets/:assetPath(*)', isAuthenticated, async (req: any, res) => {
    try {
      const assetPath = req.params.assetPath;

      // Check if user has permission to delete this asset type
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Admin can delete any asset, users can only delete their own assets
      if (user.role !== 'admin' && !assetPath.includes(`/users/${user.id}/`)) {
        return res.status(403).json({ error: "Permission denied" });
      }

      const result = await objectStorage.deleteAsset(assetPath);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk Upload Assets
  app.post('/api/assets/bulk-upload', isAuthenticated, upload.array('assets', 50), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { assetPaths, types, categories, metadata } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No asset files uploaded" });
      }

      const assetPathsArray = JSON.parse(assetPaths || '[]');
      const typesArray = JSON.parse(types || '[]');
      const categoriesArray = JSON.parse(categories || '[]');
      const metadataArray = JSON.parse(metadata || '[]');

      const assets = files.map((file, index) => ({
        path: assetPathsArray[index] || file.originalname,
        content: file.buffer,
        type: typesArray[index] || 'static',
        category: categoriesArray[index],
        metadata: {
          contentType: file.mimetype,
          uploadedBy: req.user.claims.sub,
          ...metadataArray[index]
        }
      }));

      const result = await objectStorage.bulkUploadAssets(assets);

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        results: result.results,
        totalAssets: assets.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Asset Cleanup (Admin only)
  app.post('/api/assets/:assetType/cleanup', isAuthenticated, async (req: any, res) => {
    try {
      const { assetType } = req.params;
      const { retentionDays } = req.body;

      // Check if user has admin permissions
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required for asset cleanup" });
      }

      const result = await objectStorage.cleanupOldAssets(
        assetType, 
        retentionDays ? parseInt(retentionDays) : 30
      );

      if (!result.ok) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        success: true,
        assetType,
        deletedCount: result.deletedCount,
        retentionDays: retentionDays || 30
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Asset Statistics (Admin only)
  app.get('/api/assets/statistics', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has admin permissions
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required for asset statistics" });
      }

      // Get statistics for different asset types
      const assetTypes = ['icons', 'charts', 'reports', 'static'];
      const statistics: any = {};

      for (const assetType of assetTypes) {
        const result = await objectStorage.listAssets(assetType, undefined, { 
          limit: 1000,
          includeMetadata: true 
        });
        
        if (result.ok && result.assets) {
          statistics[assetType] = {
            totalCount: result.assets.length,
            categories: [...new Set(result.assets.map(a => a.category).filter(Boolean))],
            totalSize: result.assets.reduce((sum, asset) => {
              return sum + (asset.metadata?.size || 0);
            }, 0)
          };
        }
      }

      res.json({
        success: true,
        statistics,
        timestamp: new Date()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================
  // PERMISSION MANAGEMENT APIs
  // ===================

  // Access Control APIs
  app.post('/api/permissions/grant', isAuthenticated, async (req: any, res) => {
    try {
      const { resourceType, resourceId, principalType, principalId, permissions } = req.body;
      const grantedBy = req.user.claims.sub;
      
      // Validate input
      const grantData = insertAccessGrantSchema.parse({
        resourceType,
        resourceId,
        principalType,
        principalId,
        permissions,
        grantedBy
      });
      
      // Check if user has permission to grant access (must be owner or have share permission)
      const canGrant = await storage.checkPermission(grantedBy, resourceType, resourceId, 'share');
      if (!canGrant) {
        return res.status(403).json({ error: 'Insufficient permissions to grant access' });
      }
      
      const grant = await storage.grantAccess(
        resourceType,
        resourceId,
        principalType,
        principalId,
        permissions,
        grantedBy
      );
      
      res.json(grant);
    } catch (error: any) {
      console.error('Grant access error:', error);
      res.status(400).json({ error: error.message || 'Failed to grant access' });
    }
  });

  app.delete('/api/permissions/:grantId', isAuthenticated, async (req: any, res) => {
    try {
      const { grantId } = req.params;
      const revokedBy = req.user.claims.sub;
      
      const success = await storage.revokeAccess(grantId, revokedBy);
      if (!success) {
        return res.status(404).json({ error: 'Access grant not found' });
      }
      
      res.json({ success: true, message: 'Access revoked' });
    } catch (error: any) {
      console.error('Revoke access error:', error);
      res.status(500).json({ error: 'Failed to revoke access' });
    }
  });

  app.get('/api/resources/:resourceType/:resourceId/collaborators', isAuthenticated, requireAnyPermission('csv', ['view', 'share']), async (req: any, res) => {
    try {
      const { resourceType, resourceId } = req.params;
      
      const collaborators = await storage.getResourceCollaborators(resourceType, resourceId);
      res.json(collaborators);
    } catch (error: any) {
      console.error('Get collaborators error:', error);
      res.status(500).json({ error: 'Failed to get collaborators' });
    }
  });

  app.get('/api/resources/:resourceType/:resourceId/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const { resourceType, resourceId } = req.params;
      const userId = req.user.claims.sub;
      
      const permissions = await storage.getUserPermissions(userId, resourceType, resourceId);
      res.json({ permissions });
    } catch (error: any) {
      console.error('Get permissions error:', error);
      res.status(500).json({ error: 'Failed to get permissions' });
    }
  });

  // Team Management APIs
  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const { name, description } = req.body;
      const ownerId = req.user.claims.sub;
      
      const teamData = insertTeamSchema.parse({
        name,
        description,
        ownerId
      });
      
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error: any) {
      console.error('Create team error:', error);
      res.status(400).json({ error: error.message || 'Failed to create team' });
    }
  });

  app.post('/api/teams/:teamId/members', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const { userId, role } = req.body;
      const requesterId = req.user.claims.sub;
      
      // Check if requester has permission to add members (must be owner or admin)
      const team = await storage.getTeam(teamId);
      if (!team || team.ownerId !== requesterId) {
        const userTeams = await storage.getUserTeams(requesterId);
        const isAdmin = userTeams.some(t => t.id === teamId && ['owner', 'admin'].includes(t.role));
        if (!isAdmin) {
          return res.status(403).json({ error: 'Insufficient permissions to add team members' });
        }
      }
      
      const memberData = insertTeamMemberSchema.parse({
        teamId,
        userId,
        role: role || 'member'
      });
      
      const member = await storage.addTeamMember(memberData);
      res.json(member);
    } catch (error: any) {
      console.error('Add team member error:', error);
      res.status(400).json({ error: error.message || 'Failed to add team member' });
    }
  });

  app.delete('/api/teams/:teamId/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId, userId } = req.params;
      const requesterId = req.user.claims.sub;
      
      // Check if requester has permission to remove members
      const team = await storage.getTeam(teamId);
      if (!team || team.ownerId !== requesterId) {
        const userTeams = await storage.getUserTeams(requesterId);
        const isAdmin = userTeams.some(t => t.id === teamId && ['owner', 'admin'].includes(t.role));
        if (!isAdmin && requesterId !== userId) { // Users can remove themselves
          return res.status(403).json({ error: 'Insufficient permissions to remove team members' });
        }
      }
      
      const success = await storage.removeTeamMember(teamId, userId);
      if (!success) {
        return res.status(404).json({ error: 'Team member not found' });
      }
      
      res.json({ success: true, message: 'Team member removed' });
    } catch (error: any) {
      console.error('Remove team member error:', error);
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  });

  app.get('/api/teams/my-teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error: any) {
      console.error('Get user teams error:', error);
      res.status(500).json({ error: 'Failed to get user teams' });
    }
  });

  app.get('/api/teams/:teamId/members', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const userId = req.user.claims.sub;
      
      // Check if user is member of the team
      const userTeams = await storage.getUserTeams(userId);
      const isMember = userTeams.some(t => t.id === teamId);
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied - not a team member' });
      }
      
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error: any) {
      console.error('Get team members error:', error);
      res.status(500).json({ error: 'Failed to get team members' });
    }
  });

  // Share Invitation APIs
  app.post('/api/share/invite', isAuthenticated, async (req: any, res) => {
    try {
      const { resourceType, resourceId, inviteeEmail, permissions, expiresIn } = req.body;
      const inviterUserId = req.user.claims.sub;
      
      // Check if user can share the resource
      const canShare = await storage.checkPermission(inviterUserId, resourceType, resourceId, 'share');
      if (!canShare) {
        return res.status(403).json({ error: 'Insufficient permissions to share resource' });
      }
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7)); // Default 7 days
      
      const inviteData = insertShareInviteSchema.parse({
        resourceType,
        resourceId,
        inviterUserId,
        inviteeEmail,
        permissions,
        expiresAt
      });
      
      const invite = await storage.createShareInvite(inviteData);
      res.json(invite);
    } catch (error: any) {
      console.error('Create share invite error:', error);
      res.status(400).json({ error: error.message || 'Failed to create share invitation' });
    }
  });

  app.post('/api/share/accept/:token', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.params;
      const userId = req.user.claims.sub;
      
      const success = await storage.acceptShareInvite(token, userId);
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired invitation' });
      }
      
      res.json({ success: true, message: 'Invitation accepted' });
    } catch (error: any) {
      console.error('Accept share invite error:', error);
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  });

  app.post('/api/share/decline/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const success = await storage.declineShareInvite(token);
      if (!success) {
        return res.status(400).json({ error: 'Invalid invitation' });
      }
      
      res.json({ success: true, message: 'Invitation declined' });
    } catch (error: any) {
      console.error('Decline share invite error:', error);
      res.status(500).json({ error: 'Failed to decline invitation' });
    }
  });

  app.get('/api/share/invites', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      
      const invites = await storage.getShareInvites(userEmail);
      res.json(invites);
    } catch (error: any) {
      console.error('Get share invites error:', error);
      res.status(500).json({ error: 'Failed to get share invites' });
    }
  });

  app.get('/api/share/sent-invites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const invites = await storage.getUserSentInvites(userId);
      res.json(invites);
    } catch (error: any) {
      console.error('Get sent invites error:', error);
      res.status(500).json({ error: 'Failed to get sent invites' });
    }
  });

  // Share Link APIs
  app.post('/api/share/link', isAuthenticated, async (req: any, res) => {
    try {
      const { resourceType, resourceId, permissions, expiresIn, maxAccessCount } = req.body;
      const createdBy = req.user.claims.sub;
      
      // Check if user can share the resource
      const canShare = await storage.checkPermission(createdBy, resourceType, resourceId, 'share');
      if (!canShare) {
        return res.status(403).json({ error: 'Insufficient permissions to create share link' });
      }
      
      // Calculate expiration date if provided
      let expiresAt = null;
      if (expiresIn) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresIn);
      }
      
      const linkData = insertShareLinkSchema.parse({
        resourceType,
        resourceId,
        createdBy,
        permissions,
        expiresAt,
        maxAccessCount
      });
      
      const shareLink = await storage.createShareLink(linkData);
      res.json(shareLink);
    } catch (error: any) {
      console.error('Create share link error:', error);
      res.status(400).json({ error: error.message || 'Failed to create share link' });
    }
  });

  app.get('/api/share/link/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const shareLink = await storage.getShareLink(token);
      if (!shareLink) {
        return res.status(404).json({ error: 'Invalid or expired share link' });
      }
      
      res.json(shareLink);
    } catch (error: any) {
      console.error('Get share link error:', error);
      res.status(500).json({ error: 'Failed to get share link' });
    }
  });

  app.get('/api/share/links/:resourceType/:resourceId', isAuthenticated, requireAnyPermission('csv', ['share', 'view']), async (req: any, res) => {
    try {
      const { resourceType, resourceId } = req.params;
      
      const shareLinks = await storage.getResourceShareLinks(resourceType, resourceId);
      res.json(shareLinks);
    } catch (error: any) {
      console.error('Get resource share links error:', error);
      res.status(500).json({ error: 'Failed to get share links' });
    }
  });

  app.delete('/api/share/links/:linkId', isAuthenticated, async (req: any, res) => {
    try {
      const { linkId } = req.params;
      const userId = req.user.claims.sub;
      
      // Get the share link to check ownership
      const shareLink = await storage.getShareLink(linkId);
      if (!shareLink || shareLink.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied - not the creator of this share link' });
      }
      
      const success = await storage.deleteShareLink(linkId);
      if (!success) {
        return res.status(404).json({ error: 'Share link not found' });
      }
      
      res.json({ success: true, message: 'Share link deleted' });
    } catch (error: any) {
      console.error('Delete share link error:', error);
      res.status(500).json({ error: 'Failed to delete share link' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
