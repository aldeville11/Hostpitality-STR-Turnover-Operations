import { color, space } from "@acquisition-os/design-tokens";
import { demoCommandCenterKpis, demoWorkspace } from "@acquisition-os/fixtures";

/** Sprint 0 shell — full Command Center lands in Sprint 11 per Execution Plan. */
export function CommandCenterFrame() {
  const k = demoCommandCenterKpis;
  return (
    <section
      aria-label="Command Center"
      style={{
        background: color.bgElevated,
        border: `1px solid ${color.borderSubtle}`,
        borderRadius: 8,
        padding: space[5],
        color: color.fgPrimary,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: color.accent }}>
        Command Center
      </p>
      <h2 style={{ margin: `${space[2]}px 0 0`, fontSize: 20, fontWeight: 600 }}>{demoWorkspace.name}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: space[4],
          marginTop: space[5],
        }}
      >
        <Kpi label="Appointments" value={String(k.appointments)} />
        <Kpi label="Booking Rate" value={`${Math.round(k.bookingRate * 100)}%`} />
        <Kpi label="Response Time" value={`${k.responseTimeMinutes} min`} />
        <Kpi label="Missed Calls" value={String(k.missedCalls)} />
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: color.fgMuted }}>
        {label}
      </p>
      <p style={{ margin: `${space[2]}px 0 0`, fontSize: 28, fontWeight: 600, color: color.fgPrimary }}>{value}</p>
    </div>
  );
}

export function PipelineFrame() {
  return (
    <section
      aria-label="Pipeline"
      style={{
        background: color.bgElevated,
        border: `1px solid ${color.borderSubtle}`,
        borderRadius: 8,
        padding: space[5],
        color: color.fgSecondary,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: color.accent }}>
        Pipeline
      </p>
      <p style={{ marginTop: space[3], marginBottom: 0 }}>Frame stub — full Pipeline module ships on P0 critical path.</p>
    </section>
  );
}
