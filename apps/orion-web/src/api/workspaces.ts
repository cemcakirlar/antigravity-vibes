import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Workspace, ApiResponse } from "@orion/shared";

// Re-export Workspace type for components
export type { Workspace } from "@orion/shared";

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

// ============================================
// Workspace Member Types & Hooks
// ============================================

export interface WorkspaceMember {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const memberKeys = {
  all: (workspaceId: string) => [...workspaceKeys.detail(workspaceId), "members"] as const,
  list: (workspaceId: string) => memberKeys.all(workspaceId),
};

// API Functions
const fetchMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const { data } = await apiClient.get<ApiResponse<WorkspaceMember[]>>(`/workspaces/${workspaceId}/members`);
  return data.data;
};

const addMember = async (input: { workspaceId: string; userId: string; role: "admin" | "member" | "viewer" }): Promise<void> => {
  await apiClient.post(`/workspaces/${input.workspaceId}/members`, { userId: input.userId, role: input.role });
};

const removeMember = async (input: { workspaceId: string; userId: string }): Promise<void> => {
  await apiClient.delete(`/workspaces/${input.workspaceId}/members/${input.userId}`);
};

const updateMemberRole = async (input: { workspaceId: string; userId: string; role: "admin" | "member" | "viewer" }): Promise<void> => {
  await apiClient.patch(`/workspaces/${input.workspaceId}/members/${input.userId}`, { role: input.role });
};

// Hooks
export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: memberKeys.list(workspaceId),
    queryFn: () => fetchMembers(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.workspaceId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.workspaceId) });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.workspaceId) });
    },
  });
}
