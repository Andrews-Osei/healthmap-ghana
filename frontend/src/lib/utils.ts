import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  int:     (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n)),
  float1:  (n: number) => new Intl.NumberFormat("en-US",
    { maximumFractionDigits: 1 }).format(n),
  pct:     (n: number) => `${new Intl.NumberFormat("en-US",
    { maximumFractionDigits: 1 }).format(n)}%`,
};

export const tierColor: Record<string, string> = {
  "Critical Risk":  "#ef4444",
  "High Risk":      "#f59e0b",
  "Moderate Risk":  "#eab308",
  "Low Risk":       "#10b981",
  "No Data Yet":    "#64748b",
};

export function cviColor(cvi: number | null | undefined) {
  if (cvi == null || Number.isNaN(cvi)) return "#1f2a44";  // slate-grey
  if (cvi >= 80) return "#dc2626";
  if (cvi >= 60) return "#f97316";
  if (cvi >= 40) return "#eab308";
  if (cvi >= 20) return "#84cc16";
  return "#10b981";
}
