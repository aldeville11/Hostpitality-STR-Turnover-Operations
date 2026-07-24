import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
    env: {
      NODE_ENV: "test",
      SESSION_PEPPER: "test-session-pepper-not-for-production",
      BCRYPT_COST: "4",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
