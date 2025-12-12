import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { formKeys } from "./forms";

// Types
export interface FormRecord {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface RecordListResponse {
  success: boolean;
  data: FormRecord[];
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
export const recordKeys = {
  all: ["records"] as const,
  lists: () => [...recordKeys.all, "list"] as const,
  listByFormAll: (formId: string) => [...recordKeys.lists(), formId] as const,
  listByForm: (formId: string, page?: number) => [...recordKeys.listByFormAll(formId), { page }] as const,
  details: () => [...recordKeys.all, "detail"] as const,
  detail: (id: string) => [...recordKeys.details(), id] as const,
};

// API Functions
const fetchRecordsByForm = async (
  formId: string,
  page = 1,
  limit = 50
): Promise<{ data: FormRecord[]; pagination: RecordListResponse["pagination"] }> => {
  const { data } = await apiClient.get<RecordListResponse>(`/forms/${formId}/records`, { params: { page, limit } });
  return { data: data.data, pagination: data.pagination };
};

const fetchRecord = async (id: string): Promise<FormRecord> => {
  const { data } = await apiClient.get<ApiResponse<FormRecord>>(`/records/${id}`);
  return data.data;
};

const createRecord = async (input: { formId: string; data: Record<string, unknown> }): Promise<FormRecord> => {
  const { formId, data: recordData } = input;
  const { data } = await apiClient.post<ApiResponse<FormRecord>>(`/forms/${formId}/records`, { data: recordData });
  return data.data;
};

const updateRecord = async (input: { id: string; data: Record<string, unknown> }): Promise<FormRecord> => {
  const { id, data: recordData } = input;
  const { data } = await apiClient.patch<ApiResponse<FormRecord>>(`/records/${id}`, { data: recordData });
  return data.data;
};

const deleteRecord = async (id: string): Promise<void> => {
  await apiClient.delete(`/records/${id}`);
};

const bulkDeleteRecords = async (ids: string[]): Promise<number> => {
  const { data } = await apiClient.post<{ success: boolean; deletedCount: number }>("/records/bulk-delete", { ids });
  return data.deletedCount;
};

// Hooks
export function useRecords(formId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: recordKeys.listByForm(formId, page),
    queryFn: () => fetchRecordsByForm(formId, page, limit),
    enabled: !!formId,
  });
}

export function useRecord(id: string) {
  return useQuery({
    queryKey: recordKeys.detail(id),
    queryFn: () => fetchRecord(id),
    enabled: !!id,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecord,
    onSuccess: (data) => {
      // Invalidate ALL pages of records list for this form
      queryClient.invalidateQueries({ queryKey: recordKeys.listByFormAll(data.formId) });
      // Also invalidate form detail if it shows record count
      queryClient.invalidateQueries({ queryKey: formKeys.detail(data.formId) });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecord,
    onSuccess: (data) => {
      // Invalidate ALL pages of records list for this form
      queryClient.invalidateQueries({ queryKey: recordKeys.listByFormAll(data.formId) });
      queryClient.setQueryData(recordKeys.detail(data.id), data);
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      // Invalidate all record lists since we don't know which form
      queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
    },
  });
}

export function useBulkDeleteRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteRecords,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
    },
  });
}
