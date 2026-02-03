// feedbackApi.js - COMPLETE FIXED VERSION
import API from './api'; // Make sure this imports your actual API instance

// Helper to format error messages
const formatError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || `Server error: ${error.response.status}`,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    return {
      message: 'No response from server. Please check your connection.',
      status: 0
    };
  } else {
    return {
      message: error.message,
      status: -1
    };
  }
};

// Submit feedback
export const submitFeedback = async (feedbackData) => {
  try {
    console.log('📝 Submitting feedback to /api/feedback...');
    
    // Ensure required fields
    const dataToSend = {
      ...feedbackData,
      timestamp: feedbackData.timestamp || new Date().toISOString()
    };
    
    console.log('Data being sent:', dataToSend);
    
    const response = await API.post('/api/feedback', dataToSend);
    console.log('✅ Feedback submitted successfully');
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    const formattedError = formatError(error);
    console.error('❌ Feedback submission failed:', formattedError);
    throw new Error(formattedError.message);
  }
};

// Get all feedback
export const getAllFeedbacks = async () => {
  try {
    console.log('📋 Fetching all feedback from /api/feedback...');
    const response = await API.get('/api/feedback');
    console.log(`✅ Retrieved ${response.data?.length || 0} feedback items`);
    return response.data;
  } catch (error) {
    const formattedError = formatError(error);
    console.error('❌ Failed to fetch feedback:', formattedError);
    throw new Error(formattedError.message);
  }
};

// Get feedback count
export const getFeedbackCount = async () => {
  try {
    console.log('🔢 Fetching feedback count...');
    const response = await API.get('/api/feedback/count');
    console.log(`✅ Feedback count: ${response.data?.count || 0}`);
    return response.data;
  } catch (error) {
    const formattedError = formatError(error);
    console.error('❌ Failed to fetch feedback count:', formattedError);
    throw new Error(formattedError.message);
  }
};

// Test all feedback endpoints
export const testFeedbackAPI = async () => {
  const results = [];
  
  console.log('🧪 Testing Feedback API Endpoints');
  console.log('='.repeat(40));
  
  // Test 1: POST feedback
  try {
    const testFeedback = {
      name: "API Test User",
      email: "apitest@example.com",
      message: "Testing feedback API connection",
      rating: 5
    };
    
    const postResult = await submitFeedback(testFeedback);
    results.push({ test: 'POST /api/feedback', status: '✅ Success', result: postResult });
  } catch (error) {
    results.push({ test: 'POST /api/feedback', status: '❌ Failed', error: error.message });
  }
  
  // Test 2: GET feedback
  try {
    const feedbacks = await getAllFeedbacks();
    results.push({ 
      test: 'GET /api/feedback', 
      status: '✅ Success', 
      result: `Found ${feedbacks.length} items` 
    });
  } catch (error) {
    results.push({ test: 'GET /api/feedback', status: '❌ Failed', error: error.message });
  }
  
  console.table(results);
  return results;
};
