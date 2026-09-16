import type { AppColors } from "@/hooks/useAppColors";
import type { PresupuestoConGasto, Transaccion } from "@/types/models";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

// ── Auth ──────────────────────────────────────────────────────────────────────

export type AuthModo = "login" | "registro";

// ── Agregar / Editar transacción ──────────────────────────────────────────────

export interface AgregarForm {
  importe: string;
  tipo: "gasto" | "ingreso";
  categoria: string;
  concepto: string;
}

export interface AgregarFormErrors {
  importe?: string;
  categoria?: string;
}

// ── Filas de listas ───────────────────────────────────────────────────────────

export type FilaTransaccionProps = {
  item: Transaccion;
  colors: AppColors;
  onEliminar: (id: number) => void;
  onOpen: (id: number) => void;
  registerRef: (id: number, ref: SwipeableMethods | null) => void;
  onEditar: (id: number) => void;
};

export type FilaPresupuestoProps = {
  item: PresupuestoConGasto;
  colors: AppColors;
  onEliminar: (id: number) => void;
  onEditar: (item: PresupuestoConGasto) => void;
  onOpen: (id: number) => void;
  registerRef: (id: number, ref: SwipeableMethods | null) => void;
};
