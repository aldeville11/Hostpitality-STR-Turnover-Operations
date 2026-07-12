import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-[9px] bg-[var(--accent)] text-white",
        dim,
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-[58%] w-[58%]" fill="none">
        <path
          d="M6 22V10.5c0-.8.5-1.5 1.2-1.8L15 6.2c.6-.2 1.3-.2 1.9 0l7.8 2.5c.8.3 1.3 1 1.3 1.8V22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 22v-5.2c0-.4.3-.8.8-.8h8.4c.4 0 .8.4.8.8V22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M6 22h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function BrandLockup({
  href = "/dashboard",
  inverted,
  compact,
}: {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5">
      <BrandMark size={compact ? "sm" : "md"} />
      <span className="min-w-0">
        <span
          className={cn(
            "block font-[family-name:var(--font-display)] text-[15px] font-semibold leading-none tracking-tight",
            inverted ? "text-white" : "text-[var(--text-primary)]"
          )}
        >
          Hostpitality
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-1 block text-[11px] font-medium leading-none tracking-[0.02em]",
              inverted ? "text-white/65" : "text-[var(--text-secondary)]"
            )}
          >
            Property Operations Platform
          </span>
        ) : null}
      </span>
    </Link>
  );
}
