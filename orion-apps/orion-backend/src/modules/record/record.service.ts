import { db, records, forms, applications, workspaces } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import type { NewRecord } from "../../db";

export const recordService = {
  /**
   * List records for a form with pagination
   */
  async list(formId: string, userId: string, page = 1, limit = 50) {
    // First verify user has access to this form
    const form = await this.getFormWithAccess(formId, userId);
    if (!form) return null;

    const offset = (page - 1) * limit;

    const recordsList = await db.query.records.findMany({
      where: eq(records.formId, formId),
      orderBy: [desc(records.createdAt)],
      limit,
      offset,
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get total count
    const allRecords = await db.select({ id: records.id }).from(records).where(eq(records.formId, formId));

    return {
      data: recordsList,
      pagination: {
        page,
        limit,
        total: allRecords.length,
        totalPages: Math.ceil(allRecords.length / limit),
      },
    };
  },

  /**
   * Get a single record
   */
  async get(recordId: string, userId: string) {
    const record = await db.query.records.findFirst({
      where: eq(records.id, recordId),
      with: {
        form: true,
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!record) return null;

    // Verify access
    const hasAccess = await this.getFormWithAccess(record.formId, userId);
    if (!hasAccess) return null;

    return record;
  },

  /**
   * Create a new record
   */
  async create(formId: string, userId: string, data: Record<string, unknown>) {
    // Verify user has access to this form
    const form = await this.getFormWithAccess(formId, userId);
    if (!form) return null;

    const newRecord: NewRecord = {
      formId,
      data,
      createdBy: userId,
      updatedBy: userId,
    };

    const [created] = await db.insert(records).values(newRecord).returning();
    return created;
  },

  /**
   * Update a record
   */
  async update(recordId: string, userId: string, data: Record<string, unknown>) {
    // First get the record
    const existing = await this.get(recordId, userId);
    if (!existing) return null;

    const [updated] = await db
      .update(records)
      .set({
        data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(records.id, recordId))
      .returning();

    return updated;
  },

  /**
   * Partially update a record (merge data)
   */
  async patch(recordId: string, userId: string, partialData: Record<string, unknown>) {
    // First get the record
    const existing = await this.get(recordId, userId);
    if (!existing) return null;

    const mergedData = { ...(existing.data as Record<string, unknown>), ...partialData };

    const [updated] = await db
      .update(records)
      .set({
        data: mergedData,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(records.id, recordId))
      .returning();

    return updated;
  },

  /**
   * Delete a record
   */
  async delete(recordId: string, userId: string) {
    // First verify access
    const existing = await this.get(recordId, userId);
    if (!existing) return false;

    await db.delete(records).where(eq(records.id, recordId));
    return true;
  },

  /**
   * Bulk delete records
   */
  async bulkDelete(recordIds: string[], userId: string) {
    let deletedCount = 0;

    for (const recordId of recordIds) {
      const deleted = await this.delete(recordId, userId);
      if (deleted) deletedCount++;
    }

    return deletedCount;
  },

  /**
   * Helper: Check if user has access to a form
   */
  async getFormWithAccess(formId: string, userId: string) {
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

    if (!form) return null;

    // Check if user owns the workspace
    if (form.application.workspace.ownerId !== userId) {
      // TODO: Check workspace members when implemented
      return null;
    }

    return form;
  },
};
