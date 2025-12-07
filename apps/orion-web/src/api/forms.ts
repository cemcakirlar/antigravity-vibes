import { api } from "./client";

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

export const formsApi = {
  async listByApp(appId: string) {
    return api.get<Form[]>(`/apps/${appId}/forms`);
  },

  async get(id: string) {
    return api.get<FormWithFields>(`/forms/${id}`);
  },

  async create(appId: string, data: { name: string; slug?: string; description?: string }) {
    return api.post<Form>(`/apps/${appId}/forms`, data);
  },

  async update(id: string, data: { name?: string; description?: string; layout?: Record<string, unknown>; settings?: Record<string, unknown> }) {
    return api.patch<Form>(`/forms/${id}`, data);
  },

  async delete(id: string) {
    return api.delete(`/forms/${id}`);
  },
};

export const fieldsApi = {
  async listByForm(formId: string) {
    return api.get<Field[]>(`/forms/${formId}/fields`);
  },

  async create(
    formId: string,
    data: {
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
    }
  ) {
    return api.post<Field>(`/forms/${formId}/fields`, data);
  },

  async update(
    id: string,
    data: {
      label?: string;
      required?: boolean;
      unique?: boolean;
      defaultValue?: string;
      placeholder?: string;
      helpText?: string;
      validation?: Record<string, unknown>;
      options?: Record<string, unknown>;
    }
  ) {
    return api.patch<Field>(`/fields/${id}`, data);
  },

  async delete(id: string) {
    return api.delete(`/fields/${id}`);
  },

  async reorder(formId: string, fieldIds: string[]) {
    return api.post(`/forms/${formId}/fields/reorder`, { fieldIds });
  },
};
