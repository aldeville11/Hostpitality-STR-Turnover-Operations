import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

async function main() {
  const config = loadConfig();
  const { app } = await createApp({ config });

  console.log(
    JSON.stringify({
      level: "info",
      msg: "Acquisition OS API listening",
      port: config.port,
      env: config.nodeEnv,
    })
  );

  serve({ fetch: app.fetch, port: config.port });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
