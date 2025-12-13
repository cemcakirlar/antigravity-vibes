import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { fieldService } from './field.service'
import { authMiddleware } from '../../middleware/auth.middleware'
import type { User } from '../../db'

const fieldsRouter = new Hono<{
    Variables: {
        user: Omit<User, 'passwordHash'>
    }
}>()

// All routes require authentication
fieldsRouter.use('*', authMiddleware)

// Field type enum for validation
const fieldTypeEnum = z.enum([
    'text', 'number', 'email', 'date', 'datetime', 'boolean',
    'select', 'multiselect', 'lookup', 'file', 'textarea', 'url', 'phone'
])

// Validation schemas
const createFieldSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    label: z.string().min(1, 'Label is required'),
    type: fieldTypeEnum,
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    defaultValue: z.string().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    validation: z.record(z.unknown()).optional(),
    options: z.record(z.unknown()).optional(),
})

const updateFieldSchema = z.object({
    label: z.string().min(1).optional(),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    defaultValue: z.string().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    validation: z.record(z.unknown()).optional(),
    options: z.record(z.unknown()).optional(),
    sortOrder: z.number().int().optional(),
})

const reorderFieldsSchema = z.object({
    fieldIds: z.array(z.string().uuid()),
})

/**
 * POST /api/forms/:formId/fields
 * Create a new field in a form
 */
fieldsRouter.post('/forms/:formId/fields', zValidator('json', createFieldSchema), async (c) => {
    try {
        const user = c.get('user')
        const formId = c.req.param('formId')
        const input = c.req.valid('json')

        const field = await fieldService.create(formId, user.id, input)

        if (!field) {
            return c.json({ success: false, error: 'Form not found or access denied' }, 404)
        }

        return c.json({
            success: true,
            data: field,
        }, 201)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create field'
        return c.json({ success: false, error: message }, 400)
    }
})

/**
 * GET /api/forms/:formId/fields
 * List all fields in a form
 */
fieldsRouter.get('/forms/:formId/fields', async (c) => {
    const user = c.get('user')
    const formId = c.req.param('formId')

    const list = await fieldService.listByForm(formId, user.id)

    return c.json({
        success: true,
        data: list,
    })
})

/**
 * PATCH /api/fields/:fieldId
 * Update a field
 */
fieldsRouter.patch('/fields/:fieldId', zValidator('json', updateFieldSchema), async (c) => {
    const user = c.get('user')
    const fieldId = c.req.param('fieldId')
    const input = c.req.valid('json')

    const field = await fieldService.update(fieldId, user.id, input)

    if (!field) {
        return c.json({ success: false, error: 'Field not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        data: field,
    })
})

/**
 * DELETE /api/fields/:fieldId
 * Delete a field
 */
fieldsRouter.delete('/fields/:fieldId', async (c) => {
    const user = c.get('user')
    const fieldId = c.req.param('fieldId')

    const deleted = await fieldService.delete(fieldId, user.id)

    if (!deleted) {
        return c.json({ success: false, error: 'Field not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        message: 'Field deleted',
    })
})

/**
 * POST /api/forms/:formId/fields/reorder
 * Reorder fields in a form
 */
fieldsRouter.post('/forms/:formId/fields/reorder', zValidator('json', reorderFieldsSchema), async (c) => {
    const user = c.get('user')
    const formId = c.req.param('formId')
    const { fieldIds } = c.req.valid('json')

    const success = await fieldService.reorder(formId, user.id, fieldIds)

    if (!success) {
        return c.json({ success: false, error: 'Form not found or access denied' }, 404)
    }

    return c.json({
        success: true,
        message: 'Fields reordered',
    })
})

export { fieldsRouter as fieldRoutes }
