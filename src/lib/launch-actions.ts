"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  repairDataIntegrity,
  retryJobsForLaunch,
  runSmokeTests,
} from "@/lib/launch";
import { log } from "@/lib/logger";

export type LaunchActionState = {
  ok: boolean;
  message: string;
  details?: string[];
};

export async function repairIntegrityAction(): Promise<LaunchActionState> {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) {
    return { ok: false, message: "Company required." };
  }
  try {
    const result = await repairDataIntegrity({
      companyId: user.companyId,
      userId: user.id,
    });
    log.info("launch.repair", {
      companyId: user.companyId,
      repairs: result.repairs.length,
    });
    revalidatePath("/launch");
    revalidatePath("/settings");
    return {
      ok: true,
      message:
        result.repairs.length === 0
          ? "Nothing to repair — data looks consistent."
          : `Repaired ${result.repairs.length} item(s).`,
      details: result.repairs,
    };
  } catch (error) {
    log.error("launch.repair_failed", { error: String(error) });
    return { ok: false, message: "Repair failed. See server logs." };
  }
}

export async function retryFailedJobsAction(): Promise<LaunchActionState> {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) {
    return { ok: false, message: "Company required." };
  }
  try {
    const result = await retryJobsForLaunch({
      companyId: user.companyId,
      userId: user.id,
      force: true,
    });
    log.info("launch.retry_jobs", { companyId: user.companyId, ...result });
    revalidatePath("/launch");
    return {
      ok: true,
      message: `Requeued ${result.requeued} job(s).`,
    };
  } catch (error) {
    log.error("launch.retry_jobs_failed", { error: String(error) });
    return { ok: false, message: "Could not retry jobs." };
  }
}

export async function runSmokeTestsAction(): Promise<LaunchActionState> {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) {
    return { ok: false, message: "Company required." };
  }
  try {
    const results = await runSmokeTests(user.companyId);
    const failed = results.filter((r) => !r.ok);
    log.info("launch.smoke", {
      companyId: user.companyId,
      passed: results.length - failed.length,
      failed: failed.length,
    });
    revalidatePath("/launch");
    return {
      ok: failed.length === 0,
      message:
        failed.length === 0
          ? `All ${results.length} smoke tests passed.`
          : `${failed.length} of ${results.length} smoke tests failed.`,
      details: results.map(
        (r) => `${r.ok ? "PASS" : "FAIL"} · ${r.name}: ${r.detail}`
      ),
    };
  } catch (error) {
    log.error("launch.smoke_failed", { error: String(error) });
    return { ok: false, message: "Smoke suite crashed." };
  }
}
