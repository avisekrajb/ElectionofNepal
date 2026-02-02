import axios from 'axios';

// Production and development URLs
const PRODUCTION_CONFIG = {
  FRONTEND_URL: 'https://nepalvote.onrender.com',
  BACKEND_URL: 'https://electionofnepal.onrender.com',
  API_BASE: 'https://electionofnepal.onrender.com/api'
};

const DEVELOPMENT_CONFIG = {
  LOCAL_BACKEND: 'http://localhost:5000',
  LOCAL_API: 'http://localhost:5000/api',
  MOBILE_IP: '192.168.1.67',
  MOBILE_API: 'http://192.168.1.67:5000/api'
};

// Get the current API URL dynamically
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const currentUrl = window.location.origin;
  
  console.log('🌐 Current URL:', currentUrl);
  console.log('🏠 Hostname:', hostname);
  
  // Production environment
  if (hostname.includes('nepalvote.onrender.com')) {
    console.log('🚀 Production mode detected');
    return PRODUCTION_CONFIG.API_BASE;
  }
  
  // Development environments
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔧 Development mode (localhost)');
    return DEVELOPMENT_CONFIG.LOCAL_API;
  }
  
  // Mobile/network access
  if (hostname === DEVELOPMENT_CONFIG.MOBILE_IP) {
    console.log('📱 Mobile development mode');
    return DEVELOPMENT_CONFIG.MOBILE_API;
  }
  
  // Default to environment variable or relative path
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    console.log('⚙️ Using environment variable:', envUrl);
    return envUrl;
  }
  
  // Fallback to relative path for same-origin deployment
  console.log('⚠️ Using relative path fallback');
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🎯 Final API Base URL:', API_BASE_URL);

// Create axios instance with optimized settings
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 15000, // 15 seconds for production
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if status code is less than 500
  }
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // Add cache busting for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _: Date.now() // Cache buster
      };
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = Date.now();
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject({
      success: false,
      message: 'Request configuration failed',
      originalError: error.message
    });
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    const responseTime = response.headers['x-response-time'] || 'N/A';
    console.log(`📥 ${response.status} ${response.config.url} (${responseTime})`);
    
    // Check if response has success flag
    if (response.data && response.data.success === false) {
      console.warn('⚠️ API returned success: false', response.data);
    }
    
    return response;
  },
  (error) => {
    // Enhanced error handling
    let errorMessage = 'Network error. Please check your internet connection.';
    let errorType = 'network';
    let shouldRetry = false;
    let statusCode = 0;
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. The server is taking too long to respond.';
      errorType = 'timeout';
      shouldRetry = true;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `Cannot connect to server. Please check if the backend is running.`;
      errorMessage += `\nTried to connect to: ${API_BASE_URL}`;
      errorType = 'connection';
    } else if (error.code === 'CORS') {
      errorMessage = 'CORS error. Please check server CORS configuration.';
      errorType = 'cors';
    } else if (error.response) {
      // Server responded with error status
      statusCode = error.response.status;
      
      switch (statusCode) {
        case 400:
          errorMessage = error.response.data?.message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'API endpoint not found.';
          break;
        case 409:
          errorMessage = error.response.data?.message || 'Conflict detected.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please slow down.';
          shouldRetry = true;
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          errorType = 'server';
          shouldRetry = true;
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
          errorType = 'service';
          shouldRetry = true;
          break;
        default:
          errorMessage = error.response.data?.message || 
                        `Server error: ${statusCode}`;
      }
      
      console.error('❌ API Error:', {
        status: statusCode,
        url: error.config.url,
        method: error.config.method,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'No response from server. The backend might be down.';
      console.error('❌ No response received for:', error.config.url);
    } else {
      // Something else happened
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    // Special handling for duplicate vote
    if (errorMessage.includes('WhatsApp') || errorMessage.includes('already voted')) {
      return Promise.reject({ 
        success: false, 
        message: errorMessage,
        contactAdmin: true,
        errorType: 'duplicate'
      });
    }
    
    // Add retry suggestion for certain errors
    if (shouldRetry) {
      errorMessage += '\n\nYou can try again in a few moments.';
    }
    
    // Log detailed error for debugging
    console.error('❌ Error Details:', {
      message: errorMessage,
      type: errorType,
      code: error.code,
      status: statusCode,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method
      }
    });
    
    return Promise.reject({ 
      success: false, 
      message: errorMessage,
      errorType: errorType,
      statusCode: statusCode,
      shouldRetry: shouldRetry,
      originalError: error.message
    });
  }
);

// ==================== API FUNCTIONS ====================

// Test server connection with detailed diagnostics
export const testConnection = async () => {
  try {
    console.log('🔍 Testing connection to:', API_BASE_URL);
    
    const startTime = Date.now();
    const response = await API.get('/health', {
      timeout: 5000, // Quick health check
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      ...response.data,
      responseTime: `${responseTime}ms`,
      apiUrl: API_BASE_URL,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Server health check:', healthData);
    
    return healthData;
  } catch (error) {
    console.error('❌ Server connection test failed:', error);
    
    // Provide helpful debugging info
    const debugInfo = {
      success: false,
      message: 'Cannot connect to server',
      apiUrl: API_BASE_URL,
      currentOrigin: window.location.origin,
      errorDetails: error.message,
      suggestions: [
        'Check if backend server is running',
        'Verify CORS configuration',
        'Check network connectivity',
        'Try accessing the API URL directly in browser'
      ]
    };
    
    throw debugInfo;
  }
};

// Cast a vote
export const castVote = async (voteData) => {
  try {
    console.log('🗳️ Casting vote:', {
      name: voteData.name,
      age: voteData.age,
      candidateId: voteData.candidateId
    });
    
    const response = await API.post('/votes', voteData);
    
    console.log('✅ Vote cast successful:', response.data);
    
    return {
      ...response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Vote cast failed:', error);
    
    // Enhanced error for duplicate votes
    if (error.contactAdmin) {
      throw {
        ...error,
        showContact: true,
        adminContact: 'WhatsApp: +977-9800000000'
      };
    }
    
    throw error;
  }
};

// Get vote statistics
export const getVoteStats = async () => {
  try {
    console.log('📊 Fetching vote statistics...');
    
    const response = await API.get('/votes/stats', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('✅ Vote stats fetched:', {
      totalVotes: response.data.data?.totalVotes || 0,
      candidates: response.data.data?.votesByCandidate?.length || 0
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch vote stats:', error);
    
    // Return mock data for development if server is down
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Returning mock data for development');
      return {
        success: true,
        data: {
          totalVotes: 150,
          votesByCandidate: [
            { _id: "c1", candidateName: "Gagan Thapa", candidateParty: "Nepali Congress", votes: 45 },
            { _id: "c2", candidateName: "K. P. Sharma Oli", candidateParty: "CPN (UML)", votes: 38 },
            { _id: "c3", candidateName: "Balendra Shah (Balen)", candidateParty: "Rastriya Swatantra Party", votes: 67 }
          ],
          recentVotes: [
            { name: "Test User", candidateParty: "Nepali Congress" },
            { name: "Demo User", candidateParty: "CPN (UML)" }
          ]
        }
      };
    }
    
    throw error;
  }
};

// Get recent votes for marquee
export const getRecentVotes = async () => {
  try {
    const response = await API.get('/votes/recent');
    console.log('✅ Recent votes fetched:', response.data.data?.length || 0, 'votes');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recent votes:', error);
    throw error;
  }
};

// ==================== ADMIN FUNCTIONS ====================

// Get all votes (admin only)
export const getAllVotes = async () => {
  try {
    console.log('👑 Fetching all votes (admin)...');
    
    const response = await API.get('/votes/admin/all', {
      timeout: 30000 // Longer timeout for large data
    });
    
    console.log('✅ All votes fetched:', response.data.count || 0, 'votes');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch all votes:', error);
    throw error;
  }
};

// Get age statistics (admin only)
export const getAgeStats = async () => {
  try {
    const response = await API.get('/votes/admin/age-stats');
    console.log('✅ Age stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch age statistics:', error);
    throw error;
  }
};

// Get candidate statistics (admin only)
export const getCandidateStats = async () => {
  try {
    const response = await API.get('/votes/admin/candidate-stats');
    console.log('✅ Candidate stats fetched:', response.data.data?.length || 0, 'candidates');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch candidate statistics:', error);
    throw error;
  }
};

// Reset all votes (admin only - for testing)
export const resetVotes = async () => {
  try {
    console.log('🔄 Resetting all votes...');
    
    const response = await API.delete('/votes/admin/reset');
    
    console.log('✅ Votes reset successful');
    
    return {
      ...response.data,
      resetTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to reset votes:', error);
    throw error;
  }
};

// Export all functions
export default API;
