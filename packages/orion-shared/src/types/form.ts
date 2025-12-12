// ============================================
// Form Types
// ============================================

import type { Field } from "./field";

export interface Form {
  id: string;
  applicationId: string;
  name: string;
  slug: string;
  tableName: string;
  description: string | null;
  layout: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormWithFields extends Form {
  fields: Field[];
}

export interface CreateFormInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateFormInput {
  name?: string;
  slug?: string;
  tableName?: string;
  description?: string | null;
  layout?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  sortOrder?: number;
}
