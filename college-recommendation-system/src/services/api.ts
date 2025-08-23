import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        // Add other user fields if needed
    };
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const response = await axios.post<LoginResponse>(`${API_BASE_URL}/login`, credentials);
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};

interface SignupData {
    name: string;
    email: string;
    password: string;
    // Add other signup fields if needed
}

interface SignupResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        // Add other user fields if needed
    };
}

export const signupUser = async (userData: SignupData): Promise<SignupResponse> => {
    try {
        const response = await axios.post<SignupResponse>(`${API_BASE_URL}/signup`, userData);
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};

interface QueryHistoryItem {
    id: string;
    query: string;
    createdAt: string;
    // Add other fields if needed
}

type FetchQueryHistoryResponse = QueryHistoryItem[];

export const fetchQueryHistory = async (userId: string): Promise<FetchQueryHistoryResponse> => {
    try {
        const response = await axios.get<FetchQueryHistoryResponse>(`${API_BASE_URL}/queries/${userId}`);
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};

interface RecommendationData {
    // Define the fields for recommendationData as needed
    // For example:
    // userId: string;
    // preferences: string[];
    // etc.
}

interface SubmitRecommendationResponse {
    // Define the fields returned by the API
    // For example:
    // recommendationId: string;
    // status: string;
    // etc.
}

export const submitRecommendation = async (
    recommendationData: RecommendationData
): Promise<SubmitRecommendationResponse> => {
    try {
        const response = await axios.post<SubmitRecommendationResponse>(
            `${API_BASE_URL}/recommendations`,
            recommendationData
        );
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};