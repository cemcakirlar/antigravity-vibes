/**
 * @kreator/data - Database abstraction layer for Kreator platform
 *
 * This package provides TypeORM-based database access with:
 * - Database-agnostic configuration (PostgreSQL, MySQL, MSSQL, SQLite)
 * - Base entity with audit fields
 * - Example entities (User, Address) with relationships
 *
 * @example
 * ```typescript
 * import { initializeDatabase, User, Address } from '@kreator/data';
 *
 * // In a React Router loader
 * export async function loader() {
 *   await initializeDatabase();
 *
 *   const users = await User.find({
 *     relations: ['addresses'],
 *     order: { createdAt: 'DESC' },
 *   });
 *
 *   return { users };
 * }
 * ```
 */

// Database connection
export { AppDataSource, initializeDatabase, closeDatabase } from "./data-source";

// Entities
export { BaseEntity, User, Address } from "./entities";
