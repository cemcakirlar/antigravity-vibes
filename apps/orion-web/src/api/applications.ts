import { api } from "./client";

export interface Application {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithForms extends Application {
  forms: Form[];
}

export interface Form {
  id: string;
  applicationId: string;
  name: string;
  slug: string;
  tableName: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const applicationsApi = {
  async listByWorkspace(workspaceId: string) {
    return api.get<Application[]>(`/workspaces/${workspaceId}/apps`);
  },

  async get(id: string) {
    return api.get<ApplicationWithForms>(`/apps/${id}`);
  },

  async create(workspaceId: string, data: { name: string; slug?: string; description?: string }) {
    return api.post<Application>(`/workspaces/${workspaceId}/apps`, data);
  },

  async update(id: string, data: { name?: string; description?: string; settings?: Record<string, unknown> }) {
    return api.patch<Application>(`/apps/${id}`, data);
  },

  async delete(id: string) {
    return api.delete(`/apps/${id}`);
  },
};
