const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};

// ── Constantes semánticas ─────────────────────────────────────────────────────

export const Tint = "#2f95dc";
export const Error = "#e53e3e";

export const Gasto = {
  text: "#b91c1c",
  bg: "#fee2e2",
  active: "#ef4444",
};

export const Ingreso = {
  text: "#15803d",
  bg: "#dcfce7",
  active: "#22c55e",
};

export const Progreso = {
  ok:          { bar: "#22c55e", badge: "#dcfce7", text: "#15803d" },
  advertencia: { bar: "#f97316", badge: "#ffedd5", text: "#c2410c" },
  critico:     { bar: "#ef4444", badge: "#fee2e2", text: "#b91c1c" },
};
