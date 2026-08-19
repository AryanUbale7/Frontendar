import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FFD60A",
          foreground: "#0F172A",
        },
        accent: {
          DEFAULT: "#FFD60A",
          foreground: "#0F172A",
        },
        magenta: {
          DEFAULT: "#0F172A",
          foreground: "#FFFFFF",
        },
        yellow: {
          DEFAULT: "#FFD60A",
          foreground: "#0F172A",
        },
        background: "#F8FAFC",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        heading: "#0F172A",
        body: "#475569",
        border: "#E2E8F0",
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#FFD60A",
          foreground: "#0F172A",
        },
        error: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        default: "16px",
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      fontFamily: {
        heading: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        code: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0F172A, #FFD60A)",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.03)",
        elevated: "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
