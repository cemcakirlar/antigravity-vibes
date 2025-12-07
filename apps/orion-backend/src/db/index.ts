import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
}

// For query purposes
const queryClient = postgres(connectionString)

// Create drizzle instance with schema
export const db = drizzle(queryClient, { schema })

// Export schema for convenience
export * from './schema'
