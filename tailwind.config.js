// path: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // KRİTİK FİX: Dinamik olarak oluşturulan Header ve Dropdown renk sınıfları için
  // safelist genişletildi. Bu, renklerin derleme sırasında kaybolmasını önler.
  // Bu safelist, dinamik renk sorununu çözdüğü için KORUNMALIDIR.
  safelist: [
    // --- Header & Dropdown Dynamic Colors (NavBtn, DashboardDropdown, ModulesDropdown) ---
    // Renkler: indigo, amber, sky, green, yellow, orange, red, purple
    'bg-indigo-900/70', 'bg-amber-900/70', 'bg-sky-900/70', 'bg-green-900/70', 'bg-yellow-900/70', 'bg-orange-900/70', 'bg-red-900/70', 'bg-purple-900/70',
    'border-indigo-500/50', 'border-amber-500/50', 'border-sky-500/50', 'border-green-500/50', 'border-yellow-500/50', 'border-orange-500/50', 'border-red-500/50', 'border-purple-500/50',
    'shadow-indigo-900/50', 'shadow-amber-900/50', 'shadow-sky-900/50', 'shadow-green-900/50', 'shadow-yellow-900/50', 'shadow-orange-900/50', 'shadow-red-900/50', 'shadow-purple-900/50',
    
    'text-indigo-300', 'text-amber-300', 'text-sky-300', 'text-green-300', 'text-yellow-300', 'text-orange-300', 'text-red-300', 'text-purple-300',
    'text-indigo-400', 'text-amber-400', 'text-sky-400', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-purple-400',
    
    'bg-indigo-700/80', 'bg-green-700/80', 'bg-yellow-700/80', 'bg-orange-700/80', 'bg-red-700/80', 'bg-sky-700/80', 'bg-amber-700/80',
    'text-gray-900', // Dashboard Dropdown için
    
    // Header butonu inaktif hover/ring sınıfları (Header.js'den)
    'hover:text-indigo-300', 'hover:bg-gray-700/50', 'hover:ring-2', 'hover:ring-indigo-500/50',
    'text-amber-300', 'border-amber-800/60', 'bg-black/20', 'hover:bg-amber-900/40', 'hover:border-amber-700/70',
    
    // --- Existing Hardcoded Classes (Keep for Safety) ---
    'bg-amber-700', 'bg-sky-600', 'bg-green-600', 'bg-red-600',
    'bg-green-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400',
    'bg-yellow-400/90', 'border-yellow-400/50',
    'bg-amber-700/90', 'border-amber-400/50',
    'hover:text-gray-900', 'hover:bg-yellow-500', 'bg-yellow-500/10', 'border-yellow-500/50',
    'bg-red-900/40', 'text-red-300', 'bg-green-700/30', 'text-green-300', 'border-green-500/50', 'border-red-500/50',
    'bg-green-600/70', 'bg-red-600/70',
    'bg-sky-600', 'hover:bg-sky-500', 'shadow-sky-900/50', 'border-sky-400/50',
    'bg-amber-700', 'hover:bg-amber-600', 'shadow-amber-900/50', 'border-amber-400/50',
    'bg-red-700/50', 'bg-red-900/50', 'bg-green-900/50', 'text-green-400', 'text-red-400', 'border-red-500', 'border-green-500',
    'bg-indigo-700/50',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "scroll": {
            "from": { transform: "translateX(0)" },
            "to": { transform: "translateX(-50%)" },
        },
        "glowing": {
          "0%": { "background-position": "0 0" },
          "50%": { "background-position": "400% 0" },
          "100%": { "background-position": "0 0" },
        },
        "rotate-globe": {
          "from": { "background-position-x": "0px" },
          "to": { "background-position-x": "-1133px" },
        },
        "pulse": {
            '50%': {
              opacity: '.5',
            },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scroll": "scroll 40s linear infinite",
        "glowing": "glowing 20s linear infinite",
        "rotate-globe": "rotate-globe 40s linear infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography')
  ],
};
