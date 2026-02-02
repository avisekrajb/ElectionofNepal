const express = require('express');
const router = express.Router();
const { 
  submitFeedback, 
  getAllFeedbacks, 
  getFeedbackCount 
} = require('../controllers/feedbackController');

const rateLimit = require('express-rate-limit');

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 feedback submissions per hour
  message: { 
    success: false, 
    message: 'Too many feedback submissions. Please try again later.' 
  }
});

router.post('/', feedbackLimiter, submitFeedback);
router.get('/', getAllFeedbacks);
router.get('/count', getFeedbackCount);

module.exports = router;