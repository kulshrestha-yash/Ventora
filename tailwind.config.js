/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: "#4F46E5", hover: "#4338CA", soft: "#EEF2FF", softHover: "#E0E7FF" },
        ink:      { DEFAULT: "#111827", secondary: "#374151", muted: "#6B7280", faint: "#9CA3AF" },
        surface:  { DEFAULT: "#FFFFFF", subtle: "#F9FAFB", raised: "#FFFFFF" },
        line:     { DEFAULT: "#E5E7EB", strong: "#D1D5DB" },
        success:  { DEFAULT: "#059669", soft: "#ECFDF5" },
        warning:  { DEFAULT: "#D97706", soft: "#FFFBEB" },
        danger:   { DEFAULT: "#DC2626", soft: "#FEF2F2" },
        violet:   { DEFAULT: "#7C3AED", soft: "#F5F3FF" }
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
