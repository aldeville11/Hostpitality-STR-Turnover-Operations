/** Design tokens — Phase 3 binding (Sprint 0 stub). */

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 40,
  8: 48,
  9: 64,
  10: 80,
  11: 96,
  12: 128,
} as const;

export const color = {
  bgApp: "#0A0A0A",
  bgElevated: "#0E0E0E",
  fgPrimary: "#F5F0E8",
  fgSecondary: "#A8A29E",
  fgMuted: "#6B6560",
  borderSubtle: "#1C1C1C",
  borderDefault: "#262626",
  accent: "#C9A962",
  success: "#047857",
  warning: "#B45309",
  danger: "#B91C1C",
  info: "#0369A1",
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;

export const motion = {
  hoverMs: 120,
  enterMs: 180,
  numberMs: 500,
} as const;
