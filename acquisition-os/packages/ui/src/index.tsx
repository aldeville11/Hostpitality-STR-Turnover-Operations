import type { ButtonHTMLAttributes, ReactNode } from "react";
import { color, radius } from "@acquisition-os/design-tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

/** Primary product CTA control — layouts per UI Spec only. */
export function Button({ variant = "primary", children, style, ...rest }: ButtonProps) {
  const background =
    variant === "primary" ? color.accent : variant === "secondary" ? "transparent" : "transparent";
  const foreground = variant === "primary" ? color.bgApp : color.fgPrimary;
  const border = variant === "primary" ? color.accent : color.borderDefault;

  return (
    <button
      type="button"
      {...rest}
      style={{
        minHeight: 36,
        padding: "0 16px",
        borderRadius: radius.md,
        border: `1px solid ${border}`,
        background,
        color: foreground,
        fontWeight: 600,
        fontSize: 14,
        cursor: rest.disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export { color, radius };
