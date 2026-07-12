import type { OperationalStatus } from "@/components/ui/status";

/** Map domain statuses onto the centralized operational status language. */
export function mapTurnoverStatus(status: string): OperationalStatus {
  switch (status) {
    case "COMPLETED":
      return "complete";
    case "IN_PROGRESS":
    case "ASSIGNED":
      return "running";
    case "READY_FOR_QA":
      return "needs_review";
    case "SCHEDULED":
    case "DRAFT":
      return "pending";
    case "BLOCKED":
      return "blocked";
    case "OVERDUE":
    case "NEEDS_REWORK":
      return "at_risk";
    case "CANCELLED":
      return "failed";
    default:
      return "pending";
  }
}

export function mapIssueStatus(status: string): OperationalStatus {
  switch (status) {
    case "OPEN":
    case "TRIAGED":
      return "pending";
    case "ASSIGNED":
      return "assigned";
    case "RESOLVED":
    case "VERIFIED":
    case "CLOSED":
      return "complete";
    case "ESCALATED":
      return "at_risk";
    default:
      return "pending";
  }
}

export function mapIssueSeverity(severity: string): OperationalStatus {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "failed";
    case "MEDIUM":
      return "warning";
    default:
      return "healthy";
  }
}

export function mapQaStatus(status: string): OperationalStatus {
  switch (status) {
    case "APPROVED":
      return "passed";
    case "REJECTED":
      return "rejected";
    case "NEEDS_REWORK":
      return "needs_review";
    case "PENDING":
    default:
      return "pending";
  }
}

export function mapAvailability(status: string): OperationalStatus {
  switch (status) {
    case "AVAILABLE":
      return "healthy";
    case "UNAVAILABLE":
      return "at_risk";
    case "OUT_OF_SERVICE":
      return "failed";
    default:
      return "pending";
  }
}

export function mapActive(active: boolean): OperationalStatus {
  return active ? "healthy" : "disconnected";
}

export function mapReadiness(label: string): OperationalStatus {
  if (label === "Ready") return "healthy";
  if (label === "Almost ready") return "warning";
  return "at_risk";
}

export function mapInventoryStock(quantity: number, reorderLevel: number): OperationalStatus {
  if (quantity <= 0) return "failed";
  if (quantity <= reorderLevel) return "warning";
  return "healthy";
}
