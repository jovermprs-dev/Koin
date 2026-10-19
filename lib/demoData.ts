import type { Presupuesto, TipoTransaccion, Transaccion } from "@/types/models";

export type NuevaTransaccion = Omit<Transaccion, "id">;
export type NuevoPresupuesto = Omit<Presupuesto, "id">;

// Small deterministic PRNG (mulberry32): the sample data looks the same on every load, only its dates move with "now".
function prng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Six months of fictional, plausible finances for the public demo, relative to `now` so the monthly summary, the
 * budgets and the charts always look alive. Entries dated in the future are never generated.
 */
export function crearDatosDemo(now: Date = new Date()): { transacciones: NuevaTransaccion[]; presupuestos: NuevoPresupuesto[] } {
  const transacciones: NuevaTransaccion[] = [];

  const add = (monthsAgo: number, dia: number, tipo: TipoTransaccion, categoria: string, importe: number, concepto: string) => {
    const fecha = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, dia, 12, 0, 0));
    if (fecha > now) return;
    transacciones.push({ tipo, categoria, importe: round2(importe), concepto, fecha: fecha.toISOString() });
  };

  for (let m = 0; m < 6; m++) {
    const rnd = prng(1000 + m);
    const vary = (base: number, pct: number) => base * (1 + (rnd() - 0.5) * 2 * pct);

    add(m, 1, "ingreso", "Trabajo", 1850, "Nómina");
    if (m % 2 === 1) add(m, 18, "ingreso", "Trabajo", vary(260, 0.3), "Proyecto freelance");

    add(m, 2, "gasto", "Hogar", 650, "Alquiler");
    add(m, 8, "gasto", "Hogar", vary(62, 0.25), "Luz y agua");
    add(m, 3, "gasto", "Transporte", 40, "Abono mensual de transporte");
    add(m, 5, "gasto", "Suscripciones", 12.99, "Netflix");
    add(m, 11, "gasto", "Suscripciones", 9.99, "Spotify");

    [4, 10, 17, 24].forEach((dia) => add(m, dia, "gasto", "Alimentación", vary(55, 0.25), "Compra semanal"));
    ["Cena con amigos", "Menú del día", "Pizzería", "Brunch"].forEach((concepto, i) =>
      add(m, [9, 15, 22, 27][i], "gasto", "Restaurantes", vary(26, 0.35), concepto),
    );

    add(m, 12, "gasto", "Ocio", 9.5, "Cine");
    if (m % 2 === 0) add(m, 20, "gasto", "Ocio", vary(38, 0.2), "Entradas de concierto");
    add(m, 14, "gasto", "Salud", vary(15, 0.4), "Farmacia");
    if (m === 1 || m === 4) add(m, 16, "gasto", "Ropa", vary(70, 0.3), "Ropa de temporada");
    if (m === 2) add(m, 6, "gasto", "Educación", 29.99, "Curso online");
    if (m === 3) add(m, 10, "gasto", "Viajes", 320, "Escapada a Lisboa");
  }

  transacciones.sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Transporte is slightly under-budgeted on purpose so the home screen always has an exceeded budget to show.
  const presupuestos: NuevoPresupuesto[] = [
    { categoria: "Alimentación", limite: 260 },
    { categoria: "Restaurantes", limite: 90 },
    { categoria: "Ocio", limite: 40 },
    { categoria: "Transporte", limite: 35 },
    { categoria: "Suscripciones", limite: 30 },
  ];

  return { transacciones, presupuestos };
}
