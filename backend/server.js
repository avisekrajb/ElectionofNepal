const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const voteRoutes = require('./routes/voteRoutes');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

// Load environment variables based on environment
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

console.log('='.repeat(60));
console.log('🚀 STARTING NEPAL ELECTION 2026 BACKEND');
console.log('='.repeat(60));
console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📄 Config file: ${envFile}`);

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  
  console.log('\n📝 CREATE A .env FILE WITH THESE VARIABLES:');
  console.log('PORT=5000');
  console.log('MONGODB_URI=mongodb+srv://your_mongodb_uri');
  console.log('NODE_ENV=production');
  
  console.log('\n🔧 FOR RENDER.COM DEPLOYMENT:');
  console.log('1. Go to Render.com dashboard');
  console.log('2. Navigate to your service → Environment');
  console.log('3. Add MONGODB_URI variable');
  console.log('4. Set NODE_ENV to production');
  console.log('='.repeat(60));
  
  process.exit(1);
}

// ============================================
// DATABASE CONNECTION
// ============================================

// Connect to MongoDB with retry logic
let dbConnectionRetries = 0;
const maxDbRetries = 5;

const initializeDB = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (dbConnectionRetries < maxDbRetries) {
      dbConnectionRetries++;
      console.log(`🔄 Retrying database connection (attempt ${dbConnectionRetries}/${maxDbRetries})...`);
      setTimeout(initializeDB, 5000); // Retry after 5 seconds
    } else {
      console.error('❌ Max database connection retries reached. Exiting...');
      process.exit(1);
    }
  }
};

initializeDB();

// ============================================
// EXPRESS APP INITIALIZATION
// ============================================

const app = express();

// ============================================
// CORS CONFIGURATION (THE FIX)
// ============================================

console.log('\n🔧 CONFIGURING CORS...');

// Define allowed origins
const allowedOrigins = [
  'https://nepalvote.onrender.com',        // Your production frontend
  'https://electionofnepal.onrender.com',  // Your production backend
  'http://localhost:3000',                 // Local development
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://192.168.1.67:3000',              // Mobile/LAN access
  'http://192.168.1.65:3000',              // Additional mobile
  'https://electionofnepal.netlify.app',   // If using Netlify
  'https://*.onrender.com'                 // All Render.com subdomains
];

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌍 CORS Check - Origin:', origin || 'No origin (server-to-server)');
    
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow all Render.com domains in production
    if (isProduction && origin.endsWith('.onrender.com')) {
      console.log(`✅ Allowing Render.com origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow all localhost domains in development
    if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      console.log(`✅ Allowing local origin: ${origin}`);
      return callback(null, true);
    }
    
    // Check against allowed origins list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(allowedOrigin.replace('*', '.*'));
        return regex.test(origin);
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      console.log(`✅ Allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ Blocked origin: ${origin}`);
      console.log(`📋 Allowed origins:`, allowedOrigins);
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-ID',
    'X-Response-Time',
    'Access-Control-Allow-Headers'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'X-Response-Time',
    'X-Request-ID',
    'Access-Control-Allow-Origin'
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Add CORS headers middleware (as additional backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin should be allowed
  const shouldAllowOrigin = !origin || 
    origin.endsWith('.onrender.com') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    allowedOrigins.includes(origin);
  
  if (shouldAllowOrigin && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Request-ID');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range, X-Response-Time, X-Request-ID');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

console.log('✅ CORS configured for origins:', allowedOrigins);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

console.log('\n🔒 CONFIGURING SECURITY...');

// Helmet security headers (with CSP adjusted for development)
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://*.onrender.com", "http://localhost:*", "ws://localhost:*"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

console.log('✅ Security headers configured');

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

console.log('\n⚡ CONFIGURING PERFORMANCE...');

// Enable compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// HTTP request logging
if (isProduction) {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, // Only log errors in production
    stream: process.stderr
  }));
  
  // Also log successful requests to separate stream
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode >= 400,
    stream: process.stdout
  }));
} else {
  app.use(morgan('dev'));
}

console.log('✅ Performance optimizations enabled');

// ============================================
// BODY PARSERS
// ============================================

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100000
}));

console.log('✅ Body parsers configured');

// ============================================
// RATE LIMITING
// ============================================

console.log('\n🛡️ CONFIGURING RATE LIMITING...');

const rateLimitWindow = isProduction ? 15 * 60 * 1000 : 60 * 1000; // 15 min in prod, 1 min in dev
const rateLimitMax = isProduction ? 100 : 1000; // 100 req/15min in prod, 1000 req/min in dev

const generalLimiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: { 
    success: false, 
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  },
  keyGenerator: (req) => {
    // Use IP + user agent for better rate limiting
    return req.ip + '|' + (req.headers['user-agent'] || 'unknown');
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

// Apply rate limiting to all API routes
app.use('/api', generalLimiter);

// More strict rate limiting for voting
const voteLimiter = rateLimit({
  windowMs: isProduction ? 60 * 1000 : 30 * 1000, // 1 min in prod, 30 sec in dev
  max: isProduction ? 5 : 10, // 5 votes/min in prod, 10 votes/30sec in dev
  message: {
    success: false,
    message: 'Too many vote attempts. Please wait a moment before trying again.'
  },
  skip: (req) => req.method !== 'POST', // Only limit POST requests
  keyGenerator: (req) => {
    // Use IP for vote limiting
    return req.ip;
  }
});

app.use('/api/votes', voteLimiter);

console.log('✅ Rate limiting configured');

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================

app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Add request ID to request and response
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  if (!isProduction || req.path !== '/health') {
    console.log(`📥 [${requestId}] ${req.method} ${req.originalUrl} - IP: ${req.ip} - UA: ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);
  }
  
  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    const emoji = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '🔄' : '✅';
    
    if (!isProduction || res.statusCode >= 400 || req.path !== '/health') {
      console.log(`${emoji} [${requestId}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - Size: ${res.get('Content-Length') || 0} bytes`);
    }
  });
  
  // Capture response close (client disconnected)
  res.on('close', () => {
    const duration = Date.now() - start;
    if (duration > 10000) { // Log if request took > 10 seconds
      console.warn(`⚠️ [${requestId}] Client disconnected after ${duration}ms - ${req.method} ${req.originalUrl}`);
    }
  });
  
  next();
});

// ============================================
// ROUTES
// ============================================

console.log('\n🛣️  LOADING ROUTES...');

// API routes
app.use('/api/votes', voteRoutes);

console.log('✅ Routes loaded');

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: '🚀 Nepal Election 2026 Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    requestId: req.requestId,
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
      models: Object.keys(mongoose.models || {}).length
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      cwd: process.cwd()
    },
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin || 'No origin header'
    }
  };
  
  // If database is not connected, return 503
  if (mongoose.connection.readyState !== 1) {
    healthCheck.success = false;
    healthCheck.message = '⚠️ Server is running but database is disconnected';
    healthCheck.database.status = 'disconnected';
    return res.status(503).json(healthCheck);
  }
  
  res.status(200).json(healthCheck);
});

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🇳🇵 Welcome to Nepal Election 2026 Voting System API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/yourusername/nepal-election-vote',
    endpoints: {
      votes: '/api/votes',
      stats: '/api/votes/stats',
      recent: '/api/votes/recent',
      health: '/health',
      home: '/'
    },
    admin: {
      all_votes: '/api/votes/admin/all',
      age_stats: '/api/votes/admin/age-stats',
      candidate_stats: '/api/votes/admin/candidate-stats',
      reset: '/api/votes/admin/reset'
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin || 'No origin header'
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// ============================================
// SERVER INFORMATION ENDPOINT
// ============================================

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    server: {
      name: 'Nepal Election 2026 Backend',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'N/A'
    },
    limits: {
      rateLimit: `${rateLimitMax} requests per ${rateLimitWindow / 60000} minutes`,
      bodySize: '10MB',
      voteLimit: `${isProduction ? 5 : 10} votes per ${isProduction ? 'minute' : '30 seconds'}`
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins.filter(origin => !origin.includes('*')),
      credentials: true
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    available_routes: {
      api: {
        cast_vote: 'POST /api/votes',
        get_stats: 'GET /api/votes/stats',
        get_recent: 'GET /api/votes/recent',
        health: 'GET /health',
        info: 'GET /api/info'
      },
      admin: {
        all_votes: 'GET /api/votes/admin/all (admin only)',
        age_stats: 'GET /api/votes/admin/age-stats (admin only)',
        candidate_stats: 'GET /api/votes/admin/candidate-stats (admin only)',
        reset: 'DELETE /api/votes/admin/reset (admin only)'
      }
    },
    suggestion: 'Check the / endpoint for complete API documentation'
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

app.use(errorHandler);

// Global error handler (catches any unhandled errors)
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body
  });
  
  // Don't leak stack trace in production
  const errorResponse = {
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };
  
  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// ============================================
// SERVER STARTUP
// ============================================

// Determine port (Render.com uses process.env.PORT)
const PORT = process.env.PORT || 5000;

// For Render.com compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
  const actualPort = server.address().port;
  const address = server.address().address;
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 NEPAL ELECTION 2026 - BACKEND SERVER STARTED');
  console.log('='.repeat(70));
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Host: ${address}`);
  console.log(`🔌 Port: ${actualPort}`);
  console.log(`🌐 Local URL: http://localhost:${actualPort}`);
  console.log(`🌍 Network URL: http://${address}:${actualPort}`);
  console.log(`📊 API Base: http://localhost:${actualPort}/api`);
  console.log(`🔧 Health Check: http://localhost:${actualPort}/health`);
  console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  
  if (mongoose.connection.readyState === 1) {
    console.log(`📁 Database Name: ${mongoose.connection.name}`);
    console.log(`🏠 Database Host: ${mongoose.connection.host}`);
    console.log(`📈 Database Models: ${Object.keys(mongoose.models || {}).length}`);
  }
  
  console.log('\n🔧 FEATURES:');
  console.log(`   ✅ CORS Enabled (${allowedOrigins.length} allowed origins)`);
  console.log(`   ✅ Rate Limiting (${rateLimitMax} req/${rateLimitWindow/60000}min)`);
  console.log(`   ✅ Compression Enabled`);
  console.log(`   ✅ Security Headers`);
  console.log(`   ✅ Request Logging`);
  console.log(`   ✅ Error Handling`);
  
  console.log('\n🛣️  AVAILABLE ENDPOINTS:');
  console.log(`   • GET  /               - API Documentation`);
  console.log(`   • GET  /health         - Health Check`);
  console.log(`   • GET  /api/info       - Server Info`);
  console.log(`   • POST /api/votes      - Cast a vote`);
  console.log(`   • GET  /api/votes/stats - Get voting statistics`);
  console.log(`   • GET  /api/votes/recent - Get recent votes`);
  
  console.log('\n👑 ADMIN ENDPOINTS:');
  console.log(`   • GET    /api/votes/admin/all          - Get all votes`);
  console.log(`   • GET    /api/votes/admin/age-stats    - Get age statistics`);
  console.log(`   • GET    /api/votes/admin/candidate-stats - Get candidate stats`);
  console.log(`   • DELETE /api/votes/admin/reset        - Reset all votes`);
  
  console.log('\n🌐 CORS ALLOWED ORIGINS:');
  allowedOrigins.forEach(origin => console.log(`   • ${origin}`));
  
  console.log('='.repeat(70));
  console.log('✅ Server is ready to accept requests!');
  console.log('='.repeat(70));
  
  // Log MongoDB URI (masked for security)
  if (process.env.MONGODB_URI) {
    const maskedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔐 MongoDB URI: ${maskedUri}`);
  }
});

// ============================================
// SERVER ERROR HANDLERS
// ============================================

server.on('error', (error) => {
  console.error('\n❌ SERVER STARTUP ERROR:');
  console.error('Error:', error.message);
  console.error('Code:', error.code);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('\nPossible solutions:');
    console.error('1. Change PORT environment variable');
    console.error('2. Kill the process using port', PORT);
    console.error('   On Linux/Mac: lsof -ti:${PORT} | xargs kill -9');
    console.error('   On Windows: netstat -ano | findstr :${PORT}');
    console.error('3. Wait a few minutes for the port to be released');
    console.error('4. Use a different port');
  } else if (error.code === 'EACCES') {
    console.error('\nPermission denied. Cannot use port', PORT);
    console.error('Try using a port above 1024 (e.g., 5000, 8080, 3000)');
  }
  
  process.exit(1);
});

// ============================================
// UNHANDLED EXCEPTION HANDLERS
// ============================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED PROMISE REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('\nStack trace:', reason.stack);
  
  // Don't exit in production, just log
  if (!isProduction) {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  
  // Graceful shutdown
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const shutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false, (err) => {
      if (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
      
      console.log('✅ MongoDB connection closed');
      console.log('👋 Graceful shutdown complete');
      process.exit(0);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM')); // Render.com shutdown signal
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart

// ============================================
// EXPORT FOR TESTING
// ============================================

module.exports = { app, server, allowedOrigins };
