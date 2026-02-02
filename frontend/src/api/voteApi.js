import axios from 'axios';

// Production backend URL
const BACKEND_URL = 'https://electionofnepal.onrender.com';

console.log('🔗 Backend URL:', BACKEND_URL);

// Create axios instance
const API = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 second timeout for Render
  withCredentials: false
});

// ==================== REQUEST INTERCEPTOR ====================
API.interceptors.request.use(
  (config) => {
    console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
API.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    let errorMessage = 'Server error';
    
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = `Endpoint not found: ${error.config?.url}`;
      } else if (error.response.status === 500) {
        errorMessage = 'Internal server error';
      } else {
        errorMessage = error.response.data?.message || `Error ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

// ==================== TEST CONNECTION ====================
export const testConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await API.get('/');
    console.log('✅ Backend connected:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    throw error;
  }
};

// ==================== VOTE API FUNCTIONS ====================
// Cast a vote
export const castVote = async (voteData) => {
  try {
    console.log('🗳️ Casting vote:', voteData);
    const response = await API.post('/api/votes', voteData);
    console.log('✅ Vote cast successful');
    return response.data;
  } catch (error) {
    console.error('❌ Vote cast failed:', error.message);
    throw error;
  }
};

// Get vote statistics
export const getVoteStats = async () => {
  try {
    console.log('📊 Fetching vote stats...');
    const response = await API.get('/api/votes/stats');
    console.log('✅ Vote stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch vote stats:', error.message);
    throw error;
  }
};

// Get recent votes for marquee
export const getRecentVotes = async (limit = 10) => {
  try {
    console.log('🔄 Fetching recent votes...');
    const response = await API.get('/api/votes/recent', {
      params: { limit }
    });
    console.log('✅ Recent votes fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recent votes:', error.message);
    throw error;
  }
};

// Get all votes (admin only)
export const getAllVotes = async () => {
  try {
    console.log('👑 Fetching all votes (admin)...');
    const response = await API.get('/api/votes/admin/all');
    console.log('✅ All votes fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch all votes:', error.message);
    throw error;
  }
};

// Get age statistics (admin only)
export const getAgeStats = async () => {
  try {
    console.log('📈 Fetching age stats...');
    const response = await API.get('/api/votes/admin/age-stats');
    console.log('✅ Age stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch age stats:', error.message);
    throw error;
  }
};

// Get candidate statistics (admin only)
export const getCandidateStats = async () => {
  try {
    console.log('🎯 Fetching candidate stats...');
    const response = await API.get('/api/votes/admin/candidate-stats');
    console.log('✅ Candidate stats fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch candidate stats:', error.message);
    throw error;
  }
};

// Test all endpoints
export const testAllEndpoints = async () => {
  const endpoints = [
    { name: 'Root', url: '/' },
    { name: 'Health', url: '/health' },
    { name: 'Votes Stats', url: '/api/votes/stats' },
    { name: 'Recent Votes', url: '/api/votes/recent' },
  ];

  console.log('🔍 Testing all endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await API.get(endpoint.url);
      console.log(`✅ ${endpoint.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
};

export default API;
