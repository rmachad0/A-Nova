import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080808',
        surface: '#0f0f0f',
        'surface-2': '#161616',
        'surface-3': '#1e1e1e',
        border: '#242424',
        neon: '#39FF14',
        'neon-dim': '#2ACC0F',
        'neon-soft': 'rgba(57,255,20,0.1)',
        danger: '#FF3B3B',
        warning: '#FFB800',
        info: '#00D4FF',
        success: '#39FF14',
        muted: '#444444',
        'text-primary': '#FFFFFF',
        'text-secondary': '#888888',
        'text-tertiary': '#555555',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 12px rgba(57,255,20,0.35), 0 0 24px rgba(57,255,20,0.12)',
        'neon-sm': '0 0 6px rgba(57,255,20,0.25)',
        'neon-lg': '0 0 24px rgba(57,255,20,0.5), 0 0 60px rgba(57,255,20,0.18)',
        'neon-xl': '0 0 40px rgba(57,255,20,0.6), 0 0 80px rgba(57,255,20,0.25)',
        danger: '0 0 12px rgba(255,59,59,0.3)',
        warning: '0 0 12px rgba(255,184,0,0.3)',
        info: '0 0 12px rgba(0,212,255,0.3)',
        card: '0 1px 3px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.5)',
        float: '0 20px 60px rgba(0,0,0,0.6)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #39FF14 0%, #00D4FF 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0f0f0f 0%, #111111 100%)',
        'gradient-surface': 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'gradient-neon-subtle': 'linear-gradient(135deg, rgba(57,255,20,0.08) 0%, rgba(0,212,255,0.04) 100%)',
        'grid-neon': "linear-gradient(rgba(57,255,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.03) 1px, transparent 1px)",
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(57,255,20,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(57,255,20,0.65), 0 0 40px rgba(57,255,20,0.2)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'orb-float': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'pulse-neon': 'pulse-neon 2.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 2.5s linear infinite',
        'orb-float': 'orb-float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
