/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#000000', // Absolute Pitch Black
          800: '#080808', // Void
          700: '#111111', // Deep Contrast
          600: '#1A1A1A', // Border
          500: '#333333', 
          400: '#888888', // Muted Text
          300: '#EEEEEE', // High Contrast Text
        },
        agency: {
          nasa: '#00FFFF', // Neon Cyan
          spacex: '#FF00FF', // Neon Magenta
          isro: '#8A2BE2', // Electric Purple
          other: '#39FF14', // Neon Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
