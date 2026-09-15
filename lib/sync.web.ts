// Web backend for the sync module. On web there's no local SQLite to push
// from — db/database.web.ts already writes straight to Supabase, updating
// its in-memory cache optimistically as it does. sincronizar() is called
// from two kinds of places: once after login (needs a real load), and
// right after every save (agregar.tsx, presupuestos.tsx — inherited from
// the native push/pull flow). Re-running cargarDatosRemotos() on that
// second kind is worse than a no-op: its SELECT can land before the write
// it's racing against has committed, wiping the just-saved item back out
// of the cache. So this only does the real load once per session.
import { cargarDatosRemotos } from "@/db/database";
import { supabase } from "@/lib/supabase";

export async function eliminarTransaccionRemota(remoteId: string): Promise<void> {
  await supabase.from("transacciones").delete().eq("id", remoteId);
}

export async function eliminarPresupuestoRemoto(remoteId: string): Promise<void> {
  await supabase.from("presupuestos").delete().eq("id", remoteId);
}

let cargado = false;

export async function sincronizar(): Promise<void> {
  if (cargado) return;
  cargado = true;
  await cargarDatosRemotos();
}

export function resetSincronizacion(): void {
  cargado = false;
}
