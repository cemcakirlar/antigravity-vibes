import { eq } from "drizzle-orm";
import { db, forms, type Form, type NewForm } from "../../db";
import { applicationService } from "../application/application.service";
import type { CreateFormInput, UpdateFormInput } from "@orion/shared";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateTableName(appId: string, formSlug: string): string {
  // Generate a unique table name for user data
  return `data_${appId.replace(/-/g, "").substring(0, 8)}_${formSlug.replace(/-/g, "_")}`;
}

class FormService {
  /**
   * Create a new form in an application
   */
  async create(appId: string, userId: string, input: CreateFormInput): Promise<Form | null> {
    // Check app access
    const app = await applicationService.getById(appId, userId);
    if (!app) {
      return null;
    }

    const slug = input.slug || generateSlug(input.name);
    const tableName = generateTableName(appId, slug);

    // Get max sort order
    const existingForms = await db.query.forms.findMany({
      where: eq(forms.applicationId, appId),
    });
    const maxSortOrder = existingForms.length > 0 ? Math.max(...existingForms.map((f) => f.sortOrder)) : 0;

    const [form] = await db
      .insert(forms)
      .values({
        applicationId: appId,
        name: input.name,
        slug,
        tableName,
        description: input.description,
        sortOrder: maxSortOrder + 1,
      })
      .returning();

    return form;
  }

  /**
   * List all forms in an application
   */
  async listByApp(appId: string, userId: string): Promise<Form[]> {
    // Check app access
    const app = await applicationService.getById(appId, userId);
    if (!app) {
      return [];
    }

    return await db.query.forms.findMany({
      where: eq(forms.applicationId, appId),
      orderBy: (forms, { asc }) => [asc(forms.sortOrder)],
    });
  }

  /**
   * Get a form by ID
   */
  async getById(formId: string, userId: string): Promise<Form | null> {
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      with: {
        application: {
          with: {
            workspace: true,
          },
        },
      },
    });

    if (!form) {
      return null;
    }

    // Check access through application
    const app = await applicationService.getById(form.applicationId, userId);
    if (!app) {
      return null;
    }

    return form;
  }

  /**
   * Get a form with its fields
   */
  async getWithFields(formId: string, userId: string): Promise<(Form & { fields: unknown[] }) | null> {
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      with: {
        application: true,
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.sortOrder)],
        },
      },
    });

    if (!form) {
      return null;
    }

    // Check access through application
    const app = await applicationService.getById(form.applicationId, userId);
    if (!app) {
      return null;
    }

    return form;
  }

  /**
   * Update a form
   */
  async update(formId: string, userId: string, input: UpdateFormInput): Promise<Form | null> {
    const form = await this.getById(formId, userId);
    if (!form) {
      return null;
    }

    const [updated] = await db
      .update(forms)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(forms.id, formId))
      .returning();

    return updated;
  }

  /**
   * Delete a form
   */
  async delete(formId: string, userId: string): Promise<boolean> {
    const form = await this.getById(formId, userId);
    if (!form) {
      return false;
    }

    await db.delete(forms).where(eq(forms.id, formId));
    return true;
  }
}

export const formService = new FormService();
