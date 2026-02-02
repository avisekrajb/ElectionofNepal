import API from './voteApi';

// Submit feedback
export const submitFeedback = async (feedbackData) => {
  try {
    console.log('📤 Submitting feedback to:', API.defaults.baseURL + '/feedback');
    console.log('Data:', feedbackData);
    
    const response = await API.post('/feedback', feedbackData);
    console.log('✅ Feedback submitted successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Feedback submission failed:', error);
    
    // More specific error messages
    if (error.message && error.message.includes('Network Error')) {
      throw {
        success: false,
        message: 'Cannot connect to server. Please check your internet connection and try again.'
      };
    }
    
    if (error.status === 404) {
      throw {
        success: false,
        message: 'Feedback service is currently unavailable. Please try again later.'
      };
    }
    
    if (error.response?.status === 500) {
      throw {
        success: false,
        message: 'Server error. Please contact administrator.'
      };
    }
    
    // Return the error message from server or default message
    throw {
      success: false,
      message: error.message || 'Failed to submit feedback. Please try again.'
    };
  }
};

// Get all feedbacks
export const getAllFeedbacks = async () => {
  try {
    const response = await API.get('/feedback');
    return response.data;
  } catch (error) {
    console.warn('⚠️ Could not fetch feedbacks (might be okay):', error.message);
    // Return empty array if endpoint doesn't exist
    return { success: true, data: [] };
  }
};

// Get feedback count
export const getFeedbackCount = async () => {
  try {
    const response = await API.get('/feedback/count');
    return response.data;
  } catch (error) {
    console.warn('⚠️ Could not fetch feedback count:', error.message);
    // Return 0 if endpoint doesn't exist
    return { success: true, count: 0 };
  }
};

export default {
  submitFeedback,
  getAllFeedbacks,
  getFeedbackCount
};
