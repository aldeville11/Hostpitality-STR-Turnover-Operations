import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env.server";
import { processDueJobs } from "@/lib/jobs";
import { secretsMatchRotation } from "@/lib/secrets";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const headerSecret = request.headers.get("x-cron-secret") ?? "";
  const provided = bearer || headerSecret;

  const env = getServerEnv();
  const authorized = secretsMatchRotation(
    provided,
    env.cronSecret,
    env.cronSecretPrevious
  );

  if (!authorized) {
    log.warn("jobs.process.unauthorized", { route: "/api/jobs/process" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processDueJobs(env.jobBatchSize);
    log.info("jobs.process.completed", {
      route: "/api/jobs/process",
      processed: results.length,
    });
    return NextResponse.json({ ok: true, processed: results.length });
  } catch (err) {
    log.error("jobs.process.failed", {
      route: "/api/jobs/process",
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
