import {
  eliminarTransaccion,
  obtenerRemoteIdTransaccion,
  obtenerTransacciones,
  Transaccion,
} from "@/db/database";
import { useAppColors } from "@/hooks/useAppColors";
import { eliminarTransaccionRemota } from "@/lib/sync";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// ── Animación del botón eliminar ─────────────────────────────────────────────

function AccionEliminar({
  prog,
  onPress,
}: {
  prog: SharedValue<number>;
  onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 1], [0, 1]),
    transform: [{ translateX: interpolate(prog.value, [0, 1], [80, 0]) }],
  }));

  return (
    <Animated.View style={[styles.accionWrapper, animStyle]}>
      <TouchableOpacity
        style={styles.accionBtn}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.accionEmoji}>🗑️</Text>
        <Text style={styles.accionLabel}>Eliminar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Fila con su propio ref ───────────────────────────────────────────────────

type FilaProps = {
  item: Transaccion;
  colors: ReturnType<typeof useAppColors>;
  onEliminar: (id: number) => void;
  onOpen: (id: number) => void;
  registerRef: (id: number, ref: SwipeableMethods | null) => void;
  onEditar: (id: number) => void;
};

function FilaTransaccion({
  item,
  colors,
  onEliminar,
  onOpen,
  registerRef,
  onEditar,
}: FilaProps) {
  const swipeRef = useRef<SwipeableMethods>(null);

  useEffect(() => {
    registerRef(item.id, swipeRef.current);
    return () => registerRef(item.id, null);
  }, [item.id]);

  const c = item.tipo === "gasto" ? colors.gasto : colors.ingreso;

  const formatImporte = (importe: number, tipo: Transaccion["tipo"]) =>
    `${tipo === "gasto" ? "-" : "+"}${importe.toFixed(2)} €`;

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={(prog) => (
        <AccionEliminar prog={prog} onPress={() => onEliminar(item.id)} />
      )}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableWillOpen={() => onOpen(item.id)}
    >
      <TouchableOpacity
        onPress={() => onEditar(item.id)}
        activeOpacity={0.8}
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
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

// ── Pantalla principal ───────────────────────────────────────────────────────

export default function TransaccionesScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const swipeableRefs = useRef<Map<number, SwipeableMethods>>(new Map());

  const registerRef = useCallback(
    (id: number, ref: SwipeableMethods | null) => {
      if (ref) swipeableRefs.current.set(id, ref);
      else swipeableRefs.current.delete(id);
    },
    [],
  );

  const closeAll = useCallback(() => {
    swipeableRefs.current.forEach((ref) => ref.close());
  }, []);

  useFocusEffect(
    useCallback(() => {
      setTransacciones(obtenerTransacciones());
      closeAll();
    }, []),
  );

  const handleEliminar = useCallback((id: number) => {
    const remoteId = obtenerRemoteIdTransaccion(id);
    eliminarTransaccion(id);
    setTransacciones((prev) => prev.filter((t) => t.id !== id));
    swipeableRefs.current.delete(id);
    if (remoteId) eliminarTransaccionRemota(remoteId).catch(console.warn);
  }, []);

  const handleOpen = useCallback((id: number) => {
    swipeableRefs.current.forEach((ref, refId) => {
      if (refId !== id) ref.close();
    });
  }, []);

  const handleEditar = useCallback((id: number) => {
    router.push(`/agregar?id=${id}`);
  }, []);

  const renderItem = ({ item }: { item: Transaccion }) => (
    <FilaTransaccion
      item={item}
      colors={colors}
      onEliminar={handleEliminar}
      onOpen={handleOpen}
      registerRef={registerRef}
      onEditar={handleEditar}
    />
  );

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
  container: { flex: 1 },
  list: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardLeft: { flex: 1, gap: 3, marginRight: 12 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  categoria: { fontSize: 15, fontWeight: "600" },
  concepto: { fontSize: 13 },
  fecha: { fontSize: 12, marginTop: 2 },
  importe: { fontSize: 17, fontWeight: "700" },
  accionWrapper: { justifyContent: "center", marginLeft: 10 },
  accionBtn: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    height: "100%",
    borderRadius: 12,
    gap: 4,
  },
  accionEmoji: { fontSize: 20 },
  accionLabel: { color: "#fff", fontSize: 11, fontWeight: "700" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16 },
});
