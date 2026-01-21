import type { Config } from "tailwindcss";

const villaPreset = require("@villa/config/tailwind.preset");

const config: Config = {
  presets: [villaPreset],
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
