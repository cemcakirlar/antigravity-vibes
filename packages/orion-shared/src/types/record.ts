// ============================================
// Record Types (Form Data Entries)
// ============================================

export interface FormRecord {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormRecordWithCreator extends FormRecord {
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateRecordInput {
  formId: string;
  data: Record<string, unknown>;
}

export interface UpdateRecordInput {
  data: Record<string, unknown>;
}
