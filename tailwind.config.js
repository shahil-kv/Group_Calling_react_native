module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary: Trustworthy blue for main UI elements
        primary: "var(--color-primary)",
        // Secondary: Lighter blue for supporting elements
        secondary: "var(--color-secondary)",
        // Accent: Green/cyan for highlights
        tertiary: "var(--color-tertiary)",
        // Accent: Bright color for call-to-action
        accent: "var(--color-accent)",
        // Success: Green for positive feedback
        success: "var(--color-success)",
        // Warning: Orange for cautions
        warning: "var(--color-warning)",
        // Error: Red for critical issues
        error: "var(--color-error)",
        // Info: Blue for informational messages
        info: "var(--color-info)",
        // Neutral: Gray for backgrounds, borders, text
        neutral: "var(--color-neutral)",
        // Background: Main app background
        background: "var(--color-background)",
        // Surface: Content areas, cards
        surface: "var(--color-surface)",
        // Text: Primary text color
        text: {
          primary: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        // Border: For dividers and outlines
        border: {
          primary: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
      },
      fontFamily: {
        sans: ["InterRegular"],
        medium: ["InterMedium"],
        bold: ["InterBold"],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
        'header-gradient': 'linear-gradient(to bottom, var(--color-background), var(--color-surface))',
        'accent-gradient': 'linear-gradient(to right, var(--color-accent), var(--color-success))',
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        ':root': {
          '--color-primary': '#1E3A8A',
          '--color-secondary': '#3B82F6',
          '--color-tertiary': '#FBFBFB',
          '--color-accent': '#10B981',
          '--color-success': '#22C55E',
          '--color-warning': '#F59E0B',
          '--color-error': '#EF4444',
          '--color-info': '#3B82F6',
          '--color-neutral': '#64748B',
          '--color-background': '#F8FAFC',
          '--color-surface': '#FFFFFF',
          '--color-text': '#0F172A',
          '--color-text-secondary': '#64748B',
          '--color-text-tertiary': '#FFFFFF',
          '--color-border': '#E2E8F0',
          '--color-border-subtle': '#F1F5F9',
        },
        '.dark': {
          '--color-primary': '#5bd1e7',
          '--color-secondary': '#dfbeff',
          '--color-tertiary': '#213448',
          '--color-accent': '#22d3ee',
          '--color-success': '#4ade80',
          '--color-warning': '#facc15',
          '--color-error': '#f87171',
          '--color-info': '#3b82f6',
          '--color-neutral': '#4B5563',
          '--color-background': '#1E1E1E',
          '--color-surface': '#333333',
          '--color-text': '#F8FAFC',
          '--color-text-secondary': '#9CA3AF',
          '--color-text-tertiary': '#1E1E1E',
          '--color-border': '#4B5563',
          '--color-border-subtle': '#374151',
        },
      });
    },
  ],
};