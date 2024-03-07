import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components,utils}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        heartbeat: {
          "0%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.3)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.3)" },
          "70%": { transform: "scale(1)" },
        },
      },
      animation: {
        heartbeat: "heartbeat 1.3s ease-in-out 1",
      },
    },
  },
} satisfies Config;
