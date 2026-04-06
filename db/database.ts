import * as SQLite from "expo-sqlite";

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
