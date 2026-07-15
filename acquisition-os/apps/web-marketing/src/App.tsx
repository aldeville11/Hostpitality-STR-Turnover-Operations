import { color, space } from "@acquisition-os/design-tokens";
import { CommandCenterFrame } from "@acquisition-os/product-frames";
import { Button } from "@acquisition-os/ui";

/**
 * Public front door — Sprint 0 scaffold.
 * Must use product-frames (Constitution). Full IA in Sprint 16.
 * Owner: Frontend Lead · Reviewer: Design Reviewer
 */
export function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.bgApp,
        color: color.fgPrimary,
        padding: `${space[8]}px ${space[5]}px`,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: color.accent }}>
          Customer Acquisition OS
        </p>
        <h1 style={{ margin: `${space[4]}px 0 0`, fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", maxWidth: 640 }}>
          More booked appointments from the demand you already have.
        </h1>
        <p style={{ marginTop: space[4], color: color.fgSecondary, maxWidth: 520, lineHeight: 1.55 }}>
          Vinton Adler &amp; Co. builds the operating system that converts demand into booked appointments.
        </p>
        <div style={{ marginTop: space[5] }}>
          <Button type="button">Request a demo</Button>
        </div>
        <div style={{ marginTop: space[8] }}>
          <CommandCenterFrame />
        </div>
      </div>
    </div>
  );
}
