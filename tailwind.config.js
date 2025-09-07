/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          100: "#e8f5f0",
          200: "#c7e6d7",
          300: "#a5d7be",
          400: "#62b98c",
          500: "#18573f",
          600: "#164e38",
          700: "#124230",
          800: "#0e3528",
          900: "#0b2b20",
        },
        secondary: {
          100: "#fefcf5",
          200: "#fdf7e1",
          300: "#fcf2cd",
          400: "#f9e8a5",
          500: "#f7e8ab",
          600: "#c5ba89",
          700: "#948b67",
          800: "#625c44",
          900: "#312e22",
        },
      },
    },
  },
  plugins: [],
};
