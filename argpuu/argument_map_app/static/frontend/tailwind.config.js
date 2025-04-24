/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        radiate: {
          '0%': { boxShadow: '0 0 0 0 rgba(253, 224, 71, 0.7)' }, 
          '70%': { boxShadow: '0 0 0 10px rgba(253, 224, 71, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(253, 224, 71, 0)' },
        },
        spreadFromCenter: {
          '0%': {
            background: 'radial-gradient(circle at center, rgba(253, 224, 71, 1) 0%, rgba(253, 224, 71, 0) 0%)',
            backgroundSize: '0% 0%',
            backgroundRepeat: 'no-repeat',
          },
          '100%': {
            background: 'radial-gradient(circle at center, rgba(253, 224, 71, 1) 100%, rgba(253, 224, 71, 0) 100%)',
            backgroundSize: '200% 200%',
            backgroundRepeat: 'no-repeat',
          },
        },
      },
      animation: {
        radiate: 'radiate 0.5s ease-out',
        spread: 'spreadFromCenter 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
