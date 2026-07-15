import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts", "src/**/*.suite.test.ts"],
    env: {
      NODE_ENV: "test",
      SESSION_PEPPER: "test-session-pepper-not-for-production",
      BCRYPT_COST: "4",
      CORS_ORIGIN: "http://localhost:5173",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.integration.test.ts", "src/**/*.suite.test.ts", "src/index.ts"],
    },
  },
});
