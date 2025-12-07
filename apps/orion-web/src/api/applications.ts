import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { workspaceKeys } from "./workspaces";

// Types
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

export interface ApplicationWithForms extends Application {
  forms: Form[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Query Keys
export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  listByWorkspace: (workspaceId: string) => [...applicationKeys.lists(), { workspaceId }] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};

// API Functions
const fetchApplicationsByWorkspace = async (workspaceId: string): Promise<Application[]> => {
  const { data } = await apiClient.get<ApiResponse<Application[]>>(`/workspaces/${workspaceId}/apps`);
  return data.data;
};

const fetchApplication = async (id: string): Promise<ApplicationWithForms> => {
  const { data } = await apiClient.get<ApiResponse<ApplicationWithForms>>(`/apps/${id}`);
  return data.data;
};

const createApplication = async (input: { workspaceId: string; name: string; slug?: string; description?: string }): Promise<Application> => {
  const { workspaceId, ...rest } = input;
  const { data } = await apiClient.post<ApiResponse<Application>>(`/workspaces/${workspaceId}/apps`, rest);
  return data.data;
};

const updateApplication = async ({
  id,
  ...input
}: {
  id: string;
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}): Promise<Application> => {
  const { data } = await apiClient.patch<ApiResponse<Application>>(`/apps/${id}`, input);
  return data.data;
};

const deleteApplication = async (id: string): Promise<void> => {
  await apiClient.delete(`/apps/${id}`);
};

// Hooks
export function useApplicationsByWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: applicationKeys.listByWorkspace(workspaceId),
    queryFn: () => fetchApplicationsByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => fetchApplication(id),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.listByWorkspace(data.workspaceId) });
      // Also invalidate workspace detail if it includes apps count
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(data.workspaceId) });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.listByWorkspace(data.workspaceId) });
      queryClient.setQueryData(applicationKeys.detail(data.id), data);
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      // Invalidate all application lists since we don't know which workspace
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
}
