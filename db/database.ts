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
