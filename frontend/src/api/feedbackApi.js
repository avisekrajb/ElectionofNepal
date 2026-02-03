// feedbackApi.js
import api from './api';

export const submitFeedback = async (feedbackData) => {
  try {
    const response = await api.post('/api/feedback', feedbackData); // ✅ Correct
    return response.data;
  } catch (error) {
    console.error('❌ Feedback submission failed:', error);
    throw error;
  }
};

export const getAllFeedbacks = async () => {
  try {
    const response = await api.get('/api/feedback'); // ✅ Correct (no 's' at end)
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedbacks:', error);
    throw error;
  }
};

export const getFeedbackCount = async () => {
  try {
    const response = await api.get('/api/feedback/count'); // ✅ Correct
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedback count:', error);
    throw error;
  }
};
