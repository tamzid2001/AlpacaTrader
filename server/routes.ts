import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSupportMessageSchema, insertQuizResultSchema } from "@shared/schema";
import OpenAI from "openai";

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
  
  // Auth routes
  app.post("/api/auth/sync-user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists by Firebase UID
      let user = await storage.getUserByFirebaseUid(userData.firebaseUid);
      
      if (user) {
        // Update existing user
        user = await storage.updateUser(user.id, userData);
      } else {
        // Create new user (needs admin approval)
        user = await storage.createUser(userData);
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/user/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users/pending", async (req, res) => {
    try {
      const users = await storage.getPendingUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users/:id/approve", async (req, res) => {
    try {
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
