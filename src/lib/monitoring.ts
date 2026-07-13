import { captureError, log } from "./logger";

export type MonitoringContext = Record<string, string | number | boolean | null | undefined>;

export interface MonitoringAdapter {
  captureException(error: unknown, context?: MonitoringContext): void;
  captureMessage(message: string, level?: "info" | "warn" | "error", context?: MonitoringContext): void;
}

/** Default adapter writes through structured logger only — no external provider. */
class LoggerMonitoringAdapter implements MonitoringAdapter {
  captureException(error: unknown, context?: MonitoringContext) {
    captureError(error, context as Record<string, unknown>);
  }

  captureMessage(
    message: string,
    level: "info" | "warn" | "error" = "info",
    context?: MonitoringContext
  ) {
    log[level](message, context as Record<string, unknown>);
  }
}

let adapter: MonitoringAdapter = new LoggerMonitoringAdapter();

export function getMonitoringAdapter(): MonitoringAdapter {
  return adapter;
}

/** Register an external monitoring adapter (e.g. Sentry) at deploy time. */
export function setMonitoringAdapter(next: MonitoringAdapter) {
  adapter = next;
}

export const monitoring = {
  captureException: (error: unknown, context?: MonitoringContext) =>
    adapter.captureException(error, context),
  captureMessage: (
    message: string,
    level?: "info" | "warn" | "error",
    context?: MonitoringContext
  ) => adapter.captureMessage(message, level, context),
};

/**
 * Errors do NOT reach Sentry or another external provider without an installed adapter
 * and deployment configuration. Reading SENTRY_DSN alone does not constitute integration.
 * External alerting remains an accepted operational risk for Production Foundation v1.
 */
