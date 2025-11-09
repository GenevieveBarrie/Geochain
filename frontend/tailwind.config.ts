import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2B8ED6",
        accent: "#FFC857",
        bg: "#FBFBFD"
      }
    },
  },
  plugins: [],
} satisfies Config;



