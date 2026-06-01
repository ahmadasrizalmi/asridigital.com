import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Slate palette — primary text/UI
        carbon: {
          DEFAULT: '#0f172a',  // slate-900 — headings, strong text
          hover: '#1e293b',    // slate-800
        },
        background: '#f1f5f9', // slate-100 — page background
        surface: '#FFFFFF',    // card/surface
        'text-primary': '#0f172a',   // slate-900 — headings
        'text-main': '#475569',      // slate-600 — body text
        'text-secondary': '#64748b', // slate-500 — secondary
        'text-muted': '#94a3b8',     // slate-400 — muted/caption
        border: '#e2e8f0',           // slate-200
        'border-light': '#f1f5f9',   // slate-100 — subtle dividers
        // Primary — emerald
        primary: {
          DEFAULT: '#10b981',  // emerald-500
          hover: '#059669',    // emerald-600
          light: '#d1fae5',    // emerald-100 — badge bg
        },
        // Mint — button gradient start
        mint: {
          DEFAULT: '#81E2A4',
          light: '#a7f3d0',    // emerald-200
        },
        // Cream — button gradient end
        cream: {
          DEFAULT: '#F8F5C4',
          light: '#fef9c3',    // yellow-100
        },
        // Semantic
        secondary: '#64748b',
        accent: '#10b981',
        success: '#10b981',
        danger: '#DC2626',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1.1', fontWeight: '800' }],
        'h2': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['0.875rem'],
        'caption': ['0.75rem'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '1.25rem',    // 20px — email container, large cards
      },
      boxShadow: {
        // Ethereal — soft, layered shadows
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.03)',
        'float': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
        'btn-primary': '0 6px 20px rgba(129, 226, 164, 0.25), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'nav': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        // Ethereal gradient — header, hero sections
        'ethereal': 'radial-gradient(circle at 80% 0%, rgba(167,243,208,0.4) 0%, transparent 50%), radial-gradient(circle at 10% 100%, rgba(186,230,253,0.4) 0%, transparent 50%)',
        // Button gradient — mint → cream
        'btn-gradient': 'linear-gradient(90deg, #81E2A4 0%, #F8F5C4 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [typography],
};
