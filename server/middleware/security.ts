import helmet from 'helmet';
import cors from 'cors';
import type { Express } from 'express';

export function setupSecurityHeaders(app: Express) {
  // Comprehensive Security Headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://apis.google.com",
          "https://www.gstatic.com",
          "https://firebase.googleapis.com"
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        imgSrc: [
          "'self'", 
          "data:", 
          "https:",
          "blob:"
        ],
        connectSrc: [
          "'self'", 
          "wss:", 
          "https://api.replit.com",
          "https://firebase.googleapis.com",
          "https://firestore.googleapis.com"
        ],
        fontSrc: [
          "'self'", 
          "https://fonts.gstatic.com"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // CORS hardening with strict allowlist
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5173',
    'https://localhost:5173',
    'https://localhost:5000'
  ];

  // Add production domains from REPLIT_DOMAINS if available
  if (process.env.REPLIT_DOMAINS) {
    const replitDomains = process.env.REPLIT_DOMAINS.split(',');
    replitDomains.forEach(domain => {
      allowedOrigins.push(`https://${domain.trim()}`);
    });
  }

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) in development
      if (!origin && process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['X-Session-Remaining'],
    maxAge: 86400 // 24 hours
  }));

  // Additional security headers
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Hide server information
    res.removeHeader('X-Powered-By');
    
    // Prevent MIME type confusion attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict Transport Security (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  });
}