import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================
// ENUMS
// ============================================

export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'member', 'viewer'])

export const fieldTypeEnum = pgEnum('field_type', [
    'text',
    'number',
    'email',
    'date',
    'datetime',
    'boolean',
    'select',
    'multiselect',
    'lookup',
    'file',
    'textarea',
    'url',
    'phone',
])

// ============================================
// TABLES
// ============================================

// Users
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Workspaces
export const workspaces = pgTable('workspaces', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Workspace Members (many-to-many)
export const workspaceMembers = pgTable('workspace_members', {
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceRoleEnum('role').notNull().default('member'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
}))

// Applications
export const applications = pgTable('applications', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    settings: jsonb('settings').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Forms (represents a data entity/table)
export const forms = pgTable('forms', {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    tableName: text('table_name').notNull(), // Generated table name for user data
    description: text('description'),
    layout: jsonb('layout').default({}), // Form layout configuration
    settings: jsonb('settings').default({}),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Fields (columns in user data tables)
export const fields = pgTable('fields', {
    id: uuid('id').defaultRandom().primaryKey(),
    formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // Internal name (column name)
    label: text('label').notNull(), // Display label
    type: fieldTypeEnum('type').notNull(),
    required: boolean('required').default(false).notNull(),
    unique: boolean('unique').default(false).notNull(),
    defaultValue: text('default_value'),
    placeholder: text('placeholder'),
    helpText: text('help_text'),
    validation: jsonb('validation').default({}), // Validation rules
    options: jsonb('options').default({}), // Field-specific options (e.g., select choices)
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
    ownedWorkspaces: many(workspaces),
    workspaceMemberships: many(workspaceMembers),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
    owner: one(users, {
        fields: [workspaces.ownerId],
        references: [users.id],
    }),
    members: many(workspaceMembers),
    applications: many(applications),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
    workspace: one(workspaces, {
        fields: [workspaceMembers.workspaceId],
        references: [workspaces.id],
    }),
    user: one(users, {
        fields: [workspaceMembers.userId],
        references: [users.id],
    }),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
    workspace: one(workspaces, {
        fields: [applications.workspaceId],
        references: [workspaces.id],
    }),
    forms: many(forms),
}))

export const formsRelations = relations(forms, ({ one, many }) => ({
    application: one(applications, {
        fields: [forms.applicationId],
        references: [applications.id],
    }),
    fields: many(fields),
}))

export const fieldsRelations = relations(fields, ({ one }) => ({
    form: one(forms, {
        fields: [fields.formId],
        references: [forms.id],
    }),
}))

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert

export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert

export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert

export type Form = typeof forms.$inferSelect
export type NewForm = typeof forms.$inferInsert

export type Field = typeof fields.$inferSelect
export type NewField = typeof fields.$inferInsert
