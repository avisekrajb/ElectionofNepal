const Feedback = require('../models/Feedback');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public (but requires registration data)
const submitFeedback = async (req, res) => {
  try {
    const { name, age, message } = req.body;

    // Validate input
    if (!name || !age || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, age, and feedback message' 
      });
    }

    // Age validation
    if (age < 18 || age > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Age must be between 18 and 100 years' 
      });
    }

    // Message length validation
    if (message.length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Feedback message must be at least 5 characters' 
      });
    }

    if (message.length > 500) {
      return res.status(400).json({ 
        success: false, 
        message: 'Feedback message cannot exceed 500 characters' 
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      name: name.trim(),
      age,
      message: message.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Our team will review it soon.',
      data: {
        feedbackId: feedback._id,
        name: feedback.name,
        message: feedback.message
      }
    });

  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get all feedbacks (public)
// @route   GET /api/feedback
// @access  Public
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .select('name age message createdAt status adminReply repliedAt')
      .limit(50); // Limit to 50 latest feedbacks

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });

  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get feedback count
// @route   GET /api/feedback/count
// @access  Public
const getFeedbackCount = async (req, res) => {
  try {
    const count = await Feedback.countDocuments();
    
    res.status(200).json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Feedback count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

module.exports = {
  submitFeedback,
  getAllFeedbacks,
  getFeedbackCount
};