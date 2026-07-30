/* ============================================================
   Clases del rail de navegacion del agente.

   Equivalente de adminDashboard/src/styles/navClasses.js: una sola
   definicion para que el rail se vea igual en las dos apps.

   El idioma activo ya no es "bg-gradient-to-br from-indigo-500
   to-pink-500 scale-110": es la barra flame vertical de la marca
   (.bd-rail-btn--active::before, definida en styles/brand.css).
   ============================================================ */

const BASE = 'bd-rail-btn shadow-none transition-colors duration-300';

const SIZE = 'w-10 h-10';

/**
 * @param {object}  opts
 * @param {boolean} opts.active  tile de la vista actual: barra flame + fondo crema tenue
 */
export const railBtn = ({ active = false } = {}) => {
  if (active) {
    return `${BASE} ${SIZE} bd-rail-btn--active bg-cream/10 border border-hair-dark`;
  }
  return `${BASE} ${SIZE} bg-transparent border border-transparent hover:bg-cream/5`;
};

/** Acciones del pie del rail (cerrar sesion). */
export const railUtilityBtn = () =>
  `${BASE} ${SIZE} bg-transparent border border-transparent hover:bg-cream/5`;

/** Avatar: hairline sobre tinta en vez del anillo de color. */
export const RAIL_AVATAR = 'w-10 h-10 bd-rail-avatar';
