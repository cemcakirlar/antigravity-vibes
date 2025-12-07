import axios, { type AxiosInstance } from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("orion_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem("orion_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Token management helpers
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("orion_token", token);
  } else {
    localStorage.removeItem("orion_token");
  }
};

export const getAuthToken = () => localStorage.getItem("orion_token");
