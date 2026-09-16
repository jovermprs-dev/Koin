// Web backend for the database module. There is no local SQLite on the
// web build (see the wa-sqlite/OPFS worker issues that motivated this
// file), so Supabase is the only source of truth: this module keeps an
// in-memory cache synced from Supabase and exposes the exact same
// synchronous API as db/database.ts, so no screen needs to change.
import { supabase } from "@/lib/supabase";
import type {
  GastoCategoria,
  Presupuesto,
  PresupuestoConGasto,
  ResumenMes,
  Transaccion,
  TipoTransaccion,
} from "@/types/models";

export type {
  GastoCategoria,
  Presupuesto,
  PresupuestoConGasto,
  ResumenMes,
  Transaccion,
  TipoTransaccion,
};

type CachedTransaccion = Transaccion & { remoteId: string };
type CachedPresupuesto = Presupuesto & { remoteId: string };

let transacciones: CachedTransaccion[] = [];
let presupuestos: CachedPresupuesto[] = [];
let nextLocalId = 1;

function nextId(): number {
  return nextLocalId++;
}

// Screens don't reliably get a focus event on web every time this tab is
// pressed again (React Navigation's web focus lifecycle doesn't fire the
// same way for every navigation trigger), so instead of only refreshing
// on focus, screens also subscribe here and re-render the moment the
// cache actually changes — independent of navigation entirely.
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function primerDiaDelMesUTC(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

// ── Setup (no-ops: Supabase tables already exist, nothing to migrate locally) ──

export function inicializarDB(): void {}
export function migrarDB(): void {}

// ── Remote sync ─────────────────────────────────────────────────────────────

export async function cargarDatosRemotos(): Promise<void> {
  const [{ data: t }, { data: p }] = await Promise.all([
    supabase
      .from("transacciones")
      .select("id, tipo, categoria, importe, concepto, fecha")
      .order("fecha", { ascending: false }),
    supabase.from("presupuestos").select("id, categoria, limite"),
  ]);

  transacciones = (t ?? []).map((row) => ({
    id: nextId(),
    remoteId: row.id,
    tipo: row.tipo as TipoTransaccion,
    categoria: row.categoria,
    importe: row.importe,
    concepto: row.concepto,
    fecha: row.fecha,
  }));

  presupuestos = (p ?? []).map((row) => ({
    id: nextId(),
    remoteId: row.id,
    categoria: row.categoria,
    limite: row.limite,
  }));

  notify();
}

export function limpiarDatosLocales(): void {
  transacciones = [];
  presupuestos = [];
  notify();
}

// ── Transacciones ────────────────────────────────────────────────────────────

export function guardarTransaccion(
  tipo: TipoTransaccion,
  categoria: string,
  importe: number,
  fecha: string,
  concepto: string | null,
): void {
  const localId = nextId();
  transacciones = [{ id: localId, remoteId: "", tipo, categoria, importe, concepto, fecha }, ...transacciones];
  notify();

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    supabase
      .from("transacciones")
      .insert({ user_id: session.user.id, tipo, categoria, importe, concepto, fecha })
      .select("id")
      .single()
      .then(({ data }) => {
        if (!data) return;
        transacciones = transacciones.map((t) =>
          t.id === localId ? { ...t, remoteId: data.id } : t,
        );
      });
  });
}

export function obtenerTransacciones(): Transaccion[] {
  return transacciones;
}

export function eliminarTransaccion(id: number): void {
  const item = transacciones.find((t) => t.id === id);
  transacciones = transacciones.filter((t) => t.id !== id);
  notify();
  if (item?.remoteId) {
    supabase.from("transacciones").delete().eq("id", item.remoteId);
  }
}

export function obtenerTransaccionPorId(id: number): Transaccion | null {
  return transacciones.find((t) => t.id === id) ?? null;
}

export function actualizarTransaccion(
  id: number,
  tipo: TipoTransaccion,
  categoria: string,
  importe: number,
  fecha: string,
  concepto: string | null,
): void {
  const item = transacciones.find((t) => t.id === id);
  if (!item) return;

  transacciones = transacciones.map((t) =>
    t.id === id ? { ...t, tipo, categoria, importe, fecha, concepto } : t,
  );
  notify();

  if (item.remoteId) {
    supabase
      .from("transacciones")
      .update({ tipo, categoria, importe, fecha, concepto })
      .eq("id", item.remoteId);
  }
}

