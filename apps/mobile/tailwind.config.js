module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Match web app colors for consistency
        primary: "#0ea5e9",
        secondary: "#64748b",
        background: "#ffffff",
        foreground: "#0f172a"
      }
    }
  },
  plugins: []
};