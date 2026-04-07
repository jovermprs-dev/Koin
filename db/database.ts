import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("koinDB");

export type Transaccion = {
  id: number;
  tipo: "gasto" | "ingreso";
  categoria: string;
  importe: number;
  concepto: string | null;
  fecha: string;
};

export type Presupuesto = {
  id: number;
  categoria: string;
  limite: number;
};

export type PresupuestoConGasto = Presupuesto & {
  gastado: number;
};

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
  tipo: string,
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
  tipo: string,
  categoria: string,
  importe: number,
  fecha: string,
  concepto: string | null,
) {
  db.runSync(
    `UPDATE transacciones
     SET tipo = ?, categoria = ?, importe = ?, fecha = ?, concepto = ?
     WHERE id = ?`,
    tipo,
    categoria,
    importe,
    fecha,
    concepto,
    id,
  );
}

export function obtenerResumenMes(tipo: string): number {
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
    `UPDATE presupuestos SET categoria = ?, limite = ? WHERE id = ?`,
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

// ── Estadísticas ──────────────────────────────────────────────────────────────

export type GastoCategoria = {
  categoria: string;
  total: number;
};

export type ResumenMes = {
  mes: string;
  ingresos: number;
  gastos: number;
};

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
