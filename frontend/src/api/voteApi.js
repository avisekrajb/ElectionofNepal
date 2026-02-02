import axios from 'axios';

// Get the current hostname to determine API URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  console.log('Current hostname:', hostname);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  
  // Production URLs (update these with your actual Render URLs)
  if (hostname === 'nepalvote.onrender.com') {
    return 'https://electionofnepal.onrender.com/api';
  }
  
  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Mobile/network access
  if (hostname === '192.168.1.67') {
    return 'http://192.168.1.67:5000/api';
  }
  
  // Default - use environment variable or fallback
  return process.env.REACT_APP_API_URL || 'https://electionofnepal.onrender.com/api';
};

console.log('API Base URL:', getApiBaseUrl());

// Create axios instance with PRODUCTION configuration
const API = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 second timeout for production
  withCredentials: false,
  // Important: Add these for production
  crossDomain: true,
  // This tells the browser to include credentials (cookies) in cross-origin requests
  withCredentials: false // Set to true if you're using cookies/sessions
});

// ==================== REQUEST INTERCEPTOR ====================
API.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
API.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    let errorMessage = 'Network error. Please check your connection.';
    let errorCode = 'NETWORK_ERROR';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
      errorCode = 'TIMEOUT';
    } else if (error.response) {
      // Server responded with error status
      errorCode = `HTTP_${error.response.status}`;
      
      if (error.response.status === 404) {
        errorMessage = 'API endpoint not found. Please check the backend server.';
      } else if (error.response.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      } else if (error.response.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access forbidden. Please check permissions.';
      } else if (error.response.status === 401) {
        errorMessage = 'Unauthorized access. Please login again.';
      } else {
        errorMessage = error.response.data?.message || 
                      `Server error: ${error.response.status}`;
      }
      
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
        baseURL: error.config.baseURL
      });
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Cannot connect to server. Please check:';
      errorCode = 'NO_RESPONSE';
      
      console.error('❌ No response received. Possible issues:');
      console.error('   - Backend server not running');
      console.error('   - CORS configuration issue');
      console.error('   - Network connectivity problem');
      console.error(`   - Incorrect API URL: ${error.config?.baseURL}`);
    } else {
      // Something else happened
      errorMessage = error.message;
      errorCode = 'CLIENT_ERROR';
    }
    
    // Check for CORS errors specifically
    if (error.message && error.message.includes('CORS') || 
        error.message && error.message.includes('Access-Control-Allow-Origin')) {
      errorMessage = 'CORS Error: Backend is not configured to accept requests from this domain.';
      errorCode = 'CORS_ERROR';
      
      console.error('⚠️ CORS ERROR DETECTED:');
      console.error('   Frontend URL:', window.location.origin);
      console.error('   Backend URL:', error.config?.baseURL);
      console.error('   Solution: Check backend CORS configuration');
    }
    
    // Special handling for duplicate vote
    if (errorMessage.includes('WhatsApp') || errorMessage.includes('already voted')) {
      return Promise.reject({ 
        success: false, 
        message: errorMessage,
        contactAdmin: true,
        code: errorCode,
        timestamp: new Date().toISOString()
      });
    }
    
    return Promise.reject({ 
      success: false, 
      message: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
);

// ==================== API FUNCTIONS ====================

// Test server connection
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', API.defaults.baseURL);
    const response = await API.get('/health');
    console.log('✅ Server health check:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Server connection test failed:', error);
    throw error;
  }
};

// Cast a vote
export const castVote = async (voteData) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Casting vote:', voteData);
    }
    const response = await API.post('/votes', voteData);
    return response.data;
  } catch (error) {
    console.error('❌ Vote cast failed:', error);
    throw error;
  }
};

// Get vote statistics
export const getVoteStats = async () => {
  try {
    const response = await API.get('/votes/stats');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch vote stats:', error);
    throw error;
  }
};

// Get recent votes for marquee
export const getRecentVotes = async () => {
  try {
    const response = await API.get('/votes/recent');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recent votes:', error);
    throw error;
  }
};

// Get all votes (admin only)
export const getAllVotes = async () => {
  try {
    const response = await API.get('/votes/admin/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all votes:', error);
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch votes' 
    };
  }
};

// Get age statistics (admin only)
export const getAgeStats = async () => {
  try {
    const response = await API.get('/votes/admin/age-stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch age statistics:', error);
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch age statistics' 
    };
  }
};

// Get candidate statistics (admin only)
export const getCandidateStats = async () => {
  try {
    const response = await API.get('/votes/admin/candidate-stats');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch candidate statistics:', error);
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch candidate statistics' 
    };
  }
};

// Reset all votes (admin only - for testing)
export const resetVotes = async () => {
  try {
    const response = await API.delete('/votes/admin/reset');
    return response.data;
  } catch (error) {
    console.error('Failed to reset votes:', error);
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to reset votes' 
    };
  }
};

// Export all functions
export default API;
