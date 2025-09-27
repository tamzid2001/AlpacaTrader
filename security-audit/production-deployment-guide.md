# 🚀 Production Deployment Guide
**PropFarming Pro LMS - Complete Production Setup & Launch**

## DEPLOYMENT CHECKLIST OVERVIEW

**Deployment Timeline:** 5-7 days  
**Infrastructure:** AWS-based with Replit deployment  
**Database:** Neon PostgreSQL (production tier)  
**Monitoring:** Comprehensive observability stack  

---

## 🏗️ INFRASTRUCTURE SETUP

### 1. Production Environment Configuration

#### Environment Variables Setup
```bash
# Core Application
NODE_ENV=production
DATABASE_URL=<neon-production-url>
SESSION_SECRET=<cryptographically-secure-random-string>

# Authentication (Replit)
REPLIT_CLIENT_ID=<production-client-id>
REPLIT_CLIENT_SECRET=<production-client-secret>

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=<stripe-live-secret-key>
STRIPE_PUBLISHABLE_KEY=<stripe-live-publishable-key>
STRIPE_WEBHOOK_SECRET=<stripe-live-webhook-secret>

# AI Services (OpenAI)
OPENAI_API_KEY=<production-openai-key>

# Email Services (SendGrid)
SENDGRID_API_KEY=<sendgrid-production-key>
FROM_EMAIL=support@propfarmingpro.com

# AWS Configuration
AWS_ACCESS_KEY_ID=<production-aws-access-key>
AWS_SECRET_ACCESS_KEY=<production-aws-secret>
AWS_REGION=eu-west-1
AWS_S3_BUCKET=propfarming-production

# Monitoring & Logging
LOG_LEVEL=warn
SENTRY_DSN=<sentry-production-dsn>
```

#### Database Migration to Production
```bash
# 1. Create production database backup
npm run db:backup-dev

# 2. Setup production database
npm run db:setup-production

# 3. Migrate schema to production
npm run db:push --env production

# 4. Verify data integrity
npm run db:verify-production
```

### 2. AWS Services Configuration

#### S3 Bucket Setup
```bash
# Create production S3 bucket
aws s3 mb s3://propfarming-production --region eu-west-1

# Configure bucket policy for secure access
aws s3api put-bucket-policy --bucket propfarming-production --policy file://s3-bucket-policy.json

# Enable versioning and lifecycle management
aws s3api put-bucket-versioning --bucket propfarming-production --versioning-configuration Status=Enabled
```

#### IAM Roles & Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject", 
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::propfarming-production/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "batch:SubmitJob",
        "batch:DescribeJobs",
        "batch:CancelJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:eu-west-1:*:function:propfarming-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:CreateTrainingJob",
        "sagemaker:DescribeTrainingJob",
        "sagemaker:StopTrainingJob"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔒 SECURITY CONFIGURATION

