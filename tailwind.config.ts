import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components,utils}/**/*.{ts,tsx}",
  ],
} satisfies Config;
