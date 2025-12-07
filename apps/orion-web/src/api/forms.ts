import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { applicationKeys } from "./applications";

// Types
export interface Form {
  id: string;
  applicationId: string;
  name: string;
  slug: string;
  tableName: string;
  description?: string;
  layout: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormWithFields extends Form {
  fields: Field[];
  application?: {
    id: string;
    name: string;
    workspaceId: string;
  };
}

export interface Field {
  id: string;
  formId: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  validation: Record<string, unknown>;
  options: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "lookup"
  | "file"
  | "textarea"
  | "url"
  | "phone";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Query Keys
export const formKeys = {
  all: ["forms"] as const,
  lists: () => [...formKeys.all, "list"] as const,
  listByApp: (appId: string) => [...formKeys.lists(), { appId }] as const,
  details: () => [...formKeys.all, "detail"] as const,
  detail: (id: string) => [...formKeys.details(), id] as const,
};

export const fieldKeys = {
  all: ["fields"] as const,
  lists: () => [...fieldKeys.all, "list"] as const,
  listByForm: (formId: string) => [...fieldKeys.lists(), { formId }] as const,
};

// Form API Functions
const fetchFormsByApp = async (appId: string): Promise<Form[]> => {
  const { data } = await apiClient.get<ApiResponse<Form[]>>(`/apps/${appId}/forms`);
  return data.data;
};

const fetchForm = async (id: string): Promise<FormWithFields> => {
  const { data } = await apiClient.get<ApiResponse<FormWithFields>>(`/forms/${id}`);
  return data.data;
};

const createForm = async (input: { appId: string; name: string; slug?: string; description?: string }): Promise<Form> => {
  const { appId, ...rest } = input;
  const { data } = await apiClient.post<ApiResponse<Form>>(`/apps/${appId}/forms`, rest);
  return data.data;
};

const updateForm = async ({
  id,
  ...input
}: {
  id: string;
  name?: string;
  description?: string;
  layout?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}): Promise<Form> => {
  const { data } = await apiClient.patch<ApiResponse<Form>>(`/forms/${id}`, input);
  return data.data;
};

const deleteForm = async (id: string): Promise<void> => {
  await apiClient.delete(`/forms/${id}`);
};

// Field API Functions
const fetchFieldsByForm = async (formId: string): Promise<Field[]> => {
  const { data } = await apiClient.get<ApiResponse<Field[]>>(`/forms/${formId}/fields`);
  return data.data;
};

const createField = async (input: {
  formId: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  validation?: Record<string, unknown>;
  options?: Record<string, unknown>;
}): Promise<Field> => {
  const { formId, ...rest } = input;
  const { data } = await apiClient.post<ApiResponse<Field>>(`/forms/${formId}/fields`, rest);
  return data.data;
};

const updateField = async ({
  id,
  ...input
}: {
  id: string;
  label?: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  validation?: Record<string, unknown>;
  options?: Record<string, unknown>;
}): Promise<Field> => {
  const { data } = await apiClient.patch<ApiResponse<Field>>(`/fields/${id}`, input);
  return data.data;
};

const deleteField = async (id: string): Promise<void> => {
  await apiClient.delete(`/fields/${id}`);
};

const reorderFields = async (input: { formId: string; fieldIds: string[] }): Promise<void> => {
  await apiClient.post(`/forms/${input.formId}/fields/reorder`, { fieldIds: input.fieldIds });
};

// Form Hooks
export function useFormsByApp(appId: string) {
  return useQuery({
    queryKey: formKeys.listByApp(appId),
    queryFn: () => fetchFormsByApp(appId),
    enabled: !!appId,
  });
}

export function useForm(id: string) {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: () => fetchForm(id),
    enabled: !!id,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formKeys.listByApp(data.applicationId) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(data.applicationId) });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: formKeys.listByApp(data.applicationId) });
      queryClient.setQueryData(formKeys.detail(data.id), data);
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });
    },
  });
}

// Field Hooks
export function useFieldsByForm(formId: string) {
  return useQuery({
    queryKey: fieldKeys.listByForm(formId),
    queryFn: () => fetchFieldsByForm(formId),
    enabled: !!formId,
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createField,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fieldKeys.listByForm(data.formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.detail(data.formId) });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateField,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fieldKeys.listByForm(data.formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.detail(data.formId) });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formKeys.details() });
    },
  });
}

export function useReorderFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderFields,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fieldKeys.listByForm(variables.formId) });
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.formId) });
    },
  });
}
