import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        },
        brand: {
          navy: "#0F2347",
          "navy-light": "#1B3A6B",
          gold: "#C6A15B",
          "gold-light": "#E4C888",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "soft-sm": "0 1px 2px rgba(0,0,0,.24), 0 1px 1px rgba(0,0,0,.12)",
        "soft-md": "0 4px 16px -4px rgba(0,0,0,.35), 0 2px 6px -2px rgba(0,0,0,.25)",
        "soft-lg": "0 12px 32px -8px rgba(0,0,0,.45), 0 4px 12px -4px rgba(0,0,0,.3)",
        "soft-xl": "0 24px 60px -12px rgba(0,0,0,.55), 0 8px 24px -8px rgba(0,0,0,.35)",
        "3d": "0 1px 0 rgba(255,255,255,.06) inset, 0 -1px 0 rgba(0,0,0,.3) inset, 0 14px 34px -10px rgba(0,0,0,.5)",
        "3d-hover": "0 1px 0 rgba(255,255,255,.09) inset, 0 -1px 0 rgba(0,0,0,.3) inset, 0 22px 46px -12px rgba(0,0,0,.6)",
        "glow-gold": "0 0 0 1px rgba(198,161,91,.35), 0 8px 30px -6px rgba(198,161,91,.45)",
        "glow-blue": "0 0 0 1px rgba(88,150,255,.35), 0 8px 30px -6px rgba(88,150,255,.4)",
        "glow-green": "0 0 0 1px rgba(52,211,153,.3), 0 8px 26px -6px rgba(52,211,153,.35)",
        "glow-red": "0 0 0 1px rgba(248,113,113,.3), 0 8px 26px -6px rgba(248,113,113,.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".45" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in .4s ease-out",
        "scale-in": "scale-in .2s ease-out",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
