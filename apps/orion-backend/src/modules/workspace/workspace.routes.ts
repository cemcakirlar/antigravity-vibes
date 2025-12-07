import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { workspaceService } from './workspace.service'
import { authMiddleware } from '../../middleware/auth.middleware'
import type { User } from '../../db'

const workspaces = new Hono<{
    Variables: {
        user: Omit<User, 'passwordHash'>
    }
}>()

// All routes require authentication
workspaces.use('*', authMiddleware)

// Validation schemas
const createWorkspaceSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().optional(),
})

const updateWorkspaceSchema = z.object({
    name: z.string().min(2).optional(),
})

/**
 * POST /api/workspaces
 * Create a new workspace
 */
workspaces.post('/', zValidator('json', createWorkspaceSchema), async (c) => {
    try {
        const user = c.get('user')
        const input = c.req.valid('json')
        const workspace = await workspaceService.create(user.id, input)

        return c.json({
            success: true,
            data: workspace,
        }, 201)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create workspace'
        return c.json({ success: false, error: message }, 400)
    }
})

/**
 * GET /api/workspaces
 * List all workspaces for current user
 */
workspaces.get('/', async (c) => {
    const user = c.get('user')
    const list = await workspaceService.listByUser(user.id)

    return c.json({
        success: true,
        data: list,
    })
})

/**
 * GET /api/workspaces/:workspaceId
 * Get a specific workspace
 */
workspaces.get('/:workspaceId', async (c) => {
    const user = c.get('user')
    const workspaceId = c.req.param('workspaceId')
    const workspace = await workspaceService.getById(workspaceId, user.id)

    if (!workspace) {
        return c.json({ success: false, error: 'Workspace not found' }, 404)
    }

    return c.json({
        success: true,
        data: workspace,
    })
})

/**
 * PATCH /api/workspaces/:workspaceId
 * Update a workspace
 */
workspaces.patch('/:workspaceId', zValidator('json', updateWorkspaceSchema), async (c) => {
    const user = c.get('user')
    const workspaceId = c.req.param('workspaceId')
    const input = c.req.valid('json')

    const workspace = await workspaceService.update(workspaceId, user.id, input)

    if (!workspace) {
        return c.json({ success: false, error: 'Workspace not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        data: workspace,
    })
})

/**
 * DELETE /api/workspaces/:workspaceId
 * Delete a workspace
 */
workspaces.delete('/:workspaceId', async (c) => {
    const user = c.get('user')
    const workspaceId = c.req.param('workspaceId')

    const deleted = await workspaceService.delete(workspaceId, user.id)

    if (!deleted) {
        return c.json({ success: false, error: 'Workspace not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        message: 'Workspace deleted',
    })
})

export { workspaces as workspaceRoutes }
