import { obtenerPresupuestosExcedidos, obtenerResumenMes, PresupuestoConGasto } from "@/db/database";
import { useAppColors } from "@/hooks/useAppColors";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResumenScreen() {
  const colors = useAppColors();
  const router = useRouter();

  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [presupuestosExcedidos, setPresupuestosExcedidos] = useState<PresupuestoConGasto[]>([]);
  const saldo = ingresos - gastos;

  useFocusEffect(
    useCallback(() => {
      setIngresos(obtenerResumenMes("ingreso"));
      setGastos(obtenerResumenMes("gasto"));
      setPresupuestosExcedidos(obtenerPresupuestosExcedidos());
    }, []),
  );

  const formatEur = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(2)} €`;

  const now = new Date();
  const mes = now.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.mes, { color: colors.subtext }]}>
        {mes.charAt(0).toUpperCase() + mes.slice(1)}
      </Text>

      {/* Saldo */}
      <View
        style={[
          styles.saldoCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.saldoLabel, { color: colors.subtext }]}>
          Saldo del mes
        </Text>
        <Text
          style={[
            styles.saldoImporte,
            { color: saldo >= 0 ? colors.ingreso.text : colors.gasto.text },
          ]}
        >
          {formatEur(saldo)}
        </Text>
      </View>

      {/* Alertas de presupuestos superados */}
      {presupuestosExcedidos.length > 0 && (
        <View
          style={[
            styles.alertasCard,
            { backgroundColor: colors.gasto.bg, borderColor: colors.gasto.text },
          ]}
        >
          <Text style={[styles.alertasTitle, { color: colors.gasto.text }]}>
            🚨 Presupuestos superados
          </Text>
          {presupuestosExcedidos.map((p) => (
            <Text
              key={p.id}
              style={[styles.alertaItem, { color: colors.gasto.text }]}
            >
              {p.categoria}: {p.gastado.toFixed(2)} / {p.limite.toFixed(2)} €
            </Text>
          ))}
        </View>
      )}

      {/* Enlace a estadísticas */}
      <TouchableOpacity
        onPress={() => router.push("/estadisticas")}
        style={styles.statsLink}
        activeOpacity={0.7}
      >
        <Text style={[styles.statsLinkText, { color: colors.tint }]}>
          Ver estadísticas →
        </Text>
      </TouchableOpacity>

      {/* Ingresos y gastos */}
      <View style={styles.row}>
        <View
          style={[
            styles.miniCard,
            { backgroundColor: colors.ingreso.bg, flex: 1 },
          ]}
        >
          <Text style={styles.miniEmoji}>📈</Text>
          <Text style={[styles.miniLabel, { color: colors.ingreso.text }]}>
            Ingresos
          </Text>
          <Text style={[styles.miniImporte, { color: colors.ingreso.text }]}>
            +{ingresos.toFixed(2)} €
          </Text>
        </View>

        <View
          style={[
            styles.miniCard,
            { backgroundColor: colors.gasto.bg, flex: 1 },
          ]}
        >
          <Text style={styles.miniEmoji}>📉</Text>
          <Text style={[styles.miniLabel, { color: colors.gasto.text }]}>
            Gastos
          </Text>
          <Text style={[styles.miniImporte, { color: colors.gasto.text }]}>
            -{gastos.toFixed(2)} €
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  mes: { fontSize: 14, marginBottom: 24 },
  saldoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  saldoLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  saldoImporte: { fontSize: 42, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12 },
  statsLink: { alignSelf: "flex-end", marginBottom: 16 },
  statsLinkText: { fontSize: 13, fontWeight: "600" },
  alertasCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  alertasTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  alertaItem: { fontSize: 14 },
  miniCard: {
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  miniEmoji: { fontSize: 22 },
  miniLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniImporte: { fontSize: 20, fontWeight: "700" },
});
