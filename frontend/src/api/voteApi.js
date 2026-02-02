import axios from 'axios';

// ============================================
// API URL CONFIGURATION
// ============================================

const getApiBaseUrl = () => {
  // Use environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Production (Render.com)
  if (window.location.hostname.includes('nepalvote.onrender.com')) {
    return 'https://electionofnepal.onrender.com/api';
  }
  
  // Development
  if (window.location.hostname.includes('localhost') || 
      window.location.hostname.includes('127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  
  // Mobile/LAN
  if (window.location.hostname.startsWith('192.168.')) {
    return `http://${window.location.hostname}:5000/api`;
  }
  
  // Fallback
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🌍 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  frontend: window.location.origin
});

// ============================================
// AXIOS INSTANCE
// ============================================

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
  withCredentials: false,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

API.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 Request: ${config.method} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

API.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    let errorMessage = 'Network error. Please check your connection.';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 400:
          errorMessage = error.response.data?.message || 'Bad request.';
          break;
        case 404:
          errorMessage = error.response.data?.message || 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.response.data?.message || `Error: ${status}`;
      }
    } else if (error.request) {
      errorMessage = 'Cannot connect to server. Please check:';
      errorMessage += '\n1. Is the backend server running?';
      errorMessage += '\n2. Check console for CORS errors';
      errorMessage += '\n3. Verify network connection';
    }
    
    console.error('❌ API Error:', errorMessage);
    
    return Promise.reject({ 
      success: false, 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================
// API FUNCTIONS - ALL FUNCTIONS INCLUDED
// ============================================

// Cast a vote
const castVote = async (voteData) => {
  try {
    console.log('🗳️ Casting vote to:', `${API_BASE_URL}/votes`);
    
    const response = await API.post('/votes', voteData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to cast vote');
    }
    
    console.log('✅ Vote cast successful');
    return response.data;
  } catch (error) {
    console.error('❌ Vote cast failed:', error.message);
    throw error.response?.data || error;
  }
};

// Get vote statistics
const getVoteStats = async () => {
  try {
    console.log('📊 Fetching vote stats from:', `${API_BASE_URL}/votes/stats`);
    
    const response = await API.get('/votes/stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch vote stats');
    }
    
    console.log('✅ Vote stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch vote stats:', error.message);
    
    // Fallback for development
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        data: {
          totalVotes: 1250,
          votesByCandidate: [
            { candidateName: 'Candidate A', votes: 450, percentage: 36 },
            { candidateName: 'Candidate B', votes: 380, percentage: 30.4 },
            { candidateName: 'Candidate C', votes: 280, percentage: 22.4 },
            { candidateName: 'Candidate D', votes: 140, percentage: 11.2 }
          ]
        }
      };
    }
    
    throw error.response?.data || error;
  }
};

// Get recent votes
const getRecentVotes = async (limit = 10) => {
  try {
    console.log('🔄 Fetching recent votes from:', `${API_BASE_URL}/votes/recent`);
    
    const response = await API.get('/votes/recent', { params: { limit } });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recent votes');
    }
    
    console.log('✅ Recent votes fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recent votes:', error.message);
    
    // Fallback for development
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        data: Array.from({ length: 5 }, (_, i) => ({
          candidateName: ['Candidate A', 'Candidate B', 'Candidate C', 'Candidate D'][i % 4],
          age: 18 + Math.floor(Math.random() * 40),
          timestamp: new Date(Date.now() - i * 60000).toISOString()
        }))
      };
    }
    
    throw error.response?.data || error;
  }
};

// Get all votes (admin only)
const getAllVotes = async () => {
  try {
    console.log('👑 Fetching all votes (admin)...');
    
    const response = await API.get('/votes/admin/all');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch votes');
    }
    
    console.log('✅ All votes fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch all votes:', error.message);
    throw error.response?.data || error;
  }
};

// Get age statistics (admin only)
const getAgeStats = async () => {
  try {
    console.log('📈 Fetching age statistics...');
    
    const response = await API.get('/votes/admin/age-stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch age statistics');
    }
    
    console.log('✅ Age stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch age statistics:', error.message);
    throw error.response?.data || error;
  }
};

// Get candidate statistics (admin only)
const getCandidateStats = async () => {
  try {
    console.log('🎯 Fetching candidate statistics...');
    
    const response = await API.get('/votes/admin/candidate-stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch candidate statistics');
    }
    
    console.log('✅ Candidate stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch candidate statistics:', error.message);
    throw error.response?.data || error;
  }
};

// Reset all votes (admin only - for testing)
const resetVotes = async () => {
  try {
    console.log('🔄 Resetting all votes...');
    
    const response = await API.delete('/votes/admin/reset');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reset votes');
    }
    
    console.log('✅ Votes reset successful');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to reset votes:', error.message);
    throw error.response?.data || error;
  }
};

// Test connection
const testConnection = async () => {
  try {
    const response = await API.get('/health');
    return {
      success: true,
      connected: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      message: error.message
    };
  }
};

// Batch requests for dashboard data
const getDashboardData = async () => {
  try {
    const [stats, recent] = await Promise.all([
      getVoteStats(),
      getRecentVotes()
    ]);
    
    return {
      success: true,
      stats: stats.data,
      recent: recent.data
    };
  } catch (error) {
    console.error('❌ Failed to fetch dashboard data:', error);
    throw error;
  }
};

// Check backend status
const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return {
      accessible: response.ok,
      status: response.status,
      url: API_BASE_URL
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      url: API_BASE_URL
    };
  }
};

// ============================================
// EXPORTS - ALL FUNCTIONS EXPORTED
// ============================================

export default API;

export {
  API_BASE_URL,
  castVote,
  getVoteStats,
  getRecentVotes,
  getAllVotes,
  getAgeStats,
  getCandidateStats,
  resetVotes,
  testConnection,
  getDashboardData,
  checkBackendStatus
};
