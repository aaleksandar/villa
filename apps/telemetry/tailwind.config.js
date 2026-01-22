/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FFFDF8",
          50: "#FFFEF9",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
        },
        accent: {
          yellow: "#FFD700",
        },
      },
    },
  },
  plugins: [],
};
