import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/stats';

export const saveFilterStats = async (endpoint, filters) => {
  try {
    await axios.post(`${API_BASE_URL}/save-filter-stats/`, {
      endpoint,
      filters
    });
  } catch (error) {
    console.error('Error saving filter stats:', error);
  }
};