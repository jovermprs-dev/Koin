// A one-shot, in-memory hand-off for "open Transacciones pre-filtered by
// tipo" (used by Resumen's Ingresos/Gastos shortcut cards).
//
// This intentionally isn't a URL query param: the web tab bar remembers
// the last URL each tab was navigated to (including query params) as that
// tab's own href, so a filter passed that way would "stick" — pressing
// the Transacciones tab directly later would silently reopen the same
// filtered view instead of the full list. A plain in-memory value has no
// such memory: it's set right before navigating, read and cleared on the
// very next focus, and completely absent otherwise.
import type { TipoTransaccion } from "@/types/models";

let pendiente: TipoTransaccion | null = null;

export function setFiltroTransaccionesPendiente(tipo: TipoTransaccion): void {
  pendiente = tipo;
}

export function consumirFiltroTransaccionesPendiente(): TipoTransaccion | null {
  const value = pendiente;
  pendiente = null;
  return value;
}
