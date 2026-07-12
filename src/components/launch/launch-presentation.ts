import type { LaunchCheck, LaunchChecklist, ObservabilitySnapshot, SmokeTestResult } from "@/lib/launch";
import type { OperationalStatus } from "@/components/ui/status";

export type LaunchGateStatus = Extract<
  OperationalStatus,
  "passed" | "warning" | "failed" | "running" | "not_checked" | "blocked"
>;

export type LaunchCategoryId =
  | "identity"
  | "data"
  | "property"
  | "workforce"
  | "automation"
  | "integrations"
  | "quality"
  | "observability";

export const LAUNCH_CATEGORY_LABELS: Record<LaunchCategoryId, string> = {
  identity: "Identity and access",
  data: "Data integrity",
  property: "Property configuration",
  workforce: "Workforce readiness",
  automation: "Automation and jobs",
  integrations: "Integrations",
  quality: "Quality assurance",
  observability: "Reporting and observability",
};

export type LaunchGate = {
  id: string;
  name: string;
  category: LaunchCategoryId;
  status: LaunchGateStatus;
  severity: "low" | "medium" | "high" | "critical";
  owner: string;
  evidence: string;
  remediation?: string;
  dependency?: string;
  auditHref?: string;
  expandByDefault: boolean;
};

function mapItemStatus(item: { id: string; done: boolean; detail: string }): LaunchGateStatus {
  if (item.done) {
    return item.detail.toLowerCase().includes("warning") ? "warning" : "passed";
  }
  if (item.id === "jobs" || item.id === "integrations" || item.id === "integrity") {
    return item.detail.toLowerCase().includes("warning") ? "warning" : "failed";
  }
  return "failed";
}

function mapSeverity(status: LaunchGateStatus, id: string): LaunchGate["severity"] {
  if (status === "failed" && (id === "jobs" || id === "integrations" || id === "integrity")) {
    return "high";
  }
  if (status === "failed") return "medium";
  if (status === "warning") return "medium";
  return "low";
}

function categoryFor(id: string): LaunchCategoryId {
  switch (id) {
    case "env-demo":
    case "onboarded":
      return "identity";
    case "branding":
      return "property";
    case "integrity":
      return "data";
    case "smoke":
      return "quality";
    case "jobs":
      return "automation";
    case "integrations":
      return "integrations";
    case "performance":
      return "observability";
    default:
      return "observability";
  }
}

function ownerFor(category: LaunchCategoryId) {
  switch (category) {
    case "identity":
      return "Administration";
    case "data":
      return "Platform Operations";
    case "property":
      return "Property Ops";
    case "workforce":
      return "Workforce Ops";
    case "automation":
      return "Platform Operations";
    case "integrations":
      return "Integrations";
    case "quality":
      return "Quality";
    case "observability":
      return "Platform Operations";
  }
}

function remediationFor(id: string, status: LaunchGateStatus) {
  if (status === "passed") return undefined;
  switch (id) {
    case "jobs":
      return "Retry failed jobs";
    case "integrations":
      return "Reconnect errored providers";
    case "integrity":
      return "Repair and backfill";
    case "smoke":
      return "Re-run smoke suite";
    case "onboarded":
      return "Complete onboarding";
    default:
      return "Review control evidence";
  }
}

/** Presentational mapping only — does not alter checklist calculation. */
export function presentLaunchGates(
  checklist: Pick<LaunchChecklist, "items">,
  options?: { ownerFallback?: string }
): LaunchGate[] {
  return checklist.items.map((item) => {
    const status = mapItemStatus(item);
    const category = categoryFor(item.id);
    return {
      id: item.id,
      name: item.title,
      category,
      status,
      severity: mapSeverity(status, item.id),
      owner: options?.ownerFallback ?? ownerFor(category),
      evidence: item.detail,
      remediation: remediationFor(item.id, status),
      dependency:
        item.id === "smoke"
          ? "Requires active properties and templates"
          : item.id === "jobs"
            ? "Depends on background job processor"
            : undefined,
      auditHref: "/settings/audit",
      expandByDefault: status === "failed" || status === "blocked",
    };
  });
}

export function presentCategories(gates: LaunchGate[]) {
  const ids = Object.keys(LAUNCH_CATEGORY_LABELS) as LaunchCategoryId[];
  return ids
    .map((id) => {
      const items = gates.filter((g) => g.category === id);
      if (items.length === 0) return null;
      const failed = items.filter((g) => g.status === "failed" || g.status === "blocked").length;
      const warnings = items.filter((g) => g.status === "warning").length;
      const passed = items.filter((g) => g.status === "passed").length;
      const status: LaunchGateStatus =
        failed > 0 ? "failed" : warnings > 0 ? "warning" : "passed";
      return {
        id,
        label: LAUNCH_CATEGORY_LABELS[id],
        total: items.length,
        failed,
        warnings,
        passed,
        completion: Math.round((passed / items.length) * 100),
        status,
      };
    })
    .filter(Boolean) as Array<{
    id: LaunchCategoryId;
    label: string;
    total: number;
    failed: number;
    warnings: number;
    passed: number;
    completion: number;
    status: LaunchGateStatus;
  }>;
}

export function presentReadinessSummary(checklist: LaunchChecklist) {
  const gates = presentLaunchGates(checklist);
  const blockers = gates.filter((g) => g.status === "failed" || g.status === "blocked").length;
  const warnings = gates.filter((g) => g.status === "warning").length;
  const passing = gates.filter((g) => g.status === "passed").length;
  const score = checklist.score.total
    ? Math.round((checklist.score.done / checklist.score.total) * 100)
    : 0;
  return {
    score,
    blockers,
    warnings,
    passing,
    total: checklist.score.total,
    ready: checklist.ready,
  };
}

export function integrityRows(checks: LaunchCheck[]) {
  return checks.map((c) => ({
    id: c.id,
    issue: c.title,
    entity: c.area,
    severity: c.severity,
    records: c.count ?? 0,
    evidence: c.detail,
    repairable: Boolean(c.repairable),
    status: (c.severity === "fail"
      ? "failed"
      : c.severity === "warn"
        ? "warning"
        : "passed") as LaunchGateStatus,
  }));
}

export function jobRows(snapshot: ObservabilitySnapshot) {
  return snapshot.jobs.recentFailed.map((j) => ({
    id: j.id,
    type: j.type,
    reason: j.error ?? "Unknown error",
    retries: j.attempts,
    age: j.completedAt ? j.completedAt.toISOString() : j.createdAt.toISOString(),
  }));
}

export function formatValidatedAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function smokeAsGates(results: SmokeTestResult[]) {
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    status: (r.ok ? "passed" : "failed") as LaunchGateStatus,
    evidence: r.detail,
    ms: r.ms,
  }));
}
