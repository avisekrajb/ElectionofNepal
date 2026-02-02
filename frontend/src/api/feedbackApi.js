// feedbackApi.js
import api from './api';

export const submitFeedback = async (feedbackData) => {
  try {
    const response = await api.post('/api/feedback', feedbackData);
    return response.data;
  } catch (error) {
    console.error('❌ Feedback submission failed:', error);
    throw error;
  }
};

export const getAllFeedbacks = async () => {
  try {
    const response = await api.get('/api/feedbacks');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedbacks:', error);
    throw error;
  }
};

export const getFeedbackCount = async () => {
  try {
    const response = await api.get('/api/feedbacks/count');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch feedback count:', error);
    throw error;
  }
};
