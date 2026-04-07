import {
  GastoCategoria,
  obtenerGastosPorCategoria,
  obtenerResumenUltimosMeses,
  ResumenMes,
} from "@/db/database";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function useColors() {
  const isDark = useColorScheme() === "dark";
  return {
    background: isDark ? "#1a1a1a" : "#f5f5f5",
    card: isDark ? "#2a2a2a" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#666",
    border: isDark ? "#333" : "#eee",
    ingreso: "#22c55e",
    gasto: "#ef4444",
  };
}

function labelMes(mes: string): string {
  const [year, month] = mes.split("-");
  const fecha = new Date(Number(year), Number(month) - 1, 1);
  return fecha.toLocaleDateString("es-ES", { month: "short" });
}

// ── Componente de leyenda ─────────────────────────────────────────────────────

function LeyendaItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.leyendaDot, { backgroundColor: color }]} />
      <Text style={styles.leyendaLabel}>{label}</Text>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function EstadisticasScreen() {
  const colors = useColors();
  const [gastosCat, setGastosCat] = useState<GastoCategoria[]>([]);
  const [resumenMeses, setResumenMeses] = useState<ResumenMes[]>([]);

  useFocusEffect(
    useCallback(() => {
      setGastosCat(obtenerGastosPorCategoria());
      setResumenMeses(obtenerResumenUltimosMeses(6));
    }, []),
  );

  // ── Datos para el gráfico de categorías ──────────────────────────────────

  const dataCategoria = gastosCat.map((g) => ({
    value: g.total,
    label: g.categoria,
    frontColor: colors.gasto,
  }));

  // ── Datos para el gráfico de tendencia mensual ────────────────────────────

  const dataTendencia = resumenMeses.flatMap((m) => [
    {
      value: m.ingresos,
      label: labelMes(m.mes),
      frontColor: colors.ingreso,
      spacing: 4,
    },
    {
      value: m.gastos,
      frontColor: colors.gasto,
      spacing: 16,
    },
  ]);

  const maxTendencia = resumenMeses.reduce(
    (max, m) => Math.max(max, m.ingresos, m.gastos),
    0,
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Gastos por categoría */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.seccionTitle, { color: colors.text }]}>
          Gastos por categoría
        </Text>
        <Text style={[styles.seccionSubtitle, { color: colors.subtext }]}>
          Este mes
        </Text>

        {dataCategoria.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Sin gastos registrados este mes
          </Text>
        ) : (
          <BarChart
            data={dataCategoria}
            barWidth={28}
            spacing={16}
            roundedTop
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: colors.subtext, fontSize: 11 }}
            xAxisLabelTextStyle={{
              color: colors.subtext,
              fontSize: 10,
              width: 60,
              textAlign: "center",
            }}
            noOfSections={4}
            maxValue={gastosCat[0]?.total ? Math.ceil(gastosCat[0].total * 1.2) : 100}
          />
        )}
      </View>

      {/* Tendencia mensual */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.seccionTitle, { color: colors.text }]}>
          Tendencia mensual
        </Text>
        <Text style={[styles.seccionSubtitle, { color: colors.subtext }]}>
          Últimos 6 meses
        </Text>

        {dataTendencia.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Sin datos suficientes
          </Text>
        ) : (
          <>
            <BarChart
              data={dataTendencia}
              barWidth={20}
              spacing={4}
              roundedTop
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.subtext, fontSize: 11 }}
              xAxisLabelTextStyle={{ color: colors.subtext, fontSize: 11 }}
              noOfSections={4}
              maxValue={maxTendencia > 0 ? Math.ceil(maxTendencia * 1.2) : 100}
            />
            <View style={styles.leyenda}>
              <LeyendaItem color={colors.ingreso} label="Ingresos" />
              <LeyendaItem color={colors.gasto} label="Gastos" />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 4,
  },
  seccionTitle: { fontSize: 16, fontWeight: "700" },
  seccionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  emptyText: { fontSize: 14, paddingVertical: 24, textAlign: "center" },
  leyenda: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    justifyContent: "center",
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaLabel: { fontSize: 12, color: "#666" },
});
