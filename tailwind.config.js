/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        jetbrains: ["JetBrains Mono", "monospace"],
        exo: ["Exo 2", "sans-serif"],
      },
      colors: {
        synth: {
          "bg-deep": "#050810",
          bg: "#080c15",
          surface: "#0d1424",
          panel: "rgba(255,255,255,0.02)",
          border: "rgba(255,255,255,0.06)",
          "border-bright": "rgba(255,255,255,0.12)",
          primary: "#ff6b35",
          "primary-dim": "rgba(255,107,53,0.15)",
          "primary-bg": "rgba(255,107,53,0.06)",
          cyan: "#00f5ff",
          "cyan-dim": "rgba(0,245,255,0.12)",
          green: "#00ff88",
          gold: "#ffd93d",
          red: "#ff2d55",
          muted: "#6b7280",
        },
      },
      boxShadow: {
        "primary-glow": "0 0 20px rgba(255,107,53,0.2)",
        "primary-sm": "0 0 8px rgba(255,107,53,0.15)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease",
        "scale-in": "scaleIn 0.25s ease-out",
        "slide-right": "slideInRight 0.3s ease-out",
        "slide-top": "slideInTop 0.25s ease-out",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        slideInRight: { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        slideInTop: { from: { opacity: "0", transform: "translateY(-10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
    },
  },
  plugins: [],
};
