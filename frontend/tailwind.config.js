/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050811',
          workspace: '#090e1a',
          panel: '#0e1626',
          surface: '#131d31',
          border: '#1e293b',
          borderLight: '#334155',
          accent: '#06b6d4',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
        },
        brand: {
          50: '#ecfeff',
          100: '#cffaff',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63',
          950: '#083344',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 100%)',
        'cyber-card-glow': 'radial-gradient(circle at top right, rgba(6,182,212,0.08), transparent 70%)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.8))' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
