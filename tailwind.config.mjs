/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // 1. Warna Dasar (Base Colors)
        background: '#FAFAFA',    // Off-White
        surface: '#FFFFFF',        // Pure White
        
        // 2. Warna Teks & Kontras
        'text-primary': '#171717',   // Hampir Hitam (Neutral 900)
        'text-main': '#262626',      // Abu-abu Tua (Neutral 800)
        'text-secondary': '#737373', // Abu-abu Sedang (Neutral 500)
        'text-muted': '#9CA3AF',     // Gray 400
        
        // 3. Warna Garis & Pemisah
        border: '#E5E5E5',        // Neutral 200
        
        // 4. Warna Aksen & Tombol
        primary: {
          DEFAULT: '#5C7A36',     // Sage Green
          hover: '#4A6628',       // Sage Green Darker
        },
        
        // Legacy support (diganti ke versi light)
        secondary: '#5C7A36',
        accent: '#5C7A36',
        success: '#5C7A36',
        danger: '#DC2626',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'btn-primary': '0 4px 14px rgba(92, 122, 54, 0.25)',
        'nav': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
