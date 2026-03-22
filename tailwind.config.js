/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0a0a0a",
        surface: "#111111",
        border:  "#1f1f1f",
        primary: "#dc2626",
        "primary-hover": "#b91c1c",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      animation: {
        shake:    "shake 0.4s ease-in-out",
        "fade-in":  "fadeIn 0.2s ease",
        "slide-up": "slideUp 0.25s ease",
      },
      keyframes: {
        shake:   { "0%,100%":{transform:"translateX(0)"},"20%":{transform:"translateX(-8px)"},"40%":{transform:"translateX(8px)"},"60%":{transform:"translateX(-5px)"},"80%":{transform:"translateX(5px)"} },
        fadeIn:  { from:{opacity:"0"}, to:{opacity:"1"} },
        slideUp: { from:{opacity:"0",transform:"translateY(12px)"}, to:{opacity:"1",transform:"translateY(0)"} },
      },
    },
  },
  plugins: [],
};
