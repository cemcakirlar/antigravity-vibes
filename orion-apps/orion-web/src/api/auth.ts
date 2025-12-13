import { apiClient, setAuthToken } from "./client";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

// Auth API functions (not using React Query for auth since it's special)
export const authApi = {
  async login(email: string, password: string): Promise<AuthResult> {
    const { data } = await apiClient.post<{ success: boolean; data: AuthResult }>("/auth/login", { email, password });
    return data.data;
  },

  async register(email: string, password: string, name: string): Promise<AuthResult> {
    const { data } = await apiClient.post<{ success: boolean; data: AuthResult }>("/auth/register", { email, password, name });
    return data.data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<{ success: boolean; data: { user: User } }>("/auth/me");
    return data.data.user;
  },
};

export { setAuthToken };
