import { eq, and } from "drizzle-orm";
import { db, workspaces, workspaceMembers, users, type Workspace, type NewWorkspace } from "../../db";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "@orion/shared";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

class WorkspaceService {
  /**
   * Create a new workspace
   */
  async create(ownerId: string, input: CreateWorkspaceInput): Promise<Workspace> {
    const slug = input.slug || generateSlug(input.name);

    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: input.name,
        slug,
        ownerId,
      })
      .returning();

    // Add owner as a member with owner role
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: ownerId,
      role: "owner",
    });

    return workspace;
  }

  /**
   * List all workspaces for a user
   */
  async listByUser(userId: string): Promise<Workspace[]> {
    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
    });

    return memberships.map((m) => m.workspace);
  }

  /**
   * Get a workspace by ID (with user access check)
   */
  async getById(workspaceId: string, userId: string): Promise<Workspace | null> {
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
      with: {
        workspace: true,
      },
    });

    return membership?.workspace || null;
  }

  /**
   * Get a workspace by slug
   */
  async getBySlug(slug: string, userId: string): Promise<Workspace | null> {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, slug),
    });

    if (!workspace) {
      return null;
    }

    // Check if user has access
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspace.id), eq(workspaceMembers.userId, userId)),
    });

    return membership ? workspace : null;
  }

  /**
   * Update a workspace
   */
  async update(workspaceId: string, userId: string, input: UpdateWorkspaceInput): Promise<Workspace | null> {
    // Check if user is owner or admin
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
    });

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return null;
    }

    const [updated] = await db
      .update(workspaces)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return updated;
  }

  /**
   * Delete a workspace (owner only)
   */
  async delete(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace || workspace.ownerId !== userId) {
      return false;
    }

    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return true;
  }

  /**
   * Check if user has access to workspace
   */
  async hasAccess(workspaceId: string, userId: string): Promise<boolean> {
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
    });

    return !!membership;
  }

  // ============================================
  // Member Management
  // ============================================

  /**
   * List all members of a workspace
   */
  async listMembers(workspaceId: string, userId: string) {
    // Check if user has access
    const hasAccess = await this.hasAccess(workspaceId, userId);
    if (!hasAccess) {
      return null;
    }

    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return members.map((m) => ({
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  /**
   * Add a member to workspace
   */
  async addMember(
    workspaceId: string,
    requesterId: string,
    targetUserId: string,
    role: "admin" | "member" | "viewer"
  ): Promise<{ success: boolean; error?: string }> {
    // Check if requester is owner or admin
    const requesterMembership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, requesterId)),
    });

    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
      return { success: false, error: "Permission denied" };
    }

    // Check if target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Check if already a member
    const existingMembership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)),
    });

    if (existingMembership) {
      return { success: false, error: "User is already a member" };
    }

    // Add member
    await db.insert(workspaceMembers).values({
      workspaceId,
      userId: targetUserId,
      role,
    });

    return { success: true };
  }

  /**
   * Remove a member from workspace
   */
  async removeMember(workspaceId: string, requesterId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    // Check if requester is owner or admin
    const requesterMembership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, requesterId)),
    });

    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
      return { success: false, error: "Permission denied" };
    }

    // Cannot remove owner
    const targetMembership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)),
    });

    if (!targetMembership) {
      return { success: false, error: "Member not found" };
    }

    if (targetMembership.role === "owner") {
      return { success: false, error: "Cannot remove workspace owner" };
    }

    // Remove member
    await db.delete(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)));

    return { success: true };
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    workspaceId: string,
    requesterId: string,
    targetUserId: string,
    newRole: "admin" | "member" | "viewer"
  ): Promise<{ success: boolean; error?: string }> {
    // Check if requester is owner or admin
    const requesterMembership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, requesterId)),
    });

    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
      return { success: false, error: "Permission denied" };
    }

    // Cannot change owner's role
    const targetMembership = await db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)),
    });

    if (!targetMembership) {
      return { success: false, error: "Member not found" };
    }

    if (targetMembership.role === "owner") {
      return { success: false, error: "Cannot change owner's role" };
    }

    // Update role
    await db
      .update(workspaceMembers)
      .set({ role: newRole })
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, targetUserId)));

    return { success: true };
  }
}

export const workspaceService = new WorkspaceService();
