import { Badge } from "@/components/ui";
import { parseJson } from "@/lib/json";

type Sop = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  contentJson: string;
} | null;

export function LinkedSops({ sop }: { sop: Sop }) {
  const steps = parseJson<{ section?: string; title: string }[]>(sop?.contentJson, []);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Linked SOP</h2>
      {!sop ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          No SOP linked. Attach a playbook in settings so cleaners know the room-by-room process.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{sop.name}</p>
            <Badge>v{sop.version}</Badge>
          </div>
          {sop.description ? (
            <p className="text-sm text-[var(--muted)]">{sop.description}</p>
          ) : null}
          {steps.length > 0 ? (
            <ul className="space-y-1 text-sm text-[var(--muted)]">
              {steps.slice(0, 6).map((step, idx) => (
                <li key={`${step.title}-${idx}`}>
                  {step.section ? `${step.section}: ` : ""}
                  {step.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">SOP has no checklist steps yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
