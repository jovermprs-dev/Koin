export type TipoTransaccion = "gasto" | "ingreso";

export type Transaccion = {
  id: number;
  tipo: TipoTransaccion;
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

export type GastoCategoria = {
  categoria: string;
  total: number;
};

export type ResumenMes = {
  mes: string;
  ingresos: number;
  gastos: number;
};
