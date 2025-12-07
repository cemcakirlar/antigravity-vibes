import { api } from "./client";

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

export const authApi = {
  async login(email: string, password: string) {
    return api.post<AuthResult>("/auth/login", { email, password });
  },

  async register(email: string, password: string, name: string) {
    return api.post<AuthResult>("/auth/register", { email, password, name });
  },

  async getMe() {
    return api.get<{ user: User }>("/auth/me");
  },
};
