/* eslint-disable @typescript-eslint/no-var-requires */
import type { Config } from "tailwindcss";

const villaPreset = require("@villa/config/tailwind.preset");

const config: Config = {
  presets: [villaPreset],
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
