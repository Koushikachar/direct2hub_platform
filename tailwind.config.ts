import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brick: {
          950: "rgb(var(--brick-950) / <alpha-value>)",
          900: "rgb(var(--brick-900) / <alpha-value>)",
          800: "rgb(var(--brick-800) / <alpha-value>)",
          700: "rgb(var(--brick-700) / <alpha-value>)",
        },
        ember: {
          600: "#C1440E",
          500: "#D9531A",
          400: "#FF7A45",
        },
        cream: "#FBF6F1",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
