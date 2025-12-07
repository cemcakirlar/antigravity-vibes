import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { formService } from './form.service'
import { authMiddleware } from '../../middleware/auth.middleware'
import type { User } from '../../db'

const formsRouter = new Hono<{
    Variables: {
        user: Omit<User, 'passwordHash'>
    }
}>()

// All routes require authentication
formsRouter.use('*', authMiddleware)

// Validation schemas
const createFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().optional(),
    description: z.string().optional(),
})

const updateFormSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    layout: z.record(z.unknown()).optional(),
    settings: z.record(z.unknown()).optional(),
    sortOrder: z.number().int().optional(),
})

/**
 * POST /api/apps/:appId/forms
 * Create a new form in an application
 */
formsRouter.post('/apps/:appId/forms', zValidator('json', createFormSchema), async (c) => {
    try {
        const user = c.get('user')
        const appId = c.req.param('appId')
        const input = c.req.valid('json')

        const form = await formService.create(appId, user.id, input)

        if (!form) {
            return c.json({ success: false, error: 'Application not found or access denied' }, 404)
        }

        return c.json({
            success: true,
            data: form,
        }, 201)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create form'
        return c.json({ success: false, error: message }, 400)
    }
})

/**
 * GET /api/apps/:appId/forms
 * List all forms in an application
 */
formsRouter.get('/apps/:appId/forms', async (c) => {
    const user = c.get('user')
    const appId = c.req.param('appId')

    const list = await formService.listByApp(appId, user.id)

    return c.json({
        success: true,
        data: list,
    })
})

/**
 * GET /api/forms/:formId
 * Get a specific form with its fields
 */
formsRouter.get('/forms/:formId', async (c) => {
    const user = c.get('user')
    const formId = c.req.param('formId')

    const form = await formService.getWithFields(formId, user.id)

    if (!form) {
        return c.json({ success: false, error: 'Form not found' }, 404)
    }

    return c.json({
        success: true,
        data: form,
    })
})

/**
 * PATCH /api/forms/:formId
 * Update a form
 */
formsRouter.patch('/forms/:formId', zValidator('json', updateFormSchema), async (c) => {
    const user = c.get('user')
    const formId = c.req.param('formId')
    const input = c.req.valid('json')

    const form = await formService.update(formId, user.id, input)

    if (!form) {
        return c.json({ success: false, error: 'Form not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        data: form,
    })
})

/**
 * DELETE /api/forms/:formId
 * Delete a form
 */
formsRouter.delete('/forms/:formId', async (c) => {
    const user = c.get('user')
    const formId = c.req.param('formId')

    const deleted = await formService.delete(formId, user.id)

    if (!deleted) {
        return c.json({ success: false, error: 'Form not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        message: 'Form deleted',
    })
})

export { formsRouter as formRoutes }
