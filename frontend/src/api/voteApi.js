import axios from 'axios';

// Get the current API URL dynamically
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is set, use it (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:5000/api`;
  }
  
  // Mobile/network access
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    return `http://${hostname}:5000/api`;
  }
  
  // Production - use same origin
  return '/api';
};

// Log API URL in development only
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', getApiBaseUrl());
  console.log('Environment:', process.env.NODE_ENV);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
}

// Create axios instance
const API = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: process.env.NODE_ENV === 'production' ? 15000 : 10000, // 15s in prod, 10s in dev
  withCredentials: false,
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if status code is less than 500
  }
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // Add cache busting for GET requests in development
    if (process.env.NODE_ENV === 'development' && config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // Log requests in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params || '');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // Log responses in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 API Response: ${response.status} ${response.config.url}`, response.data);
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
      const status = error.response.status;
      
      switch (status) {
        case 400:
          errorMessage = error.response.data?.message || 'Bad request. Please check your data.';
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'Access forbidden.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = error.response.data?.message || 'Resource not found.';
          errorCode = 'NOT_FOUND';
          break;
        case 409:
          errorMessage = error.response.data?.message || 'Conflict occurred.';
          errorCode = 'CONFLICT';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          errorCode = 'RATE_LIMIT';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          errorCode = 'SERVER_ERROR';
          break;
        case 503:
          errorMessage = 'Service unavailable. Please try again later.';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
        default:
          errorMessage = error.response.data?.message || `Server error: ${status}`;
          errorCode = `HTTP_${status}`;
      }
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('🔴 API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config.url,
          method: error.config.method
        });
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Cannot connect to server. Please check:';
      errorMessage += '\n1. Is the backend server running?';
      errorMessage += '\n2. Check console for CORS errors';
      errorMessage += '\n3. Verify network connection';
      errorCode = 'NO_RESPONSE';
      
      console.error('❌ No response received. Possible issues:');
      console.error('   - Backend server not running');
      console.error('   - CORS configuration issue');
      console.error('   - Network connectivity problem');
      console.error('   - Incorrect API URL:', getApiBaseUrl());
    } else {
      // Something else happened
      errorMessage = error.message;
      errorCode = 'UNKNOWN_ERROR';
    }
    
    // Special handling for duplicate vote
    if (errorMessage.includes('WhatsApp') || errorMessage.includes('already voted')) {
      return Promise.reject({ 
        success: false, 
        message: errorMessage,
        contactAdmin: true,
        code: errorCode
      });
    }
    
    // Return formatted error
    return Promise.reject({ 
      success: false, 
      message: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
);

// Test server connection
export const testConnection = async () => {
  try {
    const response = await API.get('/health');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Server health check:', response.data);
    }
    
    return {
      success: true,
      data: response.data,
      connected: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Server connection test failed:', error.message);
    
    return {
      success: false,
      message: error.message,
      connected: false,
      timestamp: new Date().toISOString(),
      suggestion: 'Make sure backend server is running on port 5000'
    };
  }
};

// Cast a vote
export const castVote = async (voteData) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🗳️ Casting vote:', voteData);
    }
    
    const response = await API.post('/votes', voteData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to cast vote');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Vote cast successful:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Vote cast failed:', error.message);
    
    // Re-throw the error for the calling component to handle
    throw error.response?.data || error;
  }
};

// Get vote statistics
export const getVoteStats = async () => {
  try {
    const response = await API.get('/votes/stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch vote stats');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Vote stats fetched:', response.data.data?.totalVotes || 0, 'total votes');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch vote stats:', error.message);
    
    // Return fallback data for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using fallback vote stats for development');
      return {
        success: true,
        data: {
          totalVotes: 0,
          votesByCandidate: [],
          recentVotes: []
        }
      };
    }
    
    throw error.response?.data || error;
  }
};

// Get recent votes for marquee
export const getRecentVotes = async () => {
  try {
    const response = await API.get('/votes/recent');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recent votes');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Recent votes fetched:', response.data.data?.length || 0, 'votes');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recent votes:', error.message);
    
    // Return empty array for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using empty recent votes for development');
      return {
        success: true,
        data: []
      };
    }
    
    throw error.response?.data || error;
  }
};

// Get all votes (admin only)
export const getAllVotes = async () => {
  try {
    const response = await API.get('/votes/admin/all');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch votes');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('👑 All votes fetched:', response.data.count || 0, 'votes');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch all votes:', error.message);
    throw error.response?.data || error;
  }
};

// Get age statistics (admin only)
export const getAgeStats = async () => {
  try {
    const response = await API.get('/votes/admin/age-stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch age statistics');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📈 Age stats fetched:', response.data.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch age statistics:', error.message);
    throw error.response?.data || error;
  }
};

// Get candidate statistics (admin only)
export const getCandidateStats = async () => {
  try {
    const response = await API.get('/votes/admin/candidate-stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch candidate statistics');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Candidate stats fetched:', response.data.data?.length || 0, 'candidates');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch candidate statistics:', error.message);
    throw error.response?.data || error;
  }
};

// Reset all votes (admin only - for testing)
export const resetVotes = async () => {
  try {
    const response = await API.delete('/votes/admin/reset');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reset votes');
    }
    
    console.log('🔄 Votes reset successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to reset votes:', error.message);
    throw error.response?.data || error;
  }
};

// Batch requests for better performance
export const getDashboardData = async () => {
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

// Export all functions
export default API;