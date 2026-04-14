import * as SQLite from "expo-sqlite";
import type { GastoCategoria, Presupuesto, PresupuestoConGasto, ResumenMes, Transaccion, TipoTransaccion } from "@/types/models";

export type { GastoCategoria, Presupuesto, PresupuestoConGasto, ResumenMes, Transaccion, TipoTransaccion };

const db = SQLite.openDatabaseSync("koinDB");

export function inicializarDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS transacciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('gasto', 'ingreso')),
      categoria TEXT NOT NULL,
      importe REAL NOT NULL,
      concepto TEXT,
      fecha TEXT NOT NULL CHECK(fecha LIKE '____-__-__T__:__:__%.%Z')
    );

    CREATE TABLE IF NOT EXISTS presupuestos (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL UNIQUE,
      limite    REAL NOT NULL CHECK(limite > 0)
    );
  `);
}

export function guardarTransaccion(
  tipo: TipoTransaccion,
  categoria: string,
  importe: number,
  fecha: string,
  concepto: string | null,
) {
  db.runSync(
    `
    INSERT INTO transacciones (tipo, categoria, importe, concepto, fecha)
    VALUES (?, ?, ?, ?, ?)
  `,
    tipo,
    categoria,
    importe,
    concepto,
    fecha,
  );
}

export function obtenerTransacciones(): Transaccion[] {
  const transacciones: Transaccion[] = db.getAllSync<Transaccion>(
    "SELECT * FROM transacciones ORDER BY fecha DESC",
  );

  return transacciones;
}

export function eliminarTransaccion(id: number) {
  db.runSync(`DELETE FROM transacciones WHERE id = (?)`, id);
}

export function obtenerTransaccionPorId(id: number): Transaccion | null {
  return (
    db.getFirstSync<Transaccion>(
      `SELECT * FROM transacciones WHERE id = ?`,
      id,
    ) ?? null
  );
}

export function actualizarTransaccion(
  id: number,
  tipo: TipoTransaccion,
  categoria: string,
  importe: number,
  fecha: string,
  concepto: string | null,
) {
  db.runSync(
    `UPDATE transacciones
     SET tipo = ?, categoria = ?, importe = ?, fecha = ?, concepto = ?, synced = 0
     WHERE id = ?`,
    tipo,
    categoria,
    importe,
    fecha,
    concepto,
    id,
  );
}

export function obtenerResumenMes(tipo: TipoTransaccion): number {
  const result = db.getFirstSync<{ total: number }>(
    `
    SELECT SUM(importe) as total FROM transacciones
    WHERE tipo = ?
    AND fecha >= strftime('%Y-%m-01', 'now')
  `,
    tipo,
  );

  return result?.total ?? 0;
}

// ── Presupuestos ─────────────────────────────────────────────────────────────

export function guardarPresupuesto(categoria: string, limite: number): void {
  db.runSync(
    `INSERT INTO presupuestos (categoria, limite) VALUES (?, ?)`,
    categoria.trim(),
    limite,
  );
}

export function actualizarPresupuesto(
  id: number,
  categoria: string,
  limite: number,
): void {
  db.runSync(
    `UPDATE presupuestos SET categoria = ?, limite = ?, synced = 0 WHERE id = ?`,
    categoria.trim(),
    limite,
    id,
  );
}

export function eliminarPresupuesto(id: number): void {
  db.runSync(`DELETE FROM presupuestos WHERE id = ?`, id);
}

export function obtenerPresupuestosConGasto(): PresupuestoConGasto[] {
  return db.getAllSync<PresupuestoConGasto>(`
    SELECT
      p.id,
      p.categoria,
      p.limite,
      COALESCE(SUM(t.importe), 0) AS gastado
    FROM presupuestos p
    LEFT JOIN transacciones t
      ON t.categoria = p.categoria
      AND t.tipo = 'gasto'
      AND t.fecha >= strftime('%Y-%m-01T00:00:00.000Z', 'now')
    GROUP BY p.id
    ORDER BY (COALESCE(SUM(t.importe), 0) / p.limite) DESC
  `);
}

export function obtenerPresupuestosExcedidos(): PresupuestoConGasto[] {
  return db.getAllSync<PresupuestoConGasto>(`
    SELECT
      p.id,
      p.categoria,
      p.limite,
      COALESCE(SUM(t.importe), 0) AS gastado
    FROM presupuestos p
    LEFT JOIN transacciones t
      ON t.categoria = p.categoria
      AND t.tipo = 'gasto'
      AND t.fecha >= strftime('%Y-%m-01T00:00:00.000Z', 'now')
    GROUP BY p.id
    HAVING gastado > p.limite
    ORDER BY gastado DESC
  `);
}

// ── Migración ─────────────────────────────────────────────────────────────────

type TransaccionLocal = Transaccion & { remote_id: string | null; synced: number };
type PresupuestoLocal = Presupuesto & { remote_id: string | null; synced: number };

export function migrarDB(): void {
  const cols = (tabla: string) =>
    db
      .getAllSync<{ name: string }>(`PRAGMA table_info(${tabla})`)
      .map((c) => c.name);

  if (!cols("transacciones").includes("remote_id")) {
    db.runSync(`ALTER TABLE transacciones ADD COLUMN remote_id TEXT`);
    db.runSync(
      `ALTER TABLE transacciones ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
    );
  }
  if (!cols("presupuestos").includes("remote_id")) {
    db.runSync(`ALTER TABLE presupuestos ADD COLUMN remote_id TEXT`);
    db.runSync(
      `ALTER TABLE presupuestos ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
    );
  }
}

// ── Sync — transacciones ──────────────────────────────────────────────────────

export function obtenerTransaccionesNoSincronizadas(): TransaccionLocal[] {
  return db.getAllSync<TransaccionLocal>(
    `SELECT * FROM transacciones WHERE synced = 0`,
  );
}

export function marcarTransaccionSincronizada(
  id: number,
  remoteId: string,
): void {
  db.runSync(
    `UPDATE transacciones SET remote_id = ?, synced = 1 WHERE id = ?`,
    remoteId,
    id,
  );
}

export function obtenerRemoteIdTransaccion(id: number): string | null {
  const row = db.getFirstSync<{ remote_id: string | null }>(
    `SELECT remote_id FROM transacciones WHERE id = ?`,
    id,
  );
  return row?.remote_id ?? null;
}

export function insertarTransaccionRemota(t: {
  remote_id: string;
  tipo: TipoTransaccion;
  categoria: string;
  importe: number;
  concepto: string | null;
  fecha: string;
}): void {
  db.runSync(
    `INSERT INTO transacciones (tipo, categoria, importe, concepto, fecha, remote_id, synced)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    t.tipo,
    t.categoria,
    t.importe,
    t.concepto,
    t.fecha,
    t.remote_id,
  );
}

// ── Sync — presupuestos ───────────────────────────────────────────────────────

export function obtenerPresupuestosNoSincronizados(): PresupuestoLocal[] {
  return db.getAllSync<PresupuestoLocal>(
    `SELECT * FROM presupuestos WHERE synced = 0`,
  );
}

export function marcarPresupuestoSincronizado(
  id: number,
  remoteId: string,
): void {
  db.runSync(
    `UPDATE presupuestos SET remote_id = ?, synced = 1 WHERE id = ?`,
    remoteId,
    id,
  );
}

export function obtenerRemoteIdPresupuesto(id: number): string | null {
  const row = db.getFirstSync<{ remote_id: string | null }>(
    `SELECT remote_id FROM presupuestos WHERE id = ?`,
    id,
  );
  return row?.remote_id ?? null;
}

export function insertarPresupuestoRemoto(p: {
  remote_id: string;
  categoria: string;
  limite: number;
}): void {
  db.runSync(
    `INSERT INTO presupuestos (categoria, limite, remote_id, synced)
     VALUES (?, ?, ?, 1)`,
    p.categoria,
    p.limite,
    p.remote_id,
  );
}

export function obtenerRemoteIdsTransacciones(): string[] {
  return db
    .getAllSync<{ remote_id: string }>(
      `SELECT remote_id FROM transacciones WHERE remote_id IS NOT NULL`,
    )
    .map((r) => r.remote_id);
}

export function obtenerRemoteIdsPresupuestos(): string[] {
  return db
    .getAllSync<{ remote_id: string }>(
      `SELECT remote_id FROM presupuestos WHERE remote_id IS NOT NULL`,
    )
    .map((r) => r.remote_id);
}

export function limpiarDatosLocales(): void {
  db.execSync(`DELETE FROM transacciones; DELETE FROM presupuestos;`);
}

// ── Estadísticas ──────────────────────────────────────────────────────────────

export function obtenerGastosPorCategoria(): GastoCategoria[] {
  return db.getAllSync<GastoCategoria>(`
    SELECT categoria, SUM(importe) AS total
    FROM transacciones
    WHERE tipo = 'gasto'
      AND fecha >= strftime('%Y-%m-01T00:00:00.000Z', 'now')
    GROUP BY categoria
    ORDER BY total DESC
  `);
}

export function obtenerResumenUltimosMeses(n: number): ResumenMes[] {
  return db.getAllSync<ResumenMes>(
    `
    SELECT
      strftime('%Y-%m', fecha) AS mes,
      SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END) AS ingresos,
      SUM(CASE WHEN tipo = 'gasto'   THEN importe ELSE 0 END) AS gastos
    FROM transacciones
    WHERE fecha >= date('now', '-' || ? || ' months')
    GROUP BY mes
    ORDER BY mes ASC
    `,
    n,
  );
}
