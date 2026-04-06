import { obtenerTransacciones, Transaccion } from "@/db/database";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";

export default function TransaccionesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#1a1a1a" : "#f5f5f5",
    card: isDark ? "#2a2a2a" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#666",
    border: isDark ? "#333" : "#eee",
    gasto: { text: "#b91c1c", bg: "#fee2e2" },
    ingreso: { text: "#15803d", bg: "#dcfce7" },
  };

  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);

  useFocusEffect(
    useCallback(() => {
      setTransacciones(obtenerTransacciones());
    }, []),
  );

  const formatImporte = (importe: number, tipo: Transaccion["tipo"]) => {
    const signo = tipo === "gasto" ? "-" : "+";
    return `${signo}${importe.toFixed(2)} €`;
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderItem = ({ item }: { item: Transaccion }) => {
    const c = item.tipo === "gasto" ? colors.gasto : colors.ingreso;
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.badgeText, { color: c.text }]}>
              {item.tipo === "gasto" ? "📉" : "📈"} {item.tipo}
            </Text>
          </View>
          <Text style={[styles.categoria, { color: colors.text }]}>
            {item.categoria}
          </Text>
          {item.concepto && (
            <Text style={[styles.concepto, { color: colors.subtext }]}>
              {item.concepto}
            </Text>
          )}
          <Text style={[styles.fecha, { color: colors.subtext }]}>
            {formatFecha(item.fecha)}
          </Text>
        </View>
        <Text style={[styles.importe, { color: c.text }]}>
          {formatImporte(item.importe, item.tipo)}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🪙</Text>
      <Text style={[styles.emptyText, { color: colors.subtext }]}>
        Aún no hay transacciones
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transacciones}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardLeft: {
    flex: 1,
    gap: 3,
    marginRight: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  categoria: {
    fontSize: 15,
    fontWeight: "600",
  },
  concepto: {
    fontSize: 13,
  },
  fecha: {
    fontSize: 12,
    marginTop: 2,
  },
  importe: {
    fontSize: 17,
    fontWeight: "700",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
  },
});
