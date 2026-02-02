import API from './voteApi';

// Submit feedback
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await API.post('/feedback', feedbackData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all feedbacks
export const getAllFeedbacks = async () => {
  try {
    const response = await API.get('/feedback');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get feedback count
export const getFeedbackCount = async () => {
  try {
    const response = await API.get('/feedback/count');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  submitFeedback,
  getAllFeedbacks,
  getFeedbackCount
};