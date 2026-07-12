import Link from "next/link";
import {
  SETTINGS_SECTION_DESCRIPTIONS,
  SETTINGS_SECTION_LABELS,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

export function SettingsNav({ active }: { active?: SettingsSection | "overview" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/settings"
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-medium",
          active === "overview" || !active
            ? "bg-[var(--accent)] text-white"
            : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
        )}
      >
        Overview
      </Link>
      {SETTINGS_SECTIONS.map((section) => (
        <Link
          key={section}
          href={`/settings/${section}`}
          title={SETTINGS_SECTION_DESCRIPTIONS[section]}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium",
            active === section
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
          )}
        >
          {SETTINGS_SECTION_LABELS[section]}
        </Link>
      ))}
    </div>
  );
}
