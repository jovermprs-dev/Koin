import CategoryPicker from "@/components/CategoryPicker";
import { Progreso } from "@/constants/Colors";
import {
  actualizarPresupuesto,
  eliminarPresupuesto,
  obtenerPresupuestosConGasto,
  obtenerRemoteIdPresupuesto,
  guardarPresupuesto,
  PresupuestoConGasto,
} from "@/db/database";
import { useAppColors } from "@/hooks/useAppColors";
import { eliminarPresupuestoRemoto, sincronizar } from "@/lib/sync";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import AnimatedRN, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// ── Helpers ──────────────────────────────────────────────────────────────────

function colorPresupuesto(gastado: number, limite: number) {
  const pct = limite > 0 ? gastado / limite : 0;
  if (pct >= 1) return Progreso.critico;
  if (pct >= 0.75) return Progreso.advertencia;
  return Progreso.ok;
}

// ── Botón animado de eliminar ─────────────────────────────────────────────────

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
    <AnimatedRN.View style={[styles.accionWrapper, animStyle]}>
      <TouchableOpacity
        style={styles.accionBtn}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.accionEmoji}>🗑️</Text>
        <Text style={styles.accionLabel}>Eliminar</Text>
      </TouchableOpacity>
    </AnimatedRN.View>
  );
}

// ── Fila de presupuesto ───────────────────────────────────────────────────────

type FilaProps = {
  item: PresupuestoConGasto;
  colors: ReturnType<typeof useAppColors>;
  onEliminar: (id: number) => void;
  onEditar: (item: PresupuestoConGasto) => void;
  onOpen: (id: number) => void;
  registerRef: (id: number, ref: SwipeableMethods | null) => void;
};

