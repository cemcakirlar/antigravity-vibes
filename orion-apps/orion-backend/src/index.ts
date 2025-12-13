import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Route imports
import { authRoutes } from "./modules/auth/auth.routes";
import { workspaceRoutes } from "./modules/workspace/workspace.routes";
import { applicationRoutes } from "./modules/application/application.routes";
import { formRoutes } from "./modules/form/form.routes";
import { fieldRoutes } from "./modules/field/field.routes";
import { recordRoutes } from "./modules/record/record.routes";
import { userRoutes } from "./modules/user/user.routes";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Root route
app.get("/", (c) => {
  return c.json({
    name: "Orion API",
    version: "0.0.1",
    description: "Low-Code Platform Backend",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", uptime: process.uptime() });
});

// API routes
const api = new Hono();

// Mount auth routes
api.route("/auth", authRoutes);

// Mount workspace routes
api.route("/workspaces", workspaceRoutes);

// Mount application routes (has mixed paths)
api.route("/", applicationRoutes);

// Mount form routes (has mixed paths)
api.route("/", formRoutes);

// Mount field routes (has mixed paths)
api.route("/", fieldRoutes);

// Mount record routes (has mixed paths)
api.route("/", recordRoutes);

// Mount user routes
api.route("/users", userRoutes);

// Mount API under /api prefix
app.route("/api", api);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json({ success: false, error: err.message }, 500);
});

const port = process.env.PORT || 3000;

console.log(`🚀 Orion API is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
