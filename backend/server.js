// backend/server.js - Complete version
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const voteRoutes = require('./routes/voteRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes'); // Added feedback routes
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to simplify
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==================== CORS CONFIGURATION ====================
app.use(cors({
  origin: '*', // Allow all origins for now
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// ==================== MIDDLEWARE ====================
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== RATE LIMITING ====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests from this IP, please try again later.' 
  }
});

app.use('/api/', limiter);

// ==================== ROUTES ====================
// Mount vote routes at /api/votes
app.use('/api/votes', voteRoutes);

// Mount feedback routes at /api/feedback
app.use('/api/feedback', feedbackRoutes);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🇳🇵 Nepal Election 2026 API',
    version: '1.0.0',
    endpoints: {
      root: '/',
      health: '/health',
      vote: '/api/votes',
      feedback: '/api/feedback',
      stats: '/api/votes/stats',
      recent: '/api/votes/recent',
      admin_all: '/api/votes/admin/all',
      admin_age_stats: '/api/votes/admin/age-stats',
      admin_candidate_stats: '/api/votes/admin/candidate-stats'
    },
    documentation: 'Check GitHub repository for API documentation'
  });
});

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found`,
    available_routes: [
      { method: 'GET', path: '/', description: 'API Information' },
      { method: 'GET', path: '/health', description: 'Health Check' },
      { method: 'POST', path: '/api/votes', description: 'Cast a vote' },
      { method: 'POST', path: '/api/feedback', description: 'Submit feedback' },
      { method: 'GET', path: '/api/votes/stats', description: 'Get vote statistics' },
      { method: 'GET', path: '/api/votes/recent', description: 'Get recent votes' },
      { method: 'GET', path: '/api/votes/admin/all', description: 'Get all votes (admin)' },
      { method: 'GET', path: '/api/votes/admin/age-stats', description: 'Get age statistics (admin)' },
      { method: 'GET', path: '/api/votes/admin/candidate-stats', description: 'Get candidate statistics (admin)' }
    ]
  });
});

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 NEPAL ELECTION 2026 BACKEND SERVER`);
  console.log('='.repeat(60));
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  console.log('='.repeat(60));
  console.log('\n📋 Available Routes:');
  console.log('  GET  /                    - API Information');
  console.log('  GET  /health              - Health Check');
  console.log('  POST /api/votes           - Cast a vote');
  console.log('  POST /api/feedback        - Submit feedback');
  console.log('  GET  /api/votes/stats     - Vote statistics');
  console.log('  GET  /api/votes/recent    - Recent votes');
  console.log('  GET  /api/votes/admin/all - All votes (admin)');
  console.log('='.repeat(60));
});

module.exports = { app, server };
