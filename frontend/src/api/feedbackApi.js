// feedbackApi.js - UPDATED VERSION
import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: 'https://electionofnepal.onrender.com',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
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

// ==================== FEEDBACK API FUNCTIONS ====================
export const submitFeedback = async (feedbackData) => {
  try {
    console.log('💬 Submitting feedback:', feedbackData);
    const response = await API.post('/api/feedback', feedbackData);
    console.log('✅ Feedback submitted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Feedback submission failed:', error.message);
    throw error;
  }
};

export const getAllFeedbacks = async () => {
  try {
    console.log('📋 Fetching all feedbacks...');
    const response = await API.get('/api/feedback');
    console.log('✅ Feedbacks fetched successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedbacks:', error.message);
    throw error;
  }
};

export const getFeedbackCount = async () => {
  try {
    console.log('🔢 Fetching feedback count...');
    const response = await API.get('/api/feedback/count');
    console.log('✅ Feedback count fetched');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedback count:', error.message);
    throw error;
  }
};

export default API;
