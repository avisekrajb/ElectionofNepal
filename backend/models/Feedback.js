const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'replied'],
    default: 'pending'
  },
  adminReply: {
    type: String,
    default: ''
  },
  repliedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;