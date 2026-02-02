import axios from 'axios';

// ============================================
// API URL CONFIGURATION - FIXED
// ============================================

/**
 * Get the current API URL dynamically
 * IMPORTANT: Backend is at https://electionofnepal.onrender.com (not /api)
 */
const getApiBaseUrl = () => {
  // Priority 1: Environment variable (set in Render.com dashboard)
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Using REACT_APP_API_URL from environment:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Priority 2: Production detection (Render.com)
  if (hostname.includes('nepalvote.onrender.com')) {
    // BACKEND URL: https://electionofnepal.onrender.com
    // NO /api suffix because backend routes are at root
    const productionBackendUrl = 'https://electionofnepal.onrender.com';
    console.log('🚀 Production mode detected, using backend:', productionBackendUrl);
    return productionBackendUrl;
  }
  
  // Priority 3: Development/local
  if (isLocalhost || isDevelopment) {
    // Local backend runs on port 5000 with routes at root
    const devUrl = 'http://localhost:5000';
    console.log('🔧 Development mode, using:', devUrl);
    return devUrl;
  }
  
  // Priority 4: Mobile/network access
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    const mobileUrl = `http://${hostname}:5000`;
    console.log('📱 Mobile/LAN access, using:', mobileUrl);
    return mobileUrl;
  }
  
  // Priority 5: Fallback - use same origin
  console.warn('⚠️ Using fallback. Consider setting REACT_APP_API_URL');
  console.log('🌐 Current hostname:', hostname);
  
  return ''; // Same origin
};

// Initialize API URL
const API_BASE_URL = getApiBaseUrl();
console.log('🌍 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hostname: window.location.hostname,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'Not set',
  frontend: window.location.origin
});

// ============================================
// AXIOS INSTANCE CONFIGURATION - FIXED
// ============================================

// Create axios instance with optimized configuration
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
    // REMOVED: 'X-Request-ID' - This was causing CORS issues
  },
  timeout: process.env.NODE_ENV === 'production' ? 20000 : 15000, // 20s in prod, 15s in dev
  withCredentials: false, // Set to false for cross-origin requests
  maxRedirects: 0,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  validateStatus: function (status) {
    // Resolve only if status code is less than 500
    return status >= 200 && status < 500;
  }
});

// ============================================
// REQUEST INTERCEPTOR - FIXED
// ============================================

API.interceptors.request.use(
  (config) => {
    // Add cache busting for GET requests in development
    if (process.env.NODE_ENV === 'development' && config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
        _v: '1.0'
      };
    }
    
    // REMOVED: Don't add X-Request-ID - it's not allowed by CORS
    // config.headers['X-Request-ID'] = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Log requests
    const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    if (logLevel === 'debug') {
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`, {
        params: config.params,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject({
      success: false,
      message: 'Failed to prepare request',
      code: 'REQUEST_SETUP_ERROR',
      originalError: error.message
    });
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

API.interceptors.response.use(
  (response) => {
    const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    
    if (logLevel === 'debug') {
      console.log(`📥 Response [${response.status}] ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
    }
    
    return response;
  },
  (error) => {
    console.group('❌ API Error Details');
    console.error('Error Object:', error);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    let errorMessage = 'An unexpected error occurred.';
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails = {};
    let contactAdmin = false;
    let shouldRetry = false;
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. The server is taking too long to respond.';
      errorCode = 'TIMEOUT';
      errorDetails = { timeout: error.config.timeout };
      shouldRetry = true;
    } 
    else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your internet connection.';
      errorCode = 'NETWORK_ERROR';
      errorDetails = { 
        url: error.config?.url,
        baseURL: error.config?.baseURL 
      };
      shouldRetry = true;
    }
    else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data || {};
      
      errorDetails = {
        status,
        url: error.config?.url,
        method: error.config?.method,
        serverMessage: data.message
      };
      
      switch (status) {
        case 400:
          errorMessage = data.message || 'Invalid request. Please check your data.';
          errorCode = 'BAD_REQUEST';
          break;
        case 401:
          errorMessage = 'Authentication required. Please log in.';
          errorCode = 'UNAUTHORIZED';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          errorCode = 'FORBIDDEN';
          break;
        case 404:
          errorMessage = data.message || `Resource not found: ${error.config?.url}`;
          errorCode = 'NOT_FOUND';
          break;
        case 409:
          errorMessage = data.message || 'Conflict detected. This may be a duplicate request.';
          errorCode = 'CONFLICT';
          contactAdmin = errorMessage.includes('WhatsApp') || errorMessage.includes('already voted');
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          errorCode = 'RATE_LIMITED';
          shouldRetry = true;
          errorDetails.retryAfter = error.response.headers['retry-after'];
          break;
        case 500:
          errorMessage = 'Server error. Our team has been notified. Please try again later.';
          errorCode = 'SERVER_ERROR';
          shouldRetry = true;
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
          errorCode = 'SERVICE_UNAVAILABLE';
          shouldRetry = true;
          break;
        default:
          errorMessage = data.message || `Server error (${status}). Please try again.`;
          errorCode = `HTTP_${status}`;
      }
      
      // Special CORS error detection
      if (status === 0 && errorMessage.includes('CORS')) {
        errorMessage = 'Cross-origin request blocked. This is usually a server configuration issue.';
        errorCode = 'CORS_ERROR';
        errorDetails.suggestion = 'Check backend CORS configuration for frontend origin';
        contactAdmin = true;
      }
    } 
    else if (error.request) {
      // Request was made but no response received
      errorMessage = `Cannot connect to server. Please check:\n\n1. Is the backend server running at ${API_BASE_URL}?\n2. Check browser console for CORS errors\n3. Verify your network connection\n4. Ensure backend is not blocked by firewall`;
      errorCode = 'NO_RESPONSE';
      errorDetails = {
        attemptedURL: API_BASE_URL,
        timestamp: new Date().toISOString()
      };
      contactAdmin = true;
      
      console.error('🚨 Server Connection Issues Detected:');
      console.error('   • Backend URL:', API_BASE_URL);
      console.error('   • Frontend Origin:', window.location.origin);
      console.error('   • Time:', new Date().toISOString());
      console.error('   • Possible causes:');
      console.error('     1. Backend server not running');
      console.error('     2. CORS configuration issue');
      console.error('     3. Network connectivity problem');
      console.error('     4. Firewall blocking the connection');
      console.error('     5. Backend crashed or restarting');
    } 
    else {
      // Something else happened
      errorMessage = error.message || 'Unknown error occurred';
      errorCode = 'UNKNOWN_ERROR';
    }
    
    console.error('Error Summary:', {
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      shouldRetry,
      contactAdmin
    });
    console.groupEnd();
    
    // Format error response
    const formattedError = {
      success: false,
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      contactAdmin,
      shouldRetry,
      retrySuggestion: shouldRetry ? 'Please try again in a few moments.' : undefined
    };
    
    return Promise.reject(formattedError);
  }
);

// ============================================
// API FUNCTIONS - UPDATED ENDPOINTS
// ============================================

/**
 * Test server connection
 */
const testConnection = async () => {
  try {
    console.log('🔍 Testing connection to:', API_BASE_URL);
    
    const response = await API.get('/health', {
      timeout: 10000
    });
    
    const result = {
      success: true,
      connected: true,
      data: response.data,
      backendUrl: API_BASE_URL,
      timestamp: new Date().toISOString(),
      responseTime: response.headers['x-response-time'] || 'N/A'
    };
    
    console.log('✅ Connection test successful:', {
      url: API_BASE_URL,
      status: response.status,
      environment: result.data?.environment,
      database: result.data?.database?.status
    });
    
    return result;
  } catch (error) {
    console.error('❌ Connection test failed:', {
      url: API_BASE_URL,
      error: error.message,
      code: error.code
    });
    
    return {
      success: false,
      connected: false,
      message: error.message || 'Failed to connect to server',
      backendUrl: API_BASE_URL,
      timestamp: new Date().toISOString(),
      suggestion: `Ensure backend is running at ${API_BASE_URL} and CORS is properly configured`,
      details: error.details || {}
    };
  }
};

/**
 * Cast a vote
 */
const castVote = async (voteData) => {
  try {
    console.log('🗳️ Casting vote:', {
      candidate: voteData.candidateName,
      age: voteData.age,
      timestamp: new Date().toISOString()
    });
    
    const response = await API.post('/votes', voteData, {
      timeout: 30000 // 30 seconds for vote submission
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to cast vote');
    }
    
    console.log('✅ Vote cast successful:', {
      id: response.data.data?.voteId,
      candidate: response.data.data?.candidateName,
      message: response.data.message
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Vote cast failed:', {
      error: error.message,
      code: error.code,
      candidate: voteData?.candidateName
    });
    
    // Re-throw with additional context
    const enhancedError = {
      ...error,
      voteData: {
        candidateName: voteData?.candidateName,
        age: voteData?.age
      },
      timestamp: new Date().toISOString()
    };
    
    throw enhancedError;
  }
};

/**
 * Get vote statistics
 */
const getVoteStats = async () => {
  try {
    console.log('📊 Fetching vote statistics...');
    
    const response = await API.get('/votes/stats', {
      params: {
        cache: Date.now() // Prevent caching
      }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch vote stats');
    }
    
    console.log('✅ Vote stats fetched:', {
      totalVotes: response.data.data?.totalVotes || 0,
      candidates: response.data.data?.votesByCandidate?.length || 0
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch vote stats:', error.message);
    
    // Return fallback data in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using development fallback for vote stats');
      return {
        success: true,
        data: {
          totalVotes: 42,
          votesByCandidate: [
            { candidateName: 'Candidate A', votes: 15, percentage: 35.7 },
            { candidateName: 'Candidate B', votes: 12, percentage: 28.6 },
            { candidateName: 'Candidate C', votes: 10, percentage: 23.8 },
            { candidateName: 'Candidate D', votes: 5, percentage: 11.9 }
          ],
          recentVotes: []
        },
        message: 'Development fallback data',
        isFallback: true
      };
    }
    
    throw error;
  }
};

/**
 * Get recent votes for marquee display
 */
const getRecentVotes = async (limit = 10) => {
  try {
    console.log('🔄 Fetching recent votes...');
    
    const response = await API.get('/votes/recent', {
      params: { limit }
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recent votes');
    }
    
    console.log('✅ Recent votes fetched:', {
      count: response.data.data?.length || 0,
      sample: response.data.data?.slice(0, 3) || []
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recent votes:', error.message);
    
    // Return fallback data in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using development fallback for recent votes');
      const fallbackVotes = Array.from({ length: 5 }, (_, i) => ({
        candidateName: ['Candidate A', 'Candidate B', 'Candidate C', 'Candidate D'][i % 4],
        age: 20 + i,
        timestamp: new Date(Date.now() - i * 60000).toISOString()
      }));
      
      return {
        success: true,
        data: fallbackVotes,
        message: 'Development fallback data',
        isFallback: true
      };
    }
    
    throw error;
  }
};

/**
 * Get all votes (admin only)
 */
const getAllVotes = async () => {
  try {
    console.log('👑 Fetching all votes (admin)...');
    
    const response = await API.get('/votes/admin/all');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch votes');
    }
    
    console.log('✅ All votes fetched:', {
      count: response.data.count || 0,
      hasData: !!response.data.data
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch all votes:', error.message);
    throw error;
  }
};

/**
 * Get age statistics (admin only)
 */
const getAgeStats = async () => {
  try {
    console.log('📈 Fetching age statistics...');
    
    const response = await API.get('/votes/admin/age-stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch age statistics');
    }
    
    console.log('✅ Age stats fetched:', {
      categories: Object.keys(response.data.data || {}).length
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch age statistics:', error.message);
    throw error;
  }
};

/**
 * Get candidate statistics (admin only)
 */
const getCandidateStats = async () => {
  try {
    console.log('🎯 Fetching candidate statistics...');
    
    const response = await API.get('/votes/admin/candidate-stats');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch candidate statistics');
    }
    
    console.log('✅ Candidate stats fetched:', {
      candidates: response.data.data?.length || 0
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch candidate statistics:', error.message);
    throw error;
  }
};

/**
 * Reset all votes (admin only - for testing)
 */
const resetVotes = async () => {
  try {
    console.log('🔄 Resetting all votes...');
    
    const response = await API.delete('/votes/admin/reset');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reset votes');
    }
    
    console.log('✅ Votes reset successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to reset votes:', error.message);
    throw error;
  }
};

/**
 * Batch requests for dashboard data
 */
const getDashboardData = async () => {
  try {
    console.log('📋 Fetching dashboard data...');
    const startTime = Date.now();
    
    const [stats, recent] = await Promise.allSettled([
      getVoteStats(),
      getRecentVotes()
    ]);
    
    const result = {
      success: true,
      stats: stats.status === 'fulfilled' ? stats.value : null,
      recent: recent.status === 'fulfilled' ? recent.value : null,
      errors: [],
      responseTime: Date.now() - startTime
    };
    
    // Collect any errors
    if (stats.status === 'rejected') {
      result.errors.push({ type: 'stats', error: stats.reason });
      console.error('Failed to fetch stats:', stats.reason);
    }
    
    if (recent.status === 'rejected') {
      result.errors.push({ type: 'recent', error: recent.reason });
      console.error('Failed to fetch recent votes:', recent.reason);
    }
    
    console.log('✅ Dashboard data fetched:', {
      hasStats: !!result.stats,
      hasRecent: !!result.recent,
      errors: result.errors.length,
      responseTime: result.responseTime
    });
    
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch dashboard data:', error);
    throw error;
  }
};

/**
 * Check if backend is accessible
 */
const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    return {
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: API_BASE_URL,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      url: API_BASE_URL,
      timestamp: new Date().toISOString()
    };
  }
};

// ============================================
// EXPORTS
// ============================================

// Default export (axios instance)
export default API;

// Named exports
export {
  API_BASE_URL,
  getApiBaseUrl,
  testConnection,
  castVote,
  getVoteStats,
  getRecentVotes,
  getAllVotes,
  getAgeStats,
  getCandidateStats,
  resetVotes,
  getDashboardData,
  checkBackendStatus
};
