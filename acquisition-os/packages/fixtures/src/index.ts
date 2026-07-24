/** Deterministic demo dataset for product-frames (Sprint 0 stub). */

export const demoWorkspace = {
  id: "ws_demo",
  name: "Demo HVAC Operations",
  organizationId: "org_demo",
} as const;

export const demoPipelineStages = [
  { key: "inquiries", label: "Inquiries", count: 100 },
  { key: "contacted", label: "Contacted", count: 82 },
  { key: "conversations", label: "Conversations", count: 61 },
  { key: "appointments", label: "Appointments", count: 39 },
  { key: "customers", label: "Customers", count: 22 },
] as const;

export const demoCommandCenterKpis = {
  appointments: 18,
  bookingRate: 0.39,
  responseTimeMinutes: 4.2,
  missedCalls: 11,
} as const;
