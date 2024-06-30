/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.css"], // Adjust paths based on your actual directory structure
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "Arial", "sans-serif"], // Replace 'Nunito' with the name of your imported font
      },
    },
  },
  plugins: [], // Optional: Add Tailwind plugins
};
