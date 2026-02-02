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

// Load environment variables
dotenv.config({ path: '.env.production' });


// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\n📝 Please create a .env file with the following variables:');
  console.log('PORT=5000');
  console.log('MONGODB_URI=mongodb://localhost:27017/nepal-election');
  console.log('NODE_ENV=production');
  console.log('\n🔧 For Render.com deployment:');
  console.log('1. Add MONGODB_URI in Render dashboard');
  console.log('2. Set NODE_ENV to production');
  process.exit(1);
}

// Connect to database
connectDB();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://nepal-election-backend.onrender.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ==================== PERFORMANCE OPTIMIZATION ====================
if (isProduction) {
  // Enable compression for production
  app.use(compression());
  
  // HTTP request logging for production
  app.use(morgan('combined'));
  
  console.log('✅ Production optimizations enabled:');
  console.log('   - Compression enabled');
  console.log('   - Morgan logging enabled');
} else {
  // Development logging
  app.use(morgan('dev'));
}
// Replace your CORS configuration with this:

// CORS configuration for production
const allowedOrigins = [
  'https://nepalvote.onrender.com', // Your frontend URL
  'https://electionofnepal.onrender.com', // Your backend URL
  'http://localhost:3000', // Local development
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://192.168.1.67:3000' // Mobile access
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());
// ==================== BODY PARSER ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100000
}));

// ==================== RATE LIMITING ====================
const rateLimitWindow = isProduction ? 15 * 60 * 1000 : 60 * 1000; // 15 min in prod, 1 min in dev
const rateLimitMax = isProduction ? 100 : 1000; // 100 in prod, 1000 in dev

const generalLimiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: { 
    success: false, 
    message: 'Too many requests from this IP, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.ip;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

app.use('/api', generalLimiter);

// ==================== REQUEST LOGGING ====================
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  
  next();
});

// ==================== ROUTES ====================
app.use('/api/votes', voteRoutes);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    message: '🚀 Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A'
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    }
  };
  
  // If database is not connected, return 503
  if (mongoose.connection.readyState !== 1) {
    healthCheck.success = false;
    healthCheck.message = 'Server is running but database is disconnected';
    return res.status(503).json(healthCheck);
  }
  
  res.status(200).json(healthCheck);
});

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🇳🇵 Welcome to Nepal Election 2026 API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/yourusername/nepal-election-vote',
    endpoints: {
      votes: '/api/votes',
      stats: '/api/votes/stats',
      recent: '/api/votes/recent',
      health: '/health'
    },
    admin: {
      all_votes: '/api/votes/admin/all',
      age_stats: '/api/votes/admin/age-stats',
      candidate_stats: '/api/votes/admin/candidate-stats'
    }
  });
});

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    available_routes: {
      api: '/api/votes',
      health: '/health',
      home: '/'
    }
  });
});

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;

// Handle Render.com's specific port requirements
const renderPort = process.env.PORT || 10000;

const server = app.listen(renderPort, '0.0.0.0', () => {
  const actualPort = server.address().port;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 NEPAL ELECTION 2026 - BACKEND SERVER`);
  console.log('='.repeat(60));
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Port: ${actualPort}`);
  console.log(`🌐 URL: http://localhost:${actualPort}`);
  console.log(`📊 API: http://localhost:${actualPort}/api`);
  console.log(`🔧 Health: http://localhost:${actualPort}/health`);
  console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  
  if (isProduction) {
    console.log(`⚡ Production mode: Enabled`);
    console.log(`🔒 Security: Enhanced`);
    console.log(`📈 Performance: Optimized`);
  } else {
    console.log(`🔧 Development mode: Enabled`);
    console.log(`🐛 Debugging: Available`);
  }
  
  console.log('='.repeat(60));
  console.log('🇳🇵 Server started successfully!');
  console.log('='.repeat(60) + '\n');
  
  // Display MongoDB connection info (masked for security)
  if (mongoose.connection.readyState === 1) {
    const dbUri = process.env.MONGODB_URI || '';
    const maskedUri = dbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`📁 Database URI: ${maskedUri}`);
    console.log(`📊 Database Name: ${mongoose.connection.name}`);
    console.log(`🏠 Database Host: ${mongoose.connection.host}`);
  }
});

// ==================== ERROR HANDLERS ====================
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${renderPort} is already in use.`);
    console.error('Try:');
    console.error(`1. Change PORT in .env file`);
    console.error(`2. Kill process using port ${renderPort}`);
    console.error(`3. Wait a few minutes and try again`);
  }
  
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
const shutdown = (signal) => {
  console.log(`\n${signal} received: starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      console.log('👋 Graceful shutdown complete');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon restart

// ==================== EXPORT FOR TESTING ====================
module.exports = { app, server };
