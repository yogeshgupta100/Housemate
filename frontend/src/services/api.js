import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const searchProperties = async (searchParams) => {
  try {
    console.log('Search params:', searchParams); // Debug log
    const response = await api.get(`${API_URL}/api/properties/search`, {
      params: searchParams
    });
    console.log('Search response:', response); // Debug log
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
    console.error('Error searching properties:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getLocationTrends = async (city) => {
  try {
    const response = await api.get(`${API_URL}/api/locations/${encodeURIComponent(city)}/trends`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
    console.error('Error fetching location trends:', errorMessage);
    throw new Error(errorMessage);
  }
};

export default api;