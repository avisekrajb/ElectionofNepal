import API from './voteApi';

// Submit feedback
export const submitFeedback = async (feedbackData) => {
  try {
    console.log('Submitting feedback:', feedbackData);
    const response = await API.post('/feedback', feedbackData);
    console.log('Feedback response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Feedback API error:', error);
    
    // Check if it's a network error
    if (error.message === 'Network Error') {
      throw { 
        success: false, 
        message: 'Cannot connect to server. Please check your internet connection.' 
      };
    }
    
    // Check if it's a 404 error (endpoint not found)
    if (error.response?.status === 404) {
      throw { 
        success: false, 
        message: 'Feedback endpoint not found. Please contact administrator.' 
      };
    }
    
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to submit feedback. Please try again.' 
    };
  }
};

// Get all feedbacks
export const getAllFeedbacks = async () => {
  try {
    const response = await API.get('/feedback');
    return response.data;
  } catch (error) {
    console.error('Get feedbacks error:', error);
    
    // If endpoint not found, return empty array
    if (error.response?.status === 404) {
      return { success: true, data: [] };
    }
    
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch feedbacks' 
    };
  }
};

// Get feedback count
export const getFeedbackCount = async () => {
  try {
    const response = await API.get('/feedback/count');
    return response.data;
  } catch (error) {
    console.error('Get feedback count error:', error);
    
    // If endpoint not found, return 0
    if (error.response?.status === 404) {
      return { success: true, count: 0 };
    }
    
    throw error.response?.data || { 
      success: false, 
      message: 'Failed to fetch feedback count' 
    };
  }
};

export default {
  submitFeedback,
  getAllFeedbacks,
  getFeedbackCount
};
