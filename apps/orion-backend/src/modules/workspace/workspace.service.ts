import { eq, and } from 'drizzle-orm'
import { db, workspaces, workspaceMembers, type Workspace, type NewWorkspace } from '../../db'

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substring(2, 8)
}

export interface CreateWorkspaceInput {
    name: string
    slug?: string
}

export interface UpdateWorkspaceInput {
    name?: string
}

class WorkspaceService {
    /**
     * Create a new workspace
     */
    async create(ownerId: string, input: CreateWorkspaceInput): Promise<Workspace> {
        const slug = input.slug || generateSlug(input.name)

        const [workspace] = await db.insert(workspaces).values({
            name: input.name,
            slug,
            ownerId,
        }).returning()

        // Add owner as a member with owner role
        await db.insert(workspaceMembers).values({
            workspaceId: workspace.id,
            userId: ownerId,
            role: 'owner',
        })

        return workspace
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
        })

        return memberships.map(m => m.workspace)
    }

    /**
     * Get a workspace by ID (with user access check)
     */
    async getById(workspaceId: string, userId: string): Promise<Workspace | null> {
        const membership = await db.query.workspaceMembers.findFirst({
            where: and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, userId)
            ),
            with: {
                workspace: true,
            },
        })

        return membership?.workspace || null
    }

    /**
     * Get a workspace by slug
     */
    async getBySlug(slug: string, userId: string): Promise<Workspace | null> {
        const workspace = await db.query.workspaces.findFirst({
            where: eq(workspaces.slug, slug),
        })

        if (!workspace) {
            return null
        }

        // Check if user has access
        const membership = await db.query.workspaceMembers.findFirst({
            where: and(
                eq(workspaceMembers.workspaceId, workspace.id),
                eq(workspaceMembers.userId, userId)
            ),
        })

        return membership ? workspace : null
    }

    /**
     * Update a workspace
     */
    async update(workspaceId: string, userId: string, input: UpdateWorkspaceInput): Promise<Workspace | null> {
        // Check if user is owner or admin
        const membership = await db.query.workspaceMembers.findFirst({
            where: and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, userId)
            ),
        })

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return null
        }

        const [updated] = await db.update(workspaces)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(workspaces.id, workspaceId))
            .returning()

        return updated
    }

    /**
     * Delete a workspace (owner only)
     */
    async delete(workspaceId: string, userId: string): Promise<boolean> {
        const workspace = await db.query.workspaces.findFirst({
            where: eq(workspaces.id, workspaceId),
        })

        if (!workspace || workspace.ownerId !== userId) {
            return false
        }

        await db.delete(workspaces).where(eq(workspaces.id, workspaceId))
        return true
    }

    /**
     * Check if user has access to workspace
     */
    async hasAccess(workspaceId: string, userId: string): Promise<boolean> {
        const membership = await db.query.workspaceMembers.findFirst({
            where: and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, userId)
            ),
        })

        return !!membership
    }
}

export const workspaceService = new WorkspaceService()
