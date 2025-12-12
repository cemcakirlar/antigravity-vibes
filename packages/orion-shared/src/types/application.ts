// ============================================
// Application Types
// ============================================

export interface Application {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithForms extends Application {
  forms: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export interface CreateApplicationInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateApplicationInput {
  name?: string;
  slug?: string;
  description?: string;
  settings?: Record<string, unknown>;
}
