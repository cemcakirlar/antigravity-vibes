import { eq, desc, sql } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { db, users, type User } from "../../db";
import type { UpdateUserInput, Pagination } from "@orion/shared";

export interface UserListResult {
  data: Omit<User, "passwordHash">[];
  pagination: Pagination;
}

class UserService {
  /**
   * List all users with pagination
   */
  async list(page = 1, limit = 50): Promise<UserListResult> {
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      db.query.users.findMany({
        orderBy: desc(users.createdAt),
        limit,
        offset,
        columns: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(users),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: data as Omit<User, "passwordHash">[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<Omit<User, "passwordHash"> | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as Omit<User, "passwordHash"> | null;
  }

  /**
   * Update user
   */
  async update(id: string, input: UpdateUserInput): Promise<Omit<User, "passwordHash">> {
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      // Check if email is taken by another user
      const existing = await db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase()),
      });

      if (existing && existing.id !== id) {
        throw new Error("Email is already taken");
      }

      updateData.email = input.email.toLowerCase();
    }

    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

    if (!updated) {
      throw new Error("User not found");
    }

    const { passwordHash: _, ...sanitized } = updated;
    return sanitized;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hash(newPassword);

    const result = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (result.length === 0) {
      throw new Error("User not found");
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });

    if (result.length === 0) {
      throw new Error("User not found");
    }
  }
}

export const userService = new UserService();
