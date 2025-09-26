import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSupportMessageSchema, insertQuizResultSchema, insertCsvUploadSchema, insertAnomalySchema } from "@shared/schema";
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

  // CSV Upload and Anomaly Detection routes
  app.post("/api/csv/upload", async (req, res) => {
    try {
      const { filename, csvData, userId } = req.body;
      
      if (!filename || !csvData || !userId) {
        return res.status(400).json({ error: "Missing required fields: filename, csvData, userId" });
      }

      // Validate CSV structure
      if (!Array.isArray(csvData) || csvData.length === 0) {
        return res.status(400).json({ error: "Invalid CSV data format" });
      }

      // Check for required percentile columns (p1 through p99)
      const requiredColumns = [];
      for (let i = 1; i <= 99; i++) {
        requiredColumns.push(`p${i}`);
      }
      
      const firstRow = csvData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      if (missingColumns.length > 0) {
        return res.status(400).json({ 
          error: `Missing required percentile columns: ${missingColumns.join(", ")}` 
        });
      }

      // Validate file size (limit to 50MB equivalent)
      if (csvData.length > 50000) {
        return res.status(400).json({ error: "CSV file too large. Maximum 50,000 rows allowed." });
      }

      // Create CSV upload record
      const uploadData = insertCsvUploadSchema.parse({
        userId,
        filename,
        fileSize: JSON.stringify(csvData).length,
        columnCount: Object.keys(firstRow).length,
        rowCount: csvData.length,
        timeSeriesData: csvData,
        status: "uploaded"
      });

      const upload = await storage.createCsvUpload(uploadData);
      res.json(upload);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/csv/:id/analyze", async (req, res) => {
    try {
      const upload = await storage.getCsvUpload(req.params.id);
      if (!upload) {
        return res.status(404).json({ error: "CSV upload not found" });
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
            model: "gpt-5",
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

  app.get("/api/csv/uploads", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
      }
      
      const uploads = await storage.getUserCsvUploads(userId as string);
      res.json(uploads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/csv/:id/anomalies", async (req, res) => {
    try {
      const anomalies = await storage.getUploadAnomalies(req.params.id);
      res.json(anomalies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/anomalies", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId query parameter is required" });
      }
      
      const anomalies = await storage.getUserAnomalies(userId as string);
      res.json(anomalies);
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
