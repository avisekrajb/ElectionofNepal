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
// API FUNCTIONS
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

// ============================================
// EXPORTS - FIXED: No duplicate exports
// ============================================

export default API;

export {
  API_BASE_URL,
  castVote,
  getVoteStats,
  getRecentVotes,
  testConnection
};
