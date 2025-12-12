// ============================================
// Field Types
// ============================================

export const FIELD_TYPES = [
  "text",
  "number",
  "email",
  "date",
  "datetime",
  "boolean",
  "select",
  "multiselect",
  "lookup",
  "file",
  "textarea",
  "url",
  "phone",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export interface Field {
  id: string;
  formId: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue: string | null;
  placeholder: string | null;
  helpText: string | null;
  validation: Record<string, unknown>;
  options: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFieldInput {
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

export interface UpdateFieldInput {
  name?: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  validation?: Record<string, unknown>;
  options?: Record<string, unknown>;
  sortOrder?: number;
}
