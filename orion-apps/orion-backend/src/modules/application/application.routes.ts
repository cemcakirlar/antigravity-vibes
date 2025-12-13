import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { applicationService } from './application.service'
import { authMiddleware } from '../../middleware/auth.middleware'
import type { User } from '../../db'

const apps = new Hono<{
    Variables: {
        user: Omit<User, 'passwordHash'>
    }
}>()

// All routes require authentication
apps.use('*', authMiddleware)

// Validation schemas
const createAppSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().optional(),
    description: z.string().optional(),
})

const updateAppSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    settings: z.record(z.unknown()).optional(),
})

/**
 * POST /api/workspaces/:workspaceId/apps
 * Create a new application in a workspace
 */
apps.post('/workspaces/:workspaceId/apps', zValidator('json', createAppSchema), async (c) => {
    try {
        const user = c.get('user')
        const workspaceId = c.req.param('workspaceId')
        const input = c.req.valid('json')

        const application = await applicationService.create(workspaceId, user.id, input)

        if (!application) {
            return c.json({ success: false, error: 'Workspace not found or access denied' }, 404)
        }

        return c.json({
            success: true,
            data: application,
        }, 201)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create application'
        return c.json({ success: false, error: message }, 400)
    }
})

/**
 * GET /api/workspaces/:workspaceId/apps
 * List all applications in a workspace
 */
apps.get('/workspaces/:workspaceId/apps', async (c) => {
    const user = c.get('user')
    const workspaceId = c.req.param('workspaceId')

    const list = await applicationService.listByWorkspace(workspaceId, user.id)

    return c.json({
        success: true,
        data: list,
    })
})

/**
 * GET /api/apps/:appId
 * Get a specific application
 */
apps.get('/apps/:appId', async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')

    const application = await applicationService.getWithForms(appId, user.id)

    if (!application) {
        return c.json({ success: false, error: 'Application not found' }, 404)
    }

    return c.json({
        success: true,
        data: application,
    })
})

/**
 * PATCH /api/apps/:appId
 * Update an application
 */
apps.patch('/apps/:appId', zValidator('json', updateAppSchema), async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')
    const input = c.req.valid('json')

    const application = await applicationService.update(appId, user.id, input)

    if (!application) {
        return c.json({ success: false, error: 'Application not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        data: application,
    })
})

/**
 * DELETE /api/apps/:appId
 * Delete an application
 */
apps.delete('/apps/:appId', async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')

    const deleted = await applicationService.delete(appId, user.id)

    if (!deleted) {
        return c.json({ success: false, error: 'Application not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        message: 'Application deleted',
    })
})

export { apps as applicationRoutes }
