const Vote = require('../models/Vote');
const { CANDIDATES } = require('../utils/candidates');

// @desc    Cast a vote
// @route   POST /api/votes
// @access  Public
const castVote = async (req, res) => {
  try {
    const { name, age, candidateId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate input
    if (!name || !age || !candidateId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, age, and candidate ID' 
      });
    }

    // Age validation
    if (age < 18 || age > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Age must be between 18 and 100 years' 
      });
    }

    // Check if user has already voted (based on name and age)
    const existingVote = await Vote.findOne({ name: name.trim(), age });
    
    if (existingVote) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already voted. If this is an error, please contact admin on WhatsApp: +977-9800000000' 
      });
    }

    // Find candidate
    const candidate = CANDIDATES.find(c => c.id === candidateId);
    
    if (!candidate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid candidate ID' 
      });
    }

    // Create vote
    const vote = await Vote.create({
      name: name.trim(),
      age,
      candidateId,
      candidateName: candidate.name,
      candidateParty: candidate.party,
      ipAddress
    });

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully!',
      data: {
        voteId: vote._id,
        candidateName: candidate.name,
        candidateParty: candidate.party
      }
    });

  } catch (error) {
    console.error('Vote error:', error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'You have already voted. If this is an error, please contact admin on WhatsApp: +977-9800000000' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get vote statistics
// @route   GET /api/votes/stats
// @access  Public
const getVoteStats = async (req, res) => {
  try {
    // Get total votes count
    const totalVotes = await Vote.countDocuments();

    // Get votes per candidate
    const votesByCandidate = await Vote.aggregate([
      {
        $group: {
          _id: '$candidateId',
          candidateName: { $first: '$candidateName' },
          candidateParty: { $first: '$candidateParty' },
          votes: { $sum: 1 }
        }
      },
      { $sort: { votes: -1 } }
    ]);

    // Get recent votes (last 10) for marquee
    const recentVotes = await Vote.find()
      .sort({ votedAt: -1 })
      .limit(10)
      .select('name candidateParty votedAt');

    res.status(200).json({
      success: true,
      data: {
        totalVotes,
        votesByCandidate,
        recentVotes
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get recent votes for marquee
// @route   GET /api/votes/recent
// @access  Public
const getRecentVotes = async (req, res) => {
  try {
    const recentVotes = await Vote.find()
      .sort({ votedAt: -1 })
      .limit(20)
      .select('name candidateParty candidateName votedAt');

    res.status(200).json({
      success: true,
      data: recentVotes
    });

  } catch (error) {
    console.error('Recent votes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get all votes (admin only)
// @route   GET /api/votes/admin/all
// @access  Private (in real app, add authentication)
const getAllVotes = async (req, res) => {
  try {
    // In real app, check admin authentication here
    // For demo purposes, we'll allow access
    // const isAdmin = req.user?.role === 'admin';
    // if (!isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const votes = await Vote.find()
      .sort({ votedAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes
    });

  } catch (error) {
    console.error('Get all votes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get age distribution statistics
// @route   GET /api/votes/admin/age-stats
// @access  Private (admin only)
const getAgeStats = async (req, res) => {
  try {
    const votes = await Vote.find().select('age');
    
    const ages = votes.map(v => v.age);
    const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
    const min = Math.min(...ages);
    const max = Math.max(...ages);
    
    const ageGroups = {
      '18-25': votes.filter(v => v.age >= 18 && v.age <= 25).length,
      '26-35': votes.filter(v => v.age >= 26 && v.age <= 35).length,
      '36-45': votes.filter(v => v.age >= 36 && v.age <= 45).length,
      '46+': votes.filter(v => v.age >= 46).length
    };

    res.status(200).json({
      success: true,
      data: {
        averageAge: avg.toFixed(1),
        minAge: min,
        maxAge: max,
        ageGroups,
        totalVoters: votes.length
      }
    });

  } catch (error) {
    console.error('Age stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Get candidate-wise detailed statistics
// @route   GET /api/votes/admin/candidate-stats
// @access  Private (admin only)
const getCandidateStats = async (req, res) => {
  try {
    const votesByCandidate = await Vote.aggregate([
      {
        $group: {
          _id: '$candidateId',
          candidateName: { $first: '$candidateName' },
          candidateParty: { $first: '$candidateParty' },
          votes: { $sum: 1 },
          averageAge: { $avg: '$age' },
          youngestVoter: { $min: '$age' },
          oldestVoter: { $max: '$age' },
          voters: {
            $push: {
              name: '$name',
              age: '$age',
              votedAt: '$votedAt'
            }
          }
        }
      },
      { $sort: { votes: -1 } }
    ]);

    // Add candidate color and icon from CANDIDATES array
    const candidatesWithDetails = votesByCandidate.map(candidate => {
      const candidateDetails = CANDIDATES.find(c => c.id === candidate._id);
      return {
        ...candidate,
        color: candidateDetails?.color || '#64748b',
        icon: candidateDetails?.icon || '🗳️'
      };
    });

    res.status(200).json({
      success: true,
      data: candidatesWithDetails
    });

  } catch (error) {
    console.error('Candidate stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// @desc    Delete all votes (admin only - for testing)
// @route   DELETE /api/votes/admin/reset
// @access  Private (admin only)
const resetVotes = async (req, res) => {
  try {
    // In production, add proper authentication
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Unauthorized' });
    // }

    await Vote.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: 'All votes have been reset',
      data: {
        deletedCount: await Vote.countDocuments()
      }
    });

  } catch (error) {
    console.error('Reset votes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

module.exports = {
  castVote,
  getVoteStats,
  getRecentVotes,
  getAllVotes,
  getAgeStats,
  getCandidateStats,
  resetVotes
};