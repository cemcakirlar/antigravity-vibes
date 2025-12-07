import { api } from "./client";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export const workspacesApi = {
  async list() {
    return api.get<Workspace[]>("/workspaces");
  },

  async get(id: string) {
    return api.get<Workspace>(`/workspaces/${id}`);
  },

  async create(data: { name: string; slug?: string }) {
    return api.post<Workspace>("/workspaces", data);
  },

  async update(id: string, data: { name?: string }) {
    return api.patch<Workspace>(`/workspaces/${id}`, data);
  },

  async delete(id: string) {
    return api.delete(`/workspaces/${id}`);
  },
};
