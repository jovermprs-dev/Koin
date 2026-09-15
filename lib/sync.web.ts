// Web backend for the sync module. On web there's no local SQLite to push
// from — db/database.web.ts already writes straight to Supabase — so
// sincronizar() just refreshes the in-memory cache from the server.
import { cargarDatosRemotos } from "@/db/database";
import { supabase } from "@/lib/supabase";

export async function eliminarTransaccionRemota(remoteId: string): Promise<void> {
  await supabase.from("transacciones").delete().eq("id", remoteId);
}

export async function eliminarPresupuestoRemoto(remoteId: string): Promise<void> {
  await supabase.from("presupuestos").delete().eq("id", remoteId);
}

export async function sincronizar(): Promise<void> {
  await cargarDatosRemotos();
}
