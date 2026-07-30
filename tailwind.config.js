const { heroui } = require("@heroui/react");

/* ============================================================
   Paleta BotDynamics — misma fuente que adminDashboard.
   Los valores se declaran aqui como hex literales (y NO como
   var(--token)) a proposito: Tailwind necesita el literal para
   que funcionen los modificadores de opacidad tipo bg-cream/50.
   src/styles/tokens.css tiene los mismos valores para el CSS
   escrito a mano. Si cambias uno, cambia el otro.
   ============================================================ */
const cream = {
  DEFAULT: "#FFFAEB",
  50:  "#FFFDF7",
  100: "#FFF8E7",
  200: "#F7F0DC",
  300: "#EDE3C9",
};

const ink = {
  DEFAULT: "#0A0A0A",
  900: "#141414",
  800: "#1F1F1F",
  700: "#242424",
  600: "#333333",
  500: "#4F4F4F",
  400: "#656565",
};

/* Rampa flame. Solo relleno/gradiente/marca grande.
   orange da 2.38:1 sobre crema: nunca como texto. */
const flame = {
  yellow: "#FFD800",
  amber:  "#FFAF00",
  orange: "#FF8205",
  ember:  "#FA500F",
  red:    "#E10500",
};

/* Estados. Set solido separado de flame por funcion. >= 5.6:1 sobre crema. */
const status = {
  good:     "#0B6B41",
  warn:     "#8A5A00",
  serious:  "#B23A00",
  critical: "#C10400",
};

/* Categorica de graficas: la misma validada en adminDashboard
   (light, superficie #FFFAEB). Orden fijo, nunca ciclar. */
const chart = {
  1: "#FA500F",
  2: "#1B4FA8",
  3: "#118256",
  4: "#7A5AD8",
  5: "#C4157F",
  6: "#0596B0",
};

const hair = {
  DEFAULT: "rgba(10, 10, 10, .14)",
  soft:    "rgba(10, 10, 10, .08)",
  dark:    "rgba(255, 250, 235, .18)",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: { cream, ink, flame, ...status, chart, hair },

      fontFamily: {
        sans:    ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Instrument Sans", "Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      /* Filo total: el radio por defecto es 2px. Las pills siguen siendo pills. */
      borderRadius: {
        none: "0",
        sm:   "2px",
        DEFAULT: "2px",
        md:   "2px",
        lg:   "2px",
        xl:   "2px",
        "2xl": "2px",
        "3xl": "2px",
        full: "9999px",
      },

      /* La identidad separa por borde, no por sombra. Las unicas sombras
         permitidas son de elevacion real (nav pegado, popovers, modales). */
      boxShadow: {
        none:  "none",
        nav:   "0 1px 24px rgba(10, 10, 10, .06)",
        fab:   "0 12px 36px -12px rgba(10, 10, 10, .55)",
        panel: "0 24px 70px -30px rgba(10, 10, 10, .30)",
      },

      letterSpacing: {
        display: "-0.035em",
        eyebrow: "0.13em",
      },

      transitionTimingFunction: {
        brand: "cubic-bezier(.22, 1, .36, 1)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        /* Anula los radios redondeados por defecto de HeroUI en todos
           los componentes del dashboard, de una sola vez. */
        radius: { small: "2px", medium: "2px", large: "2px" },
      },
      themes: {
        light: {
          colors: {
            background: cream.DEFAULT,
            foreground: ink.DEFAULT,
            divider:    hair.DEFAULT,
            focus:      flame.ember,

            /* Superficies: canvas crema, tarjetas casi blancas */
            content1: cream[50],
            content2: cream[100],
            content3: cream[200],
            content4: cream[300],

            /* El boton primario de la marca es tinta, no color. */
            primary: {
              DEFAULT: ink.DEFAULT,
              foreground: cream.DEFAULT,
              50: cream[100], 100: cream[300], 200: ink[400], 300: ink[500],
              400: ink[600], 500: ink[700], 600: ink[800], 700: ink[900],
              800: ink.DEFAULT, 900: ink.DEFAULT,
            },
            /* El acento de marca. Antes era el gradiente indigo->pink. */
            secondary: {
              DEFAULT: flame.ember,
              foreground: "#ffffff",
              50: "#FFF1E6", 100: "#FFDCC2", 200: "#FFBE8F", 300: "#FF9E5C",
              400: flame.orange, 500: flame.ember, 600: "#D8400A",
              700: "#B23400", 800: "#8C2800", 900: "#661C00",
            },
            success: { DEFAULT: status.good,     foreground: "#ffffff" },
            warning: { DEFAULT: status.warn,     foreground: "#ffffff" },
            danger:  { DEFAULT: status.critical, foreground: "#ffffff" },
            default: {
              DEFAULT: cream[200],
              foreground: ink.DEFAULT,
              50: cream[50], 100: cream[100], 200: cream[200], 300: cream[300],
              400: ink[400], 500: ink[500], 600: ink[600], 700: ink[700],
              800: ink[800], 900: ink[900],
            },
          },
        },

        /* Definido pero NO enviado: el app sigue anclado a .light,
           igual que adminDashboard. */
        dark: {
          colors: {
            background: ink.DEFAULT,
            foreground: cream.DEFAULT,
            divider:    hair.dark,
            focus:      flame.orange,

            content1: ink[900],
            content2: ink[800],
            content3: ink[700],
            content4: ink[600],

            primary:   { DEFAULT: cream.DEFAULT, foreground: ink.DEFAULT },
            secondary: { DEFAULT: flame.orange,  foreground: ink.DEFAULT },
            success:   { DEFAULT: "#2FB07A",     foreground: ink.DEFAULT },
            warning:   { DEFAULT: flame.amber,   foreground: ink.DEFAULT },
            danger:    { DEFAULT: "#FF5A54",     foreground: ink.DEFAULT },
          },
        },
      },
    }),
  ],
};
