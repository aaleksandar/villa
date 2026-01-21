/* eslint-disable @typescript-eslint/no-var-requires */
import type { Config } from "tailwindcss";

const villaPreset = require("@villa/config/tailwind.preset");

const config: Config = {
  presets: [villaPreset],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
