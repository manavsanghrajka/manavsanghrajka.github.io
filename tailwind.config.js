/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "IBM Plex Mono", "Space Mono", "monospace"],
      },
      colors: {
        canvas: "#E0E0E0",
        ink: "#111111",
        structure: "#BBBBBB",
        highlight: "#444444",
        invert: "#FFFFFF",
      },
      letterSpacing: {
        terminal: "0.05em",
      },
    },
  },
  plugins: [],
}
