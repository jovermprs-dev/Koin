// Same reasoning as lib/filtroTransacciones.ts: an in-memory, one-shot
// hand-off instead of a ?id=... query param, so the web tab bar's
// remembered per-tab href can't reopen a stale edit form when the
// "Agregar" tab is pressed directly after an unrelated edit.
let pendiente: number | null = null;

export function setEdicionPendiente(id: number): void {
  pendiente = id;
}

export function consumirEdicionPendiente(): number | null {
  const value = pendiente;
  pendiente = null;
  return value;
}