function FilaPresupuesto({
  item,
  colors,
  onEliminar,
  onEditar,
  onOpen,
  registerRef,
}: FilaProps) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const pct = item.limite > 0 ? item.gastado / item.limite : 0;
  const c = colorPresupuesto(item.gastado, item.limite);

  useEffect(() => {
    registerRef(item.id, swipeRef.current);
    return () => registerRef(item.id, null);
  }, [item.id]);

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
        onPress={() => onEditar(item)}
        activeOpacity={0.8}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.categoria, { color: colors.text }]}>
            {item.categoria}
          </Text>
          <Text style={[styles.importes, { color: colors.subtext }]}>
            {item.gastado.toFixed(2)} / {item.limite.toFixed(2)} €
          </Text>
        </View>

        <View
          style={[styles.barraFondo, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.barraRelleno,
              {
                backgroundColor: c.bar,
                width: `${Math.min(pct * 100, 100)}%`,
              },
            ]}
          />
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: c.badge }]}>
            <Text style={[styles.badgeText, { color: c.text }]}>
              {Math.round(pct * 100)}%
            </Text>
          </View>
          {pct >= 1 && (
            <Text style={[styles.excedido, { color: c.text }]}>
              Límite superado
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

const FORM_HEIGHT = 260;

export default function PresupuestosScreen() {
  const colors = useAppColors();
  const [presupuestos, setPresupuestos] = useState<PresupuestoConGasto[]>([]);

  const [formularioVisible, setFormularioVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formCategoria, setFormCategoria] = useState("");
  const [formLimite, setFormLimite] = useState("");
  const [errors, setErrors] = useState<{ categoria?: string; limite?: string }>(
    {},
  );

  const alturaForm = useRef(new Animated.Value(0)).current;
  const swipeableRefs = useRef<Map<number, SwipeableMethods>>(new Map());

  const cargar = useCallback(() => {
    setPresupuestos(obtenerPresupuestosConGasto());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      swipeableRefs.current.forEach((ref) => ref.close());
    }, []),
  );

  // ── Animación del formulario ────────────────────────────────────────────────

  const abrirFormulario = useCallback(() => {
    setFormularioVisible(true);
    Animated.timing(alturaForm, {
      toValue: FORM_HEIGHT,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [alturaForm]);

  const cerrarFormulario = useCallback(() => {
    Animated.timing(alturaForm, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setFormularioVisible(false);
      setEditandoId(null);
      setFormCategoria("");
      setFormLimite("");
      setErrors({});
    });
  }, [alturaForm]);

  // ── Gestión del swipeable ───────────────────────────────────────────────────

  const registerRef = useCallback(
    (id: number, ref: SwipeableMethods | null) => {
      if (ref) swipeableRefs.current.set(id, ref);
      else swipeableRefs.current.delete(id);
    },
    [],
  );

  const handleOpen = useCallback((id: number) => {
    swipeableRefs.current.forEach((ref, refId) => {
      if (refId !== id) ref.close();
    });
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleEliminar = useCallback((id: number) => {
    const remoteId = obtenerRemoteIdPresupuesto(id);
    eliminarPresupuesto(id);
    setPresupuestos((prev) => prev.filter((p) => p.id !== id));
    swipeableRefs.current.delete(id);
    if (remoteId) eliminarPresupuestoRemoto(remoteId).catch(console.warn);
  }, []);

  const handleEditar = useCallback(
    (item: PresupuestoConGasto) => {
      setEditandoId(item.id);
      setFormCategoria(item.categoria);
      setFormLimite(item.limite.toString());
      setErrors({});
      abrirFormulario();
    },
    [abrirFormulario],
  );

  const validar = (): boolean => {
    const newErrors: { categoria?: string; limite?: string } = {};
    if (!formCategoria.trim()) {
      newErrors.categoria = "La categoría es obligatoria";
    }
    if (!formLimite || isNaN(Number(formLimite)) || Number(formLimite) <= 0) {
      newErrors.limite = "Introduce un límite válido mayor que 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = () => {
    if (!validar()) return;

    try {
      if (editandoId !== null) {
        actualizarPresupuesto(editandoId, formCategoria, Number(formLimite));
      } else {
        guardarPresupuesto(formCategoria, Number(formLimite));
      }
      sincronizar().catch(console.warn);
      cargar();
      cerrarFormulario();
    } catch {
      setErrors({ categoria: "Ya existe un presupuesto para esta categoría" });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: PresupuestoConGasto }) => (
    <FilaPresupuesto
      item={item}
      colors={colors}
      onEliminar={handleEliminar}
      onEditar={handleEditar}
      onOpen={handleOpen}
      registerRef={registerRef}
    />
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={[styles.emptyText, { color: colors.subtext }]}>
        Aún no hay presupuestos
      </Text>
      <Text style={[styles.emptyHint, { color: colors.subtext }]}>
        Pulsa "+" para añadir uno
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabecera con botón añadir */}
      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.subtext }]}>
          Este mes
        </Text>
        <TouchableOpacity
          onPress={formularioVisible ? cerrarFormulario : abrirFormulario}
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>
            {formularioVisible ? "✕" : "+"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Formulario inline animado */}
      <Animated.View
        style={[
          styles.formWrapper,
          {
            height: alturaForm,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {formularioVisible && (
          <View style={styles.formInner}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>
                Categoría
              </Text>
              <CategoryPicker
                selected={formCategoria}
                onSelect={(v) => {
                  setFormCategoria(v);
                  if (errors.categoria)
                    setErrors((prev) => ({ ...prev, categoria: undefined }));
                }}
                error={errors.categoria}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>
                Límite mensual
              </Text>
              <View
                style={[
                  styles.importeWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: errors.limite ? "#e53e3e" : colors.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.currency, { color: colors.subtext }]}>
                  €
                </Text>
                <TextInput
                  style={[styles.importeInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.subtext}
                  keyboardType="decimal-pad"
                  value={formLimite}
                  onChangeText={(v) => {
                    setFormLimite(v);
                    if (errors.limite)
                      setErrors((prev) => ({ ...prev, limite: undefined }));
                  }}
                />
              </View>
              {errors.limite && (
                <Text style={styles.errorText}>{errors.limite}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.tint }]}
              onPress={handleGuardar}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>
                {editandoId !== null ? "Actualizar" : "Guardar presupuesto"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Lista */}
      <FlatList
        data={presupuestos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 20, lineHeight: 24 },

  formWrapper: { overflow: "hidden", borderBottomWidth: 1 },
  formInner: { padding: 20, gap: 16 },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  importeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  currency: { fontSize: 16, marginRight: 6 },
  importeInput: { flex: 1, fontSize: 20, fontWeight: "600", paddingVertical: 10 },
  errorText: { color: "#e53e3e", fontSize: 12 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  list: { padding: 20, paddingBottom: 40, flexGrow: 1 },

  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoria: { fontSize: 15, fontWeight: "600", flex: 1 },
  importes: { fontSize: 13 },
  barraFondo: { height: 6, borderRadius: 3 },
  barraRelleno: { height: 6, borderRadius: 3 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  excedido: { fontSize: 12, fontWeight: "600" },

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
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16 },
  emptyHint: { fontSize: 13 },
});
