import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const signupUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/signup`, userData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const fetchQueryHistory = async (userId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/queries/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const submitRecommendation = async (recommendationData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/recommendations`, recommendationData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};