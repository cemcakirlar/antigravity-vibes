import { eq } from 'drizzle-orm'
import { db, fields, type Field, type NewField } from '../../db'
import { formService } from '../form/form.service'

export interface CreateFieldInput {
    name: string
    label: string
    type: 'text' | 'number' | 'email' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'lookup' | 'file' | 'textarea' | 'url' | 'phone'
    required?: boolean
    unique?: boolean
    defaultValue?: string
    placeholder?: string
    helpText?: string
    validation?: Record<string, unknown>
    options?: Record<string, unknown>
}

export interface UpdateFieldInput {
    label?: string
    required?: boolean
    unique?: boolean
    defaultValue?: string
    placeholder?: string
    helpText?: string
    validation?: Record<string, unknown>
    options?: Record<string, unknown>
    sortOrder?: number
}

class FieldService {
    /**
     * Create a new field in a form
     */
    async create(formId: string, userId: string, input: CreateFieldInput): Promise<Field | null> {
        // Check form access
        const form = await formService.getById(formId, userId)
        if (!form) {
            return null
        }

        // Get max sort order
        const existingFields = await db.query.fields.findMany({
            where: eq(fields.formId, formId),
        })
        const maxSortOrder = existingFields.length > 0
            ? Math.max(...existingFields.map(f => f.sortOrder))
            : 0

        // Sanitize field name for database column use
        const sanitizedName = input.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')

        const [field] = await db.insert(fields).values({
            formId,
            name: sanitizedName,
            label: input.label,
            type: input.type,
            required: input.required ?? false,
            unique: input.unique ?? false,
            defaultValue: input.defaultValue,
            placeholder: input.placeholder,
            helpText: input.helpText,
            validation: input.validation ?? {},
            options: input.options ?? {},
            sortOrder: maxSortOrder + 1,
        }).returning()

        return field
    }

    /**
     * List all fields in a form
     */
    async listByForm(formId: string, userId: string): Promise<Field[]> {
        // Check form access
        const form = await formService.getById(formId, userId)
        if (!form) {
            return []
        }

        return await db.query.fields.findMany({
            where: eq(fields.formId, formId),
            orderBy: (fields, { asc }) => [asc(fields.sortOrder)],
        })
    }

    /**
     * Get a field by ID
     */
    async getById(fieldId: string, userId: string): Promise<Field | null> {
        const field = await db.query.fields.findFirst({
            where: eq(fields.id, fieldId),
            with: {
                form: {
                    with: {
                        application: true,
                    },
                },
            },
        })

        if (!field) {
            return null
        }

        // Check access through form
        const form = await formService.getById(field.formId, userId)
        if (!form) {
            return null
        }

        return field
    }

    /**
     * Update a field
     */
    async update(fieldId: string, userId: string, input: UpdateFieldInput): Promise<Field | null> {
        const field = await this.getById(fieldId, userId)
        if (!field) {
            return null
        }

        const [updated] = await db.update(fields)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(fields.id, fieldId))
            .returning()

        return updated
    }

    /**
     * Delete a field
     */
    async delete(fieldId: string, userId: string): Promise<boolean> {
        const field = await this.getById(fieldId, userId)
        if (!field) {
            return false
        }

        await db.delete(fields).where(eq(fields.id, fieldId))
        return true
    }

    /**
     * Reorder fields in a form
     */
    async reorder(formId: string, userId: string, fieldIds: string[]): Promise<boolean> {
        // Check form access
        const form = await formService.getById(formId, userId)
        if (!form) {
            return false
        }

        // Update sort order for each field
        for (let i = 0; i < fieldIds.length; i++) {
            await db.update(fields)
                .set({ sortOrder: i + 1 })
                .where(eq(fields.id, fieldIds[i]))
        }

        return true
    }
}

export const fieldService = new FieldService()
