/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safety: {
          dark: "#0b0f19",
          card: "rgba(17, 24, 39, 0.7)",
          cardBorder: "rgba(244, 63, 94, 0.15)",
          accent: "#f43f5e",
          accentHover: "#e11d48",
          glow: "rgba(244, 63, 94, 0.4)",
          textMuted: "#9ca3af",
          textLight: "#f3f4f6",
        },
        brand: {
          blue: "#0ea5e9",
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444"
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out'
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(244, 63, 94, 0.2), 0 0 10px rgba(244, 63, 94, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(244, 63, 94, 0.6), 0 0 30px rgba(244, 63, 94, 0.4)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
