import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { workspaceService } from "./workspace.service";
import { authMiddleware } from "../../middleware/auth.middleware";
import type { User } from "../../db";

const workspaces = new Hono<{
  Variables: {
    user: Omit<User, "passwordHash">;
  };
}>();

// All routes require authentication
workspaces.use("*", authMiddleware);

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
workspaces.post("/", zValidator("json", createWorkspaceSchema), async (c) => {
  try {
    const user = c.get("user");
    const input = c.req.valid("json");
    const workspace = await workspaceService.create(user.id, input);

    return c.json(
      {
        success: true,
        data: workspace,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create workspace";
    return c.json({ success: false, error: message }, 400);
  }
});

/**
 * GET /api/workspaces
 * List all workspaces for current user
 */
workspaces.get("/", async (c) => {
  const user = c.get("user");
  const list = await workspaceService.listByUser(user.id);

  return c.json({
    success: true,
    data: list,
  });
});

/**
 * GET /api/workspaces/:workspaceId
 * Get a specific workspace
 */
workspaces.get("/:workspaceId", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const workspace = await workspaceService.getById(workspaceId, user.id);

  if (!workspace) {
    return c.json({ success: false, error: "Workspace not found" }, 404);
  }

  return c.json({
    success: true,
    data: workspace,
  });
});

/**
 * PATCH /api/workspaces/:workspaceId
 * Update a workspace
 */
workspaces.patch("/:workspaceId", zValidator("json", updateWorkspaceSchema), async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const input = c.req.valid("json");

  const workspace = await workspaceService.update(workspaceId, user.id, input);

  if (!workspace) {
    return c.json({ success: false, error: "Workspace not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    data: workspace,
  });
});

/**
 * DELETE /api/workspaces/:workspaceId
 * Delete a workspace
 */
workspaces.delete("/:workspaceId", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");

  const deleted = await workspaceService.delete(workspaceId, user.id);

  if (!deleted) {
    return c.json({ success: false, error: "Workspace not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    message: "Workspace deleted",
  });
});

// ============================================
// Member Management Routes
// ============================================

const addMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["admin", "member", "viewer"]),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

/**
 * GET /api/workspaces/:workspaceId/members
 * List all members of a workspace
 */
workspaces.get("/:workspaceId/members", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");

  const members = await workspaceService.listMembers(workspaceId, user.id);

  if (members === null) {
    return c.json({ success: false, error: "Workspace not found or access denied" }, 404);
  }

  return c.json({
    success: true,
    data: members,
  });
});

/**
 * POST /api/workspaces/:workspaceId/members
 * Add a member to workspace
 */
workspaces.post("/:workspaceId/members", zValidator("json", addMemberSchema), async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const { userId: targetUserId, role } = c.req.valid("json");

  const result = await workspaceService.addMember(workspaceId, user.id, targetUserId, role);

  if (!result.success) {
    const status = result.error === "Permission denied" ? 403 : 400;
    return c.json({ success: false, error: result.error }, status);
  }

  return c.json(
    {
      success: true,
      message: "Member added successfully",
    },
    201
  );
});

/**
 * PATCH /api/workspaces/:workspaceId/members/:userId
 * Update a member's role
 */
workspaces.patch("/:workspaceId/members/:userId", zValidator("json", updateMemberRoleSchema), async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const targetUserId = c.req.param("userId");
  const { role } = c.req.valid("json");

  const result = await workspaceService.updateMemberRole(workspaceId, user.id, targetUserId, role);

  if (!result.success) {
    const status = result.error === "Permission denied" ? 403 : 400;
    return c.json({ success: false, error: result.error }, status);
  }

  return c.json({
    success: true,
    message: "Member role updated successfully",
  });
});

/**
 * DELETE /api/workspaces/:workspaceId/members/:userId
 * Remove a member from workspace
 */
workspaces.delete("/:workspaceId/members/:userId", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const targetUserId = c.req.param("userId");

  const result = await workspaceService.removeMember(workspaceId, user.id, targetUserId);

  if (!result.success) {
    const status = result.error === "Permission denied" ? 403 : 400;
    return c.json({ success: false, error: result.error }, status);
  }

  return c.json({
    success: true,
    message: "Member removed successfully",
  });
});

export { workspaces as workspaceRoutes };
