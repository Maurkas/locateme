import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/announcements',
});

export const getPersonalScore = async (data) => {
  try {
    const response = await apiClient.post('/score/', data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении персональной оценки:', error);
    throw error;
  }
};