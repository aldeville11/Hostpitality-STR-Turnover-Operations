import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiConfig } from "./config.js";
import { createSqlDb, type SqlDb } from "./db/client.js";
import { AuthService } from "./identity/auth-service.js";
import { InviteService } from "./identity/invite-service.js";
import { createIdentityRoutes } from "./identity/routes.js";
import { SqlPlatformStore } from "./platform/sql-store.js";
import type { PlatformStore } from "./platform/types.js";
import { createTenancyRoutes } from "./tenancy/routes.js";
import { TenancyService } from "./tenancy/service.js";

export type CreateAppOptions = {
  config: ApiConfig;
  store?: PlatformStore;
  db?: SqlDb;
  seedDemo?: boolean;
};

export async function createApp(options: CreateAppOptions) {
  let ownedDb: SqlDb | null = null;
  let store = options.store;
  if (!store) {
    if (options.db) {
      store = new SqlPlatformStore(options.db);
    } else {
      const created = await createSqlDb();
      ownedDb = created.db;
      store = new SqlPlatformStore(created.db);
    }
  }

  const auth = new AuthService(store, options.config);
  const invites = new InviteService(store);
  const tenancy = new TenancyService(store);

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
    c.json({ ok: true, service: "acquisition-os-api", sprint: 2 })
  );

  app.route("/api/v1", createIdentityRoutes({ auth, invites }));
  app.route("/api/v1", createTenancyRoutes({ auth, tenancy, store }));

  return { app, store, auth, invites, tenancy, db: ownedDb };
}
