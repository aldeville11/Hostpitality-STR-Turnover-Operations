import { color, space } from "@acquisition-os/design-tokens";
import { CommandCenterFrame } from "@acquisition-os/product-frames";
import { Button } from "@acquisition-os/ui";

/**
 * Sprint 0 shell only — auth and tenancy land in Sprint 1–3.
 * Owner: Frontend Lead · Reviewer: Design Reviewer + Platform Engineer
 */
export function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.bgApp,
        color: color.fgPrimary,
        padding: space[6],
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space[6] }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: color.accent }}>
            Acquisition OS
          </p>
          <h1 style={{ margin: `${space[2]}px 0 0`, fontSize: 24, fontWeight: 600 }}>Command Center</h1>
        </div>
        <Button type="button" disabled title="Auth ships in Sprint 1">
          Sign in
        </Button>
      </header>
      <CommandCenterFrame />
    </div>
  );
}
