export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Base dark background family, sampled from the logo's navy backdrop (#252f48)
        navy: {
          950: "#0a0d16",
          900: "#12172a",
          850: "#171d33",
          800: "#1c2338",
          700: "#232f48", // exact logo background
          600: "#2c3555",
          500: "#3a4468",
          400: "#4d5569",
        },
        // Primary brand accent, sampled from the logo's Sigma purple (#5b54a4)
        brand: {
          50: "#f4f3fa",
          100: "#e8e6f4",
          200: "#c8c3e6",
          300: "#a79fd3",
          400: "#8478bb",
          500: "#5b54a4", // exact logo purple
          600: "#4a4488",
          700: "#3a3570",
          800: "#2b2755",
          900: "#1d1a3d",
          950: "#141230",
        },
      },
    },
  },
  plugins: [],
}