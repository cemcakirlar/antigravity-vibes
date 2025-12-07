import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

// Types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Query Keys
export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: () => workspaceKeys.lists(),
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
};

// API Functions
const fetchWorkspaces = async (): Promise<Workspace[]> => {
  const { data } = await apiClient.get<ApiResponse<Workspace[]>>("/workspaces");
  return data.data;
};

const fetchWorkspace = async (id: string): Promise<Workspace> => {
  const { data } = await apiClient.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
  return data.data;
};

const createWorkspace = async (input: { name: string; slug?: string }): Promise<Workspace> => {
  const { data } = await apiClient.post<ApiResponse<Workspace>>("/workspaces", input);
  return data.data;
};

const updateWorkspace = async ({ id, ...input }: { id: string; name?: string }): Promise<Workspace> => {
  const { data } = await apiClient.patch<ApiResponse<Workspace>>(`/workspaces/${id}`, input);
  return data.data;
};

const deleteWorkspace = async (id: string): Promise<void> => {
  await apiClient.delete(`/workspaces/${id}`);
};

// Hooks
export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: fetchWorkspaces,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => fetchWorkspace(id),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.setQueryData(workspaceKeys.detail(data.id), data);
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(id) });
    },
  });
}
