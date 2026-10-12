/** @type {import('tailwindcss').Config} */
// Tailwind CSS configuration
// How it works:
// 1. "content" tells Tailwind to scan our JSX and HTML files for utility classes.
// 2. "extend" defines custom color names (like primary, ink, surface) so we can write
//    classes like 'bg-primary', 'text-ink', 'border-line' instead of hardcoding hex codes.

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (Indigo theme)
        primary: { DEFAULT: "#4F46E5", hover: "#4338CA", soft: "#EEF2FF", softHover: "#E0E7FF" },
        // Text colors (Dark charcoal to muted gray)
        ink: { DEFAULT: "#111827", secondary: "#374151", muted: "#6B7280", faint: "#9CA3AF" },
        // Background colors (White to soft off-white)
        surface: { DEFAULT: "#FFFFFF", subtle: "#F9FAFB", raised: "#FFFFFF" },
        // Border colors
        line: { DEFAULT: "#E5E7EB", strong: "#D1D5DB" },
        // Status indicator colors
        success: { DEFAULT: "#059669", soft: "#ECFDF5" },
        warning: { DEFAULT: "#D97706", soft: "#FFFBEB" },
        danger: { DEFAULT: "#DC2626", soft: "#FEF2F2" },
        violet: { DEFAULT: "#7C3AED", soft: "#F5F3FF" }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)",
        pop: "0 12px 32px rgba(16,24,40,.16)"
      }
    },
  },
  plugins: [],
};
