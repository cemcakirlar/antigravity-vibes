import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { userService } from "./user.service";
import { authMiddleware } from "../../middleware/auth.middleware";

const userRoutes = new Hono();

// All routes require authentication
userRoutes.use("*", authMiddleware);

// List users
userRoutes.get("/", async (c) => {
  const { page = "1", limit = "50" } = c.req.query();

  const result = await userService.list(parseInt(page), parseInt(limit));

  return c.json({
    success: true,
    ...result,
  });
});

// Get single user
userRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();

  const user = await userService.getById(id);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({
    success: true,
    data: user,
  });
});

// Update user
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

userRoutes.patch("/:id", zValidator("json", updateUserSchema), async (c) => {
  const { id } = c.req.param();
  const input = c.req.valid("json");

  try {
    const user = await userService.update(id, input);

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";

    if (message === "User not found") {
      return c.json({ success: false, error: message }, 404);
    }

    if (message === "Email is already taken") {
      return c.json({ success: false, error: message }, 400);
    }

    return c.json({ success: false, error: message }, 500);
  }
});

// Change password
const changePasswordSchema = z.object({
  password: z.string().min(6),
});

userRoutes.patch("/:id/password", zValidator("json", changePasswordSchema), async (c) => {
  const { id } = c.req.param();
  const { password } = c.req.valid("json");

  try {
    await userService.updatePassword(id, password);

    return c.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update password";

    if (message === "User not found") {
      return c.json({ success: false, error: message }, 404);
    }

    return c.json({ success: false, error: message }, 500);
  }
});

// Delete user
userRoutes.delete("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    await userService.delete(id);

    return c.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";

    if (message === "User not found") {
      return c.json({ success: false, error: message }, 404);
    }

    return c.json({ success: false, error: message }, 500);
  }
});

export { userRoutes };
