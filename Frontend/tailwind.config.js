/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color, #d4af37)',
          hover: 'var(--primary-hover-color, #c4a030)',
          light: 'var(--primary-light-color, #f5e6b8)',
        },
        secondary: 'var(--secondary-color, #1a1a2e)',
        accent: '#e94560',
        background: 'var(--background-color, #050505)',
        surface: {
          DEFAULT: 'var(--surface-color, #0b0b0b)',
          hover: 'var(--surface-hover-color, #141414)',
        },
        border: 'var(--border-color, rgba(212, 175, 55, 0.12))',
        text: {
          DEFAULT: '#ffffff',
          muted: '#a1a1aa',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
