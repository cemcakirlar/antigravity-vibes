import { eq, and } from 'drizzle-orm'
import { db, applications, type Application, type NewApplication } from '../../db'
import { workspaceService } from '../workspace/workspace.service'

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export interface CreateApplicationInput {
    name: string
    slug?: string
    description?: string
}

export interface UpdateApplicationInput {
    name?: string
    description?: string
    settings?: Record<string, unknown>
}

class ApplicationService {
    /**
     * Create a new application in a workspace
     */
    async create(workspaceId: string, userId: string, input: CreateApplicationInput): Promise<Application | null> {
        // Check workspace access
        const hasAccess = await workspaceService.hasAccess(workspaceId, userId)
        if (!hasAccess) {
            return null
        }

        const slug = input.slug || generateSlug(input.name)

        const [application] = await db.insert(applications).values({
            workspaceId,
            name: input.name,
            slug,
            description: input.description,
        }).returning()

        return application
    }

    /**
     * List all applications in a workspace
     */
    async listByWorkspace(workspaceId: string, userId: string): Promise<Application[]> {
        // Check workspace access
        const hasAccess = await workspaceService.hasAccess(workspaceId, userId)
        if (!hasAccess) {
            return []
        }

        return await db.query.applications.findMany({
            where: eq(applications.workspaceId, workspaceId),
            orderBy: (apps, { desc }) => [desc(apps.createdAt)],
        })
    }

    /**
     * Get an application by ID
     */
    async getById(appId: string, userId: string): Promise<Application | null> {
        const app = await db.query.applications.findFirst({
            where: eq(applications.id, appId),
            with: {
                workspace: true,
            },
        })

        if (!app) {
            return null
        }

        // Check workspace access
        const hasAccess = await workspaceService.hasAccess(app.workspaceId, userId)
        if (!hasAccess) {
            return null
        }

        return app
    }

    /**
     * Get an application with its forms
     */
    async getWithForms(appId: string, userId: string): Promise<(Application & { forms: unknown[] }) | null> {
        const app = await db.query.applications.findFirst({
            where: eq(applications.id, appId),
            with: {
                workspace: true,
                forms: {
                    orderBy: (forms, { asc }) => [asc(forms.sortOrder)],
                },
            },
        })

        if (!app) {
            return null
        }

        // Check workspace access
        const hasAccess = await workspaceService.hasAccess(app.workspaceId, userId)
        if (!hasAccess) {
            return null
        }

        return app
    }

    /**
     * Update an application
     */
    async update(appId: string, userId: string, input: UpdateApplicationInput): Promise<Application | null> {
        const app = await this.getById(appId, userId)
        if (!app) {
            return null
        }

        const [updated] = await db.update(applications)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(applications.id, appId))
            .returning()

        return updated
    }

    /**
     * Delete an application
     */
    async delete(appId: string, userId: string): Promise<boolean> {
        const app = await this.getById(appId, userId)
        if (!app) {
            return false
        }

        await db.delete(applications).where(eq(applications.id, appId))
        return true
    }
}

export const applicationService = new ApplicationService()
