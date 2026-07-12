import { NextResponse } from "next/server";
import { processDueJobs } from "@/lib/jobs";

export async function POST() {
  const results = await processDueJobs(25);
  return NextResponse.json({ ok: true, processed: results.length, results });
}

export async function GET() {
  const results = await processDueJobs(25);
  return NextResponse.json({ ok: true, processed: results.length, results });
}
