import "reflect-metadata";
import { DataSource } from "typeorm";
import type { DataSourceOptions, LoggerOptions } from "typeorm";
import { User } from "./entities/user.entity";
import { Address } from "./entities/address.entity";

// Supported database types
type SupportedDatabase = "postgres" | "sqlite" | "mssql" | "mysql";

// Entity list - add new entities here
const entities = [User, Address];

/**
 * Creates DataSource options from environment variables.
 *
 * Required env vars:
 * - DB_TYPE: 'postgres' | 'sqlite' | 'mssql' | 'mysql' (default: 'sqlite')
 * - DATABASE_URL: Connection string (for sqlite: file path, default: './data.sqlite')
 */
function createDataSourceOptions(): DataSourceOptions {
  const dbType = (process.env.DB_TYPE || "sqlite") as SupportedDatabase;
  const databaseUrl = process.env.DATABASE_URL || "./data.sqlite";
  const isDev = process.env.NODE_ENV !== "production";

  const logging: LoggerOptions = isDev ? ["error", "warn"] : false;

  const baseOptions = {
    entities,
    synchronize: isDev,
    logging,
  };

  switch (dbType) {
    case "postgres":
      return { ...baseOptions, type: "postgres", url: databaseUrl };

    case "mysql":
      return { ...baseOptions, type: "mysql", url: databaseUrl };

    case "mssql":
      return {
        ...baseOptions,
        type: "mssql",
        url: databaseUrl,
        options: { encrypt: true, trustServerCertificate: isDev },
      };

    case "sqlite":
    default:
      return {
        ...baseOptions,
        type: "better-sqlite3",
        database: databaseUrl,
      };
  }
}

// Singleton DataSource instance
export const AppDataSource = new DataSource(createDataSourceOptions());

// Connection state
let isInitialized = false;

/**
 * Initializes the database connection (lazy initialization).
 * Can be called multiple times safely - only connects on first call.
 */
export async function initializeDatabase(): Promise<DataSource> {
  if (!isInitialized && !AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    isInitialized = true;
    console.log(`Database connected (${process.env.DB_TYPE || "sqlite"})`);
  }
  return AppDataSource;
}

/**
 * Closes the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    isInitialized = false;
    console.log("Database connection closed");
  }
}
