import axios from 'axios';
import qs from 'qs';

const API_URL = 'http://localhost:8000/api';

export const AnnouncementsService = {
  async getAll() {
    try {
      const response = await axios.get(`${API_URL}/announcements/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  async getWithFilters(filters = {}) {
    const params = {
      ...filters,
      limit: filters.limit || 21,
    };

    try {
      const response = await axios.get(`${API_URL}/announcements/`, {
        params,
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: 'repeat' }), // сериализация массивов
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching filtered announcements:', error);
      throw error;
    }
  },

  async getById(id, filters = {}) {
    try {
      const response = await axios.get(`${API_URL}/announcements/${id}/`, {
        params: filters,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      throw error;
    }
  }
};
