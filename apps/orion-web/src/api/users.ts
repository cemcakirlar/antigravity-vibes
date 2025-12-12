import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (page?: number) => [...userKeys.lists(), { page }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// API Functions
const fetchUsers = async (page = 1, limit = 50): Promise<{ data: User[]; pagination: UserListResponse["pagination"] }> => {
  const { data } = await apiClient.get<UserListResponse>("/users", { params: { page, limit } });
  return { data: data.data, pagination: data.pagination };
};

const fetchUser = async (id: string): Promise<User> => {
  const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
  return data.data;
};

const updateUser = async (input: { id: string; name?: string; email?: string }): Promise<User> => {
  const { id, ...updateData } = input;
  const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, updateData);
  return data.data;
};

const changePassword = async (input: { id: string; password: string }): Promise<void> => {
  const { id, password } = input;
  await apiClient.patch(`/users/${id}/password`, { password });
};

const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

// Hooks
export function useUsers(page = 1, limit = 50) {
  return useQuery({
    queryKey: userKeys.list(page),
    queryFn: () => fetchUsers(page, limit),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.setQueryData(userKeys.detail(data.id), data);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
