/** @type {import('tailwindcss').Config} */
const villaPreset = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fffcf8",
          100: "#fef9f0",
          200: "#fdf3e0",
        },
        ink: {
          DEFAULT: "#0d0d17",
          light: "#45454f",
          muted: "#61616b",
        },
        accent: {
          yellow: "#ffe047",
          green: "#698f69",
          brown: "#382207",
        },
        neutral: {
          50: "#f1f1f4",
          100: "#e0e0e6",
          200: "#c4c4cc",
          300: "#a8a8b2",
          400: "#8c8c98",
        },
        error: {
          bg: "#fef0f0",
          border: "#fecaca",
          text: "#dc2626",
        },
        success: {
          bg: "#f0f9f0",
          border: "#d4e8d4",
          text: "#698f69",
        },
        warning: {
          bg: "#fffbeb",
          border: "#ffe047",
          text: "#382207",
        },
        villa: {
          500: "#ffe047",
          600: "#f5d63d",
          700: "#e6c733",
        },
      },
      fontFamily: {
        serif: ["DM Serif Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        villa: "0 4px 14px 0 rgba(0, 0, 0, 0.05)",
        "villa-lg": "0 10px 40px 0 rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-gentle": "pulseGentle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGentle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

module.exports = villaPreset;
