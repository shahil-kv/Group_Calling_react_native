/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",
        secondary: "#3B82F6",
        accent: "#10B981",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        dark: "#0F172A",
      },
      fontFamily: {
        sans: ["InterRegular"],
        medium: ["InterMedium"],
        bold: ["InterBold"],
      },
    },
  },
  plugins: [],
};
