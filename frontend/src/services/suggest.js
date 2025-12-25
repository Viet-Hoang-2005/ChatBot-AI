// Service để lấy gợi ý từ backend

import axios from 'axios';
const API_BASE_URL = 'http://127.0.0.1:5000';

const getSuggestions = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/query`, {
      params: { q: query }  // truyền param q để lấy backend
    });
    return response.data; // trả về dữ liệu gợi ý
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw error;
  }
};

export {
  getSuggestions
};
