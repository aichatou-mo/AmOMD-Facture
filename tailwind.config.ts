import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        night: {
          DEFAULT: "#111522",
          deep: "#0c111d",
          card: "#141a2b",
          elevated: "#191f30",
          glow: "#1b253d",
        },
        gold: {
          DEFAULT: "#ffdc45",
          50: "#fffbe6",
          100: "#fff0a6",
          200: "#ffe879",
          300: "#ffe36a",
          400: "#ffdc45",
          500: "#f8d64e",
          600: "#e0b81c",
          700: "#a18400",
          800: "#453700",
        },
        paper: {
          DEFAULT: "#f8f7f3",
          warm: "#f2f0e8",
          muted: "#edece6",
          line: "#e8e7e2",
        },
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        slate: {
          850: "#141a2b",
          900: "#111522",
          950: "#0c111d",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "'Plus Jakarta Sans'", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(17, 21, 34, 0.04)",
        card: "0 12px 32px -6px rgba(17, 21, 34, 0.06), 0 4px 10px -2px rgba(17, 21, 34, 0.03)",
        glow: "0 10px 30px rgba(255, 220, 69, 0.30)",
        modal: "0 25px 50px -12px rgba(12, 17, 29, 0.35)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
