/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#1e1b4b",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        saffron: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
      },
      fontFamily: {
        sans:  ["Inter", "sans-serif"],
        devan: ["Noto Sans Devanagari", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        glass:  "0 8px 32px rgba(99,102,241,0.12)",
        glow:   "0 0 24px rgba(99,102,241,0.35)",
        card:   "0 4px 24px rgba(0,0,0,0.07)",
        "card-hover": "0 12px 40px rgba(0,0,0,0.13)",
      },
      animation: {
        "blob":        "blob 8s infinite",
        "float":       "float 6s ease-in-out infinite",
        "shimmer":     "shimmer 2s linear infinite",
        "count-up":    "countUp 1s ease-out forwards",
        "slide-in-r":  "slideInRight 0.4s ease-out",
        "fade-up":     "fadeUp 0.5s ease-out",
        "pulse-slow":  "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":   "spin 8s linear infinite",
        "gradient":    "gradientShift 8s ease infinite",
      },
      keyframes: {
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%":     { transform: "translate(30px,-50px) scale(1.1)" },
          "66%":     { transform: "translate(-20px,20px) scale(0.9)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: 0 },
          to:   { transform: "translateX(0)",    opacity: 1 },
        },
        fadeUp: {
          from: { transform: "translateY(16px)", opacity: 0 },
          to:   { transform: "translateY(0)",    opacity: 1 },
        },
        gradientShift: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
      },
      backgroundSize: {
        "300%": "300%",
      },
    },
  },
  plugins: [],
};
