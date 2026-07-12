import { Badge } from "@/components/ui";
import { parseJson } from "@/lib/json";

type Sow = {
  id: string;
  name: string;
  description: string | null;
  standardScope: string;
  addOnsJson: string;
  slaMinutes: number;
} | null;

export function LinkedSows({ sow }: { sow: Sow }) {
  const addOns = parseJson<string[]>(sow?.addOnsJson, []);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Linked SOW template
      </h2>
      {!sow ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          No SOW template linked. Define scope and SLA in settings before generating turnovers.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{sow.name}</p>
            <Badge tone="info">{sow.slaMinutes}m SLA</Badge>
          </div>
          <p className="text-sm text-[var(--muted)]">{sow.standardScope}</p>
          {addOns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {addOns.map((a) => (
                <Badge key={a} tone="neutral">
                  {a}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
