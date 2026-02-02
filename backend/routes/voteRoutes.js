// backend/routes/voteRoutes.js
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

// Public routes
router.post('/', castVote);
router.get('/stats', getVoteStats);
router.get('/recent', getRecentVotes);

// Admin routes
router.get('/admin/all', getAllVotes);
router.get('/admin/age-stats', getAgeStats);
router.get('/admin/candidate-stats', getCandidateStats);
router.delete('/admin/reset', resetVotes);

module.exports = router;
