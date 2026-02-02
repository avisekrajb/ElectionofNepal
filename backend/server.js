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

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

// Load environment variables
dotenv.config({ path: '.env.production' });

console.log('='.repeat(60));
console.log('🚀 STARTING NEPAL ELECTION 2026 BACKEND');
console.log('='.repeat(60));
console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MISSING MONGODB_URI environment variable');
  console.log('\n🔧 FOR RENDER.COM DEPLOYMENT:');
  console.log('1. Go to Render.com dashboard → Backend service → Environment');
  console.log('2. Add MONGODB_URI variable with your MongoDB connection string');
  console.log('3. Format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
  process.exit(1);
}

// ============================================
// DATABASE CONNECTION
// ============================================

console.log('\n🔗 CONNECTING TO DATABASE...');

// Connect to MongoDB
connectDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  console.log('\n💡 TROUBLESHOOTING:');
  console.log('1. Check your MONGODB_URI in Render.com environment variables');
  console.log('2. Verify MongoDB cluster allows connections from anywhere (0.0.0.0/0)');
  console.log('3. Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0');
  console.log('4. Check MongoDB Atlas network access settings');
  process.exit(1);
});

const app = express();

// ============================================
// CORS CONFIGURATION
// ============================================

console.log('\n🔧 CONFIGURING CORS...');

const allowedOrigins = [
  'https://nepalvote.onrender.com',
  'https://electionofnepal.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://192.168.1.67:3000'
];

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Allow Render.com and local origins
    if (origin.endsWith('.onrender.com') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin.includes('192.168.')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests
app.options('*', cors());

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && (origin.endsWith('.onrender.com') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

console.log('✅ CORS configured');

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simplicity
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression
app.use(compression());

// Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// RATE LIMITING
// ============================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests from this IP' 
  }
});

app.use(limiter);

// ============================================
// ROUTES - CRITICAL: Mount voteRoutes at root
// ============================================

console.log('\n🛣️  LOADING ROUTES...');

// FIX: Mount voteRoutes at /api/votes
app.use('/api/votes', voteRoutes);

console.log('✅ Routes loaded:');
console.log('   • POST /api/votes - Cast vote');
console.log('   • GET  /api/votes/stats - Get stats');
console.log('   • GET  /api/votes/recent - Get recent votes');
console.log('   • GET  /api/votes/admin/* - Admin routes');

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  const health = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV
  };
  
  res.status(200).json(health);
});

// ============================================
// API INFO ENDPOINT
// ============================================

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Nepal Election 2026 API',
    version: '1.0.0',
    endpoints: {
      vote: 'POST /api/votes',
      stats: 'GET /api/votes/stats',
      recent: 'GET /api/votes/recent',
      health: 'GET /health'
    },
    admin: {
      all_votes: 'GET /api/votes/admin/all',
      age_stats: 'GET /api/votes/admin/age-stats',
      candidate_stats: 'GET /api/votes/admin/candidate-stats',
      reset: 'DELETE /api/votes/admin/reset'
    }
  });
});

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Nepal Election 2026 Backend API',
    version: '1.0.0',
    documentation: 'Visit /api for endpoint details',
    health: '/health',
    frontend: 'https://nepalvote.onrender.com'
  });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    available_routes: {
      api: '/api',
      health: '/health',
      vote: 'POST /api/votes',
      stats: 'GET /api/votes/stats',
      recent: 'GET /api/votes/recent'
    }
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('✅ SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`🔗 API: http://0.0.0.0:${PORT}/api`);
  console.log(`❤️  Health: http://0.0.0.0:${PORT}/health`);
  console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  
  if (mongoose.connection.readyState === 1) {
    console.log(`📁 DB Name: ${mongoose.connection.name}`);
  }
  
  console.log('\n🛣️  AVAILABLE ENDPOINTS:');
  console.log(`   • POST /api/votes - Cast a vote`);
  console.log(`   • GET  /api/votes/stats - Get statistics`);
  console.log(`   • GET  /api/votes/recent - Get recent votes`);
  console.log(`   • GET  /health - Health check`);
  
  console.log('\n🌐 FRONTEND URL:');
  console.log(`   • https://nepalvote.onrender.com`);
  
  console.log('='.repeat(60));
});

// ============================================
// ERROR HANDLING
// ============================================

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = { app, server };
