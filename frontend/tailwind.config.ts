import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Design tokens
        ink:    { 950: "#04101e", 900: "#071a2c", 800: "#0b2237", 700: "#102b46" },
        cyan:   { 400: "#22d3ee", 500: "#06b6d4", 300: "#67e8f9" },
        med:    { // healthcare green
                  300: "#7ce3c9", 400: "#34d399", 500: "#10b981", 600: "#059669" },
        accent: { 400: "#3ea7ff", 500: "#1e88f5" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system",
               "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(180deg, transparent 0%, rgba(4,16,30,0.9) 100%), " +
          "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), " +
          "linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(34,211,238,0.18) 0%, transparent 60%)",
      },
      backgroundSize: { "grid-fade": "auto, 32px 32px, 32px 32px" },
      boxShadow: {
        glass:  "0 8px 30px rgba(2,12,24,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
        glow:   "0 0 0 1px rgba(34,211,238,0.4), 0 12px 36px rgba(34,211,238,0.2)",
      },
      keyframes: {
        floaty:    { "0%,100%": { transform: "translateY(0)" },
                     "50%":     { transform: "translateY(-6px)" } },
        pulseRing: { "0%":   { transform: "scale(.9)", opacity: ".7" },
                     "70%":  { transform: "scale(1.6)", opacity: "0" },
                     "100%": { opacity: "0" } },
        shimmer:   { "0%":   { backgroundPosition: "-200% 0" },
                     "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        floaty:    "floaty 5s ease-in-out infinite",
        pulseRing: "pulseRing 2.4s ease-out infinite",
        shimmer:   "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
