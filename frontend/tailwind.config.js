/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Gemini's actual dark palette
        surface: {
          DEFAULT: "#131314",
          1: "#1e1f20",
          2: "#282a2c",
          3: "#303133",
        },
        gem: {
          blue:   "#00B98E",
          purple: "#00d4a4",
          teal:   "#00B98E",
          accent: "#00916f",
        },
        text: {
          primary:   "#e3e3e3",
          secondary: "#9aa0a6",
          disabled:  "#5f6368",
        },
        border: "#3c4043",
      },
      fontFamily: {
        sans: ["Google Sans", "Roboto", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Google Sans Mono", "Roboto Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "gem-spin": "gem-spin 2s linear infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
      keyframes: {
        "gem-spin": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%":      { opacity: "1",   transform: "scale(1.2)" },
        },
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
