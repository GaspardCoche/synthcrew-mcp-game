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
          bg: "#06070c",
          panel: "rgba(255,255,255,0.02)",
          border: "rgba(255,255,255,0.06)",
          cyan: "#00f0ff",
          purple: "#a855f7",
          green: "#22c55e",
          amber: "#f59e0b",
          gold: "#eab308",
          red: "#ef4444",
          pink: "#ec4899",
          lime: "#84cc16",
        },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease",
        "scale-in": "scaleIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};