### 1. HTTPS & SSL/TLS Setup
```nginx
# Nginx configuration for SSL termination
server {
    listen 443 ssl http2;
    server_name propfarmingpro.com www.propfarmingpro.com;
    
    ssl_certificate /etc/ssl/certs/propfarmingpro.com.crt;
    ssl_certificate_key /etc/ssl/private/propfarmingpro.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Rate Limiting Configuration
```javascript
// Production rate limiting
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limits
app.use('/api/auth/', createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts'));
app.use('/api/premium/', createRateLimiter(60 * 1000, 100, 'Premium API rate limit exceeded'));
app.use('/api/chat/', createRateLimiter(60 * 1000, 30, 'Chat API rate limit exceeded'));
app.use('/api/', createRateLimiter(60 * 1000, 1000, 'API rate limit exceeded'));
```

### 3. Content Security Policy
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com"],
      frameSrc: ["https://js.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
```

---

## 📊 MONITORING & OBSERVABILITY

### 1. Application Performance Monitoring

#### Sentry Integration
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
```

#### Custom Metrics Collection
```javascript
const metrics = {
  // User engagement metrics
  trackUserLogin: (userId) => {
    console.log(JSON.stringify({
      event: 'user_login',
      userId,
      timestamp: new Date().toISOString()
    }));
  },
  
  // Payment processing metrics
  trackPaymentSuccess: (userId, amount, tier) => {
    console.log(JSON.stringify({
      event: 'payment_success',
      userId,
      amount,
      tier,
      timestamp: new Date().toISOString()
    }));
  },
  
  // Course completion metrics
  trackCourseCompletion: (userId, courseId, duration) => {
    console.log(JSON.stringify({
      event: 'course_completion',
      userId,
      courseId,
      duration,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### 2. Health Checks & Uptime Monitoring

#### Health Check Endpoint
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  try {
    // Database connectivity
    await storage.healthCheck();
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Redis connectivity (if using)
    health.checks.cache = 'healthy';
  } catch (error) {
    health.checks.cache = 'unhealthy';
  }
  
  try {
    // External API connectivity
    await fetch('https://api.stripe.com/healthcheck');
    health.checks.stripe = 'healthy';
  } catch (error) {
    health.checks.stripe = 'degraded';
  }
  
  const status = health.status === 'healthy' ? 200 : 503;
  res.status(status).json(health);
});
```

#### Uptime Monitoring Setup
```bash
# Setup external monitoring (example with UptimeRobot)
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=YOUR_API_KEY" \
  -d "format=json" \
  -d "type=1" \
  -d "url=https://propfarmingpro.com/health" \
  -d "friendly_name=PropFarming Pro Health Check" \
  -d "interval=300"
```

### 3. Log Aggregation & Analysis

#### Structured Logging Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/app.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Security event logging
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' })
  ]
});
```

---

## 🚀 DEPLOYMENT PROCESS

### 1. Pre-Deployment Checklist
```bash
# Run all tests
npm run test:all

# Security audit
npm audit --audit-level high

# Build production assets
npm run build:production

# Database migration dry run
npm run db:migrate:dry-run

# Load testing
npm run test:load
```

### 2. Deployment Steps

#### Blue-Green Deployment Process
```bash
#!/bin/bash
# Blue-Green deployment script

# 1. Deploy to green environment
echo "Deploying to green environment..."
./deploy-green.sh

# 2. Run health checks
echo "Running health checks..."
./health-check-green.sh

# 3. Switch traffic to green
echo "Switching traffic to green..."
./switch-traffic.sh green

# 4. Monitor for issues
echo "Monitoring for 10 minutes..."
sleep 600

# 5. Confirm deployment success
./confirm-deployment.sh
```

### 3. Post-Deployment Verification

#### Smoke Tests
```javascript
// Critical path smoke tests
const smokeTests = [
  {
    name: 'User Registration',
    test: async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        })
      });
      return response.ok;
    }
  },
  {
    name: 'Course Access',
    test: async () => {
      const response = await fetch('/api/courses');
      return response.ok && response.status === 200;
    }
  },
  {
    name: 'Payment Processing',
    test: async () => {
      const response = await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ping' })
      });
      return response.status === 200;
    }
  }
];
```

---

## 📈 PERFORMANCE OPTIMIZATION

### 1. Database Optimization

#### Index Creation
```sql
-- Critical performance indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX CONCURRENTLY idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX CONCURRENTLY idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX CONCURRENTLY idx_background_jobs_status ON background_jobs(status, created_at);

-- Analytics optimization
CREATE INDEX CONCURRENTLY idx_user_progress_course ON user_progress(course_id, completion_percentage);
```

#### Connection Pooling
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 2. Caching Strategy

#### Redis Configuration
```javascript
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache frequently accessed data
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

---

## 🔧 MAINTENANCE & OPERATIONS

### 1. Backup Procedures

#### Database Backup Strategy
```bash
#!/bin/bash
# Daily backup script

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/database.sql

# File system backup
tar -czf $BACKUP_DIR/uploads.tar.gz /app/uploads

# Upload to S3
aws s3 cp $BACKUP_DIR s3://propfarming-backups/$(date +%Y%m%d) --recursive

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;
```

### 2. Monitoring Alerts

#### Critical Alert Configuration
```yaml
# Alerting rules (Prometheus/Grafana format)
groups:
  - name: propfarming.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"

      - alert: PaymentProcessingFailure
        expr: rate(payment_failures_total[5m]) > 0.05
        for: 2m
        labels:
          severity: high
        annotations:
          summary: "High payment failure rate"
```

---

## 📋 GO-LIVE CHECKLIST

### Final Verification (Day of Launch)
- [ ] **Infrastructure:** All services healthy and monitored
- [ ] **Security:** SSL certificates valid, security headers configured
- [ ] **Performance:** Load testing passed, caching configured
- [ ] **Monitoring:** Alerts configured, dashboards operational
- [ ] **Backup:** Automated backups verified and tested
- [ ] **DNS:** Domain configured, CDN operational
- [ ] **Team:** On-call schedule established, runbooks prepared

### Launch Day Timeline
```
T-4 hours: Final smoke tests and monitoring setup
T-2 hours: Team briefing and go/no-go decision
T-1 hour: DNS switch preparation
T-0: DNS cutover and traffic switch
T+1 hour: Full system monitoring and verification
T+4 hours: Launch announcement and user communication
T+24 hours: Post-launch review and optimization
```

---

## 🎯 SUCCESS METRICS

### Key Performance Indicators
- **Uptime Target:** 99.9% (8.77 hours downtime/year)
- **Response Time:** < 200ms for 95th percentile
- **Error Rate:** < 0.1% for critical endpoints
- **Payment Success Rate:** > 99.5%
- **User Satisfaction:** > 4.5/5 average rating

### Monitoring Dashboard KPIs
1. Real-time system health
2. User engagement metrics
3. Payment processing status
4. Course completion rates
5. Support ticket volume
6. Performance metrics
7. Security incident tracking

**Deployment Status:** 🟢 **READY FOR PRODUCTION**  
**Estimated Launch Timeline:** 5-7 days with proper preparation