import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { recordService } from "./record.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import type { User } from "../../db";

const recordsRouter = new Hono<{
  Variables: {
    user: Omit<User, "passwordHash">;
  };
}>();

// All routes require authentication
recordsRouter.use("*", authMiddleware);

// Validation schemas
const createRecordSchema = z.object({
  data: z.record(z.unknown()),
});

const updateRecordSchema = z.object({
  data: z.record(z.unknown()),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()),
});

/**
 * GET /api/forms/:formId/records
 * List records with pagination
 */
recordsRouter.get("/forms/:formId/records", async (c) => {
  const user = c.get("user");
  const formId = c.req.param("formId");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");

  const result = await recordService.list(formId, user.id, page, limit);

  if (!result) {
    return c.json({ success: false, error: "Form not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    ...result,
  });
});

/**
 * POST /api/forms/:formId/records
 * Create a new record
 */
recordsRouter.post("/forms/:formId/records", zValidator("json", createRecordSchema), async (c) => {
  try {
    const user = c.get("user");
    const formId = c.req.param("formId");
    const { data } = c.req.valid("json");

    const record = await recordService.create(formId, user.id, data);

    if (!record) {
      return c.json({ success: false, error: "Form not found or access denied" }, 404);
    }

    return c.json(
      {
        success: true,
        data: record,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create record";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * GET /api/records/:recordId
 * Get a single record
 */
recordsRouter.get("/records/:recordId", async (c) => {
  const user = c.get("user");
  const recordId = c.req.param("recordId");

  const record = await recordService.get(recordId, user.id);

  if (!record) {
    return c.json({ success: false, error: "Record not found" }, 404);
  }

  return c.json({
    success: true,
    data: record,
  });
});

/**
 * PUT /api/records/:recordId
 * Replace record data
 */
recordsRouter.put("/records/:recordId", zValidator("json", updateRecordSchema), async (c) => {
  const user = c.get("user");
  const recordId = c.req.param("recordId");
  const { data } = c.req.valid("json");

  const record = await recordService.update(recordId, user.id, data);

  if (!record) {
    return c.json({ success: false, error: "Record not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    data: record,
  });
});

/**
 * PATCH /api/records/:recordId
 * Partially update record data
 */
recordsRouter.patch("/records/:recordId", zValidator("json", updateRecordSchema), async (c) => {
  const user = c.get("user");
  const recordId = c.req.param("recordId");
  const { data } = c.req.valid("json");

  const record = await recordService.patch(recordId, user.id, data);

  if (!record) {
    return c.json({ success: false, error: "Record not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    data: record,
  });
});

/**
 * DELETE /api/records/:recordId
 * Delete a single record
 */
recordsRouter.delete("/records/:recordId", async (c) => {
  const user = c.get("user");
  const recordId = c.req.param("recordId");

  const deleted = await recordService.delete(recordId, user.id);

  if (!deleted) {
    return c.json({ success: false, error: "Record not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    message: "Record deleted",
  });
});

/**
 * POST /api/records/bulk-delete
 * Delete multiple records
 */
recordsRouter.post("/records/bulk-delete", zValidator("json", bulkDeleteSchema), async (c) => {
  const user = c.get("user");
  const { ids } = c.req.valid("json");

  const deletedCount = await recordService.bulkDelete(ids, user.id);

  return c.json({
    success: true,
    message: `Deleted ${deletedCount} records`,
    deletedCount,
  });
});

export { recordsRouter as recordRoutes };
