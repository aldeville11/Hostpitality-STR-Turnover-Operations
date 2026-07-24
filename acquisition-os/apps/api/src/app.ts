import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiConfig } from "./config.js";
import { AuthService } from "./identity/auth-service.js";
import { InviteService } from "./identity/invite-service.js";
import { createIdentityRoutes } from "./identity/routes.js";
import type { IdentityStore } from "./identity/store.js";
import { MemoryIdentityStore } from "./identity/store.js";

export type CreateAppOptions = {
  config: ApiConfig;
  store?: IdentityStore;
  seedDemo?: boolean;
};

export async function createApp(options: CreateAppOptions) {
  const store = options.store ?? new MemoryIdentityStore();
  const auth = new AuthService(store, options.config);
  const invites = new InviteService(store);

  if (options.seedDemo !== false && options.config.nodeEnv !== "production") {
    await auth.seedDemoUser({
      email: "demo@acquisition-os.local",
      password: "ChangeMe-Demo-Only-1!",
      name: "Demo Operator",
    });
  }

  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: options.config.corsOrigin,
      credentials: true,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    })
  );

  app.get("/health", (c) =>
    c.json({ ok: true, service: "acquisition-os-api", sprint: 1 })
  );

  app.route("/api/v1", createIdentityRoutes({ auth, invites }));

  return { app, store, auth, invites };
}
