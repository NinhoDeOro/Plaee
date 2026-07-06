import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        field: {
          950: "#090b10",
          900: "#10131b",
          850: "#171b25",
          800: "#202635",
          700: "#303849"
        },
        pulse: {
          400: "#39ffae",
          500: "#18df92",
          600: "#08b976"
        },
        flare: {
          400: "#ffcb5c",
          500: "#ffab35"
        },
        court: {
          400: "#47c5ff",
          500: "#1898d8"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(57, 255, 174, 0.2), 0 18px 60px rgba(0, 0, 0, 0.38)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        },
        softPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" }
        }
      },
      animation: {
        shimmer: "shimmer 1.65s infinite",
        softPulse: "softPulse 1.7s ease-in-out infinite"
      }
    }
  },
  plugins: [forms]
};

export default config;
