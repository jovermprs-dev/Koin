import {
  insertarPresupuestoRemoto,
  insertarTransaccionRemota,
  marcarPresupuestoSincronizado,
  marcarTransaccionSincronizada,
  obtenerPresupuestosNoSincronizados,
  obtenerRemoteIdsPresupuestos,
  obtenerRemoteIdsTransacciones,
  obtenerTransaccionesNoSincronizadas,
} from "@/db/database";
import { supabase } from "@/lib/supabase";

// ── Push ──────────────────────────────────────────────────────────────────────

async function pushTransacciones(userId: string): Promise<void> {
  const pendientes = obtenerTransaccionesNoSincronizadas();
  if (pendientes.length === 0) return;

  const nuevas = pendientes.filter((t) => !t.remote_id);
  const modificadas = pendientes.filter((t) => !!t.remote_id);

  if (nuevas.length > 0) {
    const payload = nuevas.map((t) => ({
      user_id: userId,
      tipo: t.tipo,
      categoria: t.categoria,
      importe: t.importe,
      concepto: t.concepto,
      fecha: t.fecha,
    }));

    const { data, error } = await supabase
      .from("transacciones")
      .insert(payload)
      .select("id");

    if (!error && data) {
      data.forEach((remote, i) => {
        marcarTransaccionSincronizada(nuevas[i].id, remote.id);
      });
    }
  }

  for (const t of modificadas) {
    const { error } = await supabase
      .from("transacciones")
      .update({
        tipo: t.tipo,
        categoria: t.categoria,
        importe: t.importe,
        concepto: t.concepto,
        fecha: t.fecha,
      })
      .eq("id", t.remote_id);

    if (!error) marcarTransaccionSincronizada(t.id, t.remote_id!);
  }
}

async function pushPresupuestos(userId: string): Promise<void> {
  const pendientes = obtenerPresupuestosNoSincronizados();
  if (pendientes.length === 0) return;

  for (const p of pendientes) {
    const { data, error } = await supabase
      .from("presupuestos")
      .upsert(
        { user_id: userId, categoria: p.categoria, limite: p.limite },
        { onConflict: "user_id,categoria" },
      )
      .select("id")
      .single();

    if (error || !data) continue;
    marcarPresupuestoSincronizado(p.id, data.id);
  }
}

// ── Pull ──────────────────────────────────────────────────────────────────────

async function pullTransacciones(): Promise<void> {
  const { data, error } = await supabase
    .from("transacciones")
    .select("id, tipo, categoria, importe, concepto, fecha");

  if (error || !data) return;

  const locales = obtenerRemoteIdsTransacciones();

  for (const remota of data) {
    if (!locales.includes(remota.id)) {
      insertarTransaccionRemota({
        remote_id: remota.id,
        tipo: remota.tipo as "gasto" | "ingreso",
        categoria: remota.categoria,
        importe: remota.importe,
        concepto: remota.concepto,
        fecha: remota.fecha,
      });
    }
  }
}

async function pullPresupuestos(): Promise<void> {
  const { data, error } = await supabase
    .from("presupuestos")
    .select("id, categoria, limite");

  if (error || !data) return;

  const locales = obtenerRemoteIdsPresupuestos();

  for (const remoto of data) {
    if (!locales.includes(remoto.id)) {
      insertarPresupuestoRemoto({
        remote_id: remoto.id,
        categoria: remoto.categoria,
        limite: remoto.limite,
      });
    }
  }
}

// ── Borrado remoto ────────────────────────────────────────────────────────────

export async function eliminarTransaccionRemota(
  remoteId: string,
): Promise<void> {
  await supabase.from("transacciones").delete().eq("id", remoteId);
}

export async function eliminarPresupuestoRemoto(
  remoteId: string,
): Promise<void> {
  await supabase.from("presupuestos").delete().eq("id", remoteId);
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function sincronizar(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return;

  const userId = session.user.id;
  await Promise.all([pushTransacciones(userId), pushPresupuestos(userId)]);
  await Promise.all([pullTransacciones(), pullPresupuestos()]);
}
