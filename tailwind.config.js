module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary: Updated to match StatusCard primary color (#4F46E5 - indigo)
        primary: "var(--color-primary)",
        // Secondary: Updated to match StatusCard secondary color (#8B5CF6 - purple)
        secondary: "var(--color-secondary)",
        // Tertiary: Light neutral for contrast with dark colors
        tertiary: "var(--color-tertiary)",
        // Accent: Updated to match StatusCard accent color (#EC4899 - pink)
        accent: "var(--color-accent)",
        // Success: Matches StatusCard success (#22C55E - green)
        success: "var(--color-success)",
        // Warning: Matches StatusCard warning (#F59E0B - amber)
        warning: "var(--color-warning)",
        // Error: Matches StatusCard error (#EF4444 - red)
        error: "var(--color-error)",
        // Info: Matches StatusCard info (#3B82F6 - blue)
        info: "var(--color-info)",
        // Neutral: Complementary gray scale
        neutral: "var(--color-neutral)",
        // Background: Updated to subtle cool gray for contrast with vibrant elements
        background: "var(--color-background)",
        // Surface: Card and content backgrounds
        surface: "var(--color-surface)",
        // Text colors
        text: {
          primary: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        // Border colors
        border: {
          primary: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
        // StatusCard gradient presets
        statuscard: {
          primary: ['var(--statuscard-primary-1)', 'var(--statuscard-primary-2)', 'var(--statuscard-primary-3)', 'var(--statuscard-primary-4)'],
          secondary: ['var(--statuscard-secondary-1)', 'var(--statuscard-secondary-2)'],
          success: ['var(--statuscard-success-1)', 'var(--statuscard-success-2)'],
          warning: ['var(--statuscard-warning-1)', 'var(--statuscard-warning-2)'],
          error: ['var(--statuscard-error-1)', 'var(--statuscard-error-2)'],
          info: ['var(--statuscard-info-1)', 'var(--statuscard-info-2)'],
        }
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
        'status-card-gradient': 'linear-gradient(45deg, var(--statuscard-primary-1), var(--statuscard-primary-2), var(--statuscard-primary-3), var(--statuscard-primary-4))',
        'button-gradient': 'linear-gradient(to right, var(--statuscard-primary-1), var(--statuscard-primary-3))',
        'tab-gradient': 'linear-gradient(to bottom, var(--statuscard-primary-2), var(--statuscard-primary-4))',
      },
      boxShadow: {
        'glow-primary': '0 0 15px var(--color-primary-glow)',
        'glow-secondary': '0 0 15px var(--color-secondary-glow)',
        'glow-accent': '0 0 15px var(--color-accent-glow)',
      }
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        ':root': {
          // Core theme colors aligned with StatusCard gradients
          '--color-primary': '#4F46E5',          // Indigo 600 - from StatusCard primary
          '--color-secondary': '#8B5CF6',        // Violet 500 - from StatusCard primary
          '--color-tertiary': '#F5F7FA',         // Light cool gray for contrast
          '--color-accent': '#EC4899',           // Pink 500 - from StatusCard primary
          '--color-success': '#22C55E',          // Green 500 - from StatusCard success
          '--color-warning': '#F59E0B',          // Amber 500 - from StatusCard warning
          '--color-error': '#EF4444',            // Red 500 - from StatusCard error
          '--color-info': '#3B82F6',             // Blue 500 - from StatusCard primary/info
          '--color-neutral': '#64748B',          // Slate 500
          '--color-background': '#F1F5F9',       // Slate 100
          '--color-surface': '#FFFFFF',          // White
          '--color-text': '#0F172A',             // Slate 900
          '--color-text-secondary': '#475569',   // Slate 600
          '--color-text-tertiary': '#FFFFFF',    // White
          '--color-border': '#CBD5E1',           // Slate 300
          '--color-border-subtle': '#E2E8F0',    // Slate 200

          // Glow effect colors
          '--color-primary-glow': 'rgba(79, 70, 229, 0.4)',
          '--color-secondary-glow': 'rgba(139, 92, 246, 0.4)',
          '--color-accent-glow': 'rgba(236, 72, 153, 0.4)',

          // StatusCard gradient colors (original values)
          '--statuscard-primary-1': '#4F46E5',   // Indigo 600
          '--statuscard-primary-2': '#8B5CF6',   // Violet 500
          '--statuscard-primary-3': '#EC4899',   // Pink 500
          '--statuscard-primary-4': '#3B82F6',   // Blue 500
          '--statuscard-secondary-1': '#8B5CF6', // Violet 500
          '--statuscard-secondary-2': '#3B82F6', // Blue 500
          '--statuscard-success-1': '#22C55E',   // Green 500
          '--statuscard-success-2': '#10B981',   // Emerald 500
          '--statuscard-warning-1': '#F59E0B',   // Amber 500
          '--statuscard-warning-2': '#FB923C',   // Orange 400
          '--statuscard-error-1': '#EF4444',     // Red 500
          '--statuscard-error-2': '#FB7185',     // Rose 400
          '--statuscard-info-1': '#3B82F6',      // Blue 500
          '--statuscard-info-2': '#60A5FA',      // Blue 400
        },
        '.dark': {
          // Dark mode colors with StatusCard-inspired palette
          '--color-primary': '#818CF8',          // Indigo 400
          '--color-secondary': '#A78BFA',        // Violet 400
          '--color-tertiary': '#1E293B',         // Slate 800
          '--color-accent': '#F472B6',           // Pink 400
          '--color-success': '#4ADE80',          // Green 400
          '--color-warning': '#FBBF24',          // Amber 400
          '--color-error': '#F87171',            // Red 400
          '--color-info': '#60A5FA',             // Blue 400
          '--color-neutral': '#94A3B8',          // Slate 400
          '--color-background': '#0F172A',       // Slate 900
          '--color-surface': '#1E293B',          // Slate 800
          '--color-text': '#F8FAFC',             // Slate 50
          '--color-text-secondary': '#CBD5E1',   // Slate 300
          '--color-text-tertiary': '#F8FAFC',    // Slate 50
          '--color-border': '#475569',           // Slate 600
          '--color-border-subtle': '#334155',    // Slate 700

          // Glow effect colors (dark mode)
          '--color-primary-glow': 'rgba(129, 140, 248, 0.6)',
          '--color-secondary-glow': 'rgba(167, 139, 250, 0.6)',
          '--color-accent-glow': 'rgba(244, 114, 182, 0.6)',

          // StatusCard gradient colors (dark mode)
          '--statuscard-primary-1': '#6366F1',   // Indigo 500
          '--statuscard-primary-2': '#A78BFA',   // Violet 400
          '--statuscard-primary-3': '#F472B6',   // Pink 400
          '--statuscard-primary-4': '#60A5FA',   // Blue 400
          '--statuscard-secondary-1': '#A78BFA', // Violet 400
          '--statuscard-secondary-2': '#60A5FA', // Blue 400
          '--statuscard-success-1': '#4ADE80',   // Green 400
          '--statuscard-success-2': '#34D399',   // Emerald 400
          '--statuscard-warning-1': '#FBBF24',   // Amber 400
          '--statuscard-warning-2': '#FB923C',   // Orange 400
          '--statuscard-error-1': '#F87171',     // Red 400
          '--statuscard-error-2': '#FB7185',     // Rose 400
          '--statuscard-info-1': '#60A5FA',      // Blue 400
          '--statuscard-info-2': '#93C5FD',      // Blue 300
        },
      });
    },
  ],
};