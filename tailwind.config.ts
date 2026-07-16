import type { Config } from "tailwindcss";
import { tailwindPreset } from "./lib/designTokens";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [tailwindPreset],
};
export default config;