export function obtenerResumenMes(tipo: TipoTransaccion): number {
  const desde = primerDiaDelMesUTC();
  return transacciones
    .filter((t) => t.tipo === tipo && t.fecha >= desde)
    .reduce((sum, t) => sum + t.importe, 0);
}

// ── Presupuestos ─────────────────────────────────────────────────────────────

export function guardarPresupuesto(categoria: string, limite: number): void {
  const categoriaTrim = categoria.trim();
  if (presupuestos.some((p) => p.categoria === categoriaTrim)) {
    throw new Error("Ya existe un presupuesto para esta categoría");
  }

  const localId = nextId();
  presupuestos = [...presupuestos, { id: localId, remoteId: "", categoria: categoriaTrim, limite }];
  notify();

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    supabase
      .from("presupuestos")
      .upsert(
        { user_id: session.user.id, categoria: categoriaTrim, limite },
        { onConflict: "user_id,categoria" },
      )
      .select("id")
      .single()
      .then(({ data }) => {
        if (!data) return;
        presupuestos = presupuestos.map((p) =>
          p.id === localId ? { ...p, remoteId: data.id } : p,
        );
      });
  });
}

export function actualizarPresupuesto(id: number, categoria: string, limite: number): void {
  const item = presupuestos.find((p) => p.id === id);
  if (!item) return;

  const categoriaTrim = categoria.trim();
  presupuestos = presupuestos.map((p) =>
    p.id === id ? { ...p, categoria: categoriaTrim, limite } : p,
  );
  notify();

  if (item.remoteId) {
    supabase.from("presupuestos").update({ categoria: categoriaTrim, limite }).eq("id", item.remoteId);
  }
}

export function eliminarPresupuesto(id: number): void {
  const item = presupuestos.find((p) => p.id === id);
  presupuestos = presupuestos.filter((p) => p.id !== id);
  notify();
  if (item?.remoteId) {
    supabase.from("presupuestos").delete().eq("id", item.remoteId);
  }
}

export function obtenerPresupuestosConGasto(): PresupuestoConGasto[] {
  const desde = primerDiaDelMesUTC();
  return presupuestos
    .map((p) => {
      const gastado = transacciones
        .filter((t) => t.categoria === p.categoria && t.tipo === "gasto" && t.fecha >= desde)
        .reduce((sum, t) => sum + t.importe, 0);
      return { id: p.id, categoria: p.categoria, limite: p.limite, gastado };
    })
    .sort((a, b) => (b.gastado / b.limite || 0) - (a.gastado / a.limite || 0));
}

export function obtenerPresupuestosExcedidos(): PresupuestoConGasto[] {
  return obtenerPresupuestosConGasto()
    .filter((p) => p.gastado > p.limite)
    .sort((a, b) => b.gastado - a.gastado);
}

// ── Remote id lookups (used directly by a couple of screens) ────────────────

export function obtenerRemoteIdTransaccion(id: number): string | null {
  return transacciones.find((t) => t.id === id)?.remoteId || null;
}

export function obtenerRemoteIdPresupuesto(id: number): string | null {
  return presupuestos.find((p) => p.id === id)?.remoteId || null;
}

// ── Estadísticas ──────────────────────────────────────────────────────────────

export function obtenerGastosPorCategoria(): GastoCategoria[] {
  const desde = primerDiaDelMesUTC();
  const totales = new Map<string, number>();

  for (const t of transacciones) {
    if (t.tipo !== "gasto" || t.fecha < desde) continue;
    totales.set(t.categoria, (totales.get(t.categoria) ?? 0) + t.importe);
  }

  return [...totales.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
}

export function obtenerResumenUltimosMeses(n: number): ResumenMes[] {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - n);
  const cutoffISO = cutoff.toISOString();

  const porMes = new Map<string, { ingresos: number; gastos: number }>();

  for (const t of transacciones) {
    if (t.fecha < cutoffISO) continue;
    const mes = mesDe(t.fecha);
    const entry = porMes.get(mes) ?? { ingresos: 0, gastos: 0 };
    if (t.tipo === "ingreso") entry.ingresos += t.importe;
    else entry.gastos += t.importe;
    porMes.set(mes, entry);
  }

  return [...porMes.entries()]
    .map(([mes, v]) => ({ mes, ingresos: v.ingresos, gastos: v.gastos }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}
