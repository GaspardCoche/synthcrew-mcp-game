/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        jetbrains: ["JetBrains Mono", "monospace"],
      },
      colors: {
        synth: {
          bg: "#080a10",
          "bg-deep": "#05060a",
          surface: "#0c0e16",
          panel: "rgba(255,255,255,0.02)",
          border: "rgba(255,255,255,0.06)",
          "border-bright": "rgba(255,255,255,0.12)",
          copper: "#c9a227",
          "copper-dim": "rgba(201,162,39,0.15)",
          "copper-bg": "rgba(201,162,39,0.06)",
          cyan: "#00e5cc",
          "cyan-dim": "rgba(0,229,204,0.12)",
          purple: "#a855f7",
          "purple-dim": "rgba(168,85,247,0.12)",
          green: "#22c55e",
          amber: "#f59e0b",
          gold: "#eab308",
          red: "#ef4444",
          pink: "#ec4899",
          lime: "#84cc16",
          quest: "#d4a574",
          "quest-dim": "rgba(212,165,116,0.1)",
          "quest-border": "rgba(212,165,116,0.2)",
          lore: "#8b9dc3",
        },
      },
      boxShadow: {
        "copper-glow": "0 0 20px rgba(201,162,39,0.2)",
        "copper-sm": "0 0 8px rgba(201,162,39,0.15)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease",
        "scale-in": "scaleIn 0.25s ease-out",
        "slide-right": "slideInRight 0.3s ease-out",
        "slide-top": "slideInTop 0.25s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        slideInRight: { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        slideInTop: { from: { opacity: "0", transform: "translateY(-10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0,240,255,0.15)" },
          "50%": { boxShadow: "0 0 20px rgba(0,240,255,0.35)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
    },
  },
  plugins: [],
};
