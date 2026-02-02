const express = require('express');
const router = express.Router();
const { 
  castVote, 
  getVoteStats, 
  getRecentVotes,
  getAllVotes,
  getAgeStats,
  getCandidateStats,
  resetVotes
} = require('../controllers/voteController');

// Rate limiting
const rateLimit = require('express-rate-limit');

const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many voting attempts. Please try again later.' 
  }
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests. Please try again later.' 
  }
});

// Public routes
router.post('/', voteLimiter, castVote);
router.get('/stats', getVoteStats);
router.get('/recent', getRecentVotes);

// Admin routes
router.get('/admin/all', adminLimiter, getAllVotes);
router.get('/admin/age-stats', adminLimiter, getAgeStats);
router.get('/admin/candidate-stats', adminLimiter, getCandidateStats);
router.delete('/admin/reset', adminLimiter, resetVotes);

module.exports = router;