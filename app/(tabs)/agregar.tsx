import CategoryPicker from "@/components/CategoryPicker";
import {
  actualizarTransaccion,
  guardarTransaccion,
  obtenerTransaccionPorId,
} from "@/db/database";
import { useAppColors } from "@/hooks/useAppColors";
import { consumirEdicionPendiente } from "@/lib/edicionPendiente";
import { parseImporte } from "@/lib/format";
import { alertOk } from "@/lib/platformAlert";
import { sincronizar } from "@/lib/sync";
import type { AgregarForm, AgregarFormErrors } from "@/types/ui";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AgregarScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const navigation = useNavigation();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const isEditing = editandoId !== null;

  const [form, setForm] = useState<AgregarForm>({
    importe: "",
    tipo: "gasto",
    categoria: "",
    concepto: "",
  });
  const [fechaOriginal, setFechaOriginal] = useState<string | null>(null);
  const [errors, setErrors] = useState<AgregarFormErrors>({});

  useFocusEffect(
    useCallback(() => {
      const pendiente = consumirEdicionPendiente();
      setEditandoId(pendiente);
      navigation.setOptions({ title: pendiente !== null ? "Editar" : "Agregar" });

      if (pendiente !== null) {
        const transaccion = obtenerTransaccionPorId(pendiente);
        if (transaccion) {
          setForm({
            importe: transaccion.importe.toString(),
            tipo: transaccion.tipo,
            categoria: transaccion.categoria,
            concepto: transaccion.concepto ?? "",
          });
          setFechaOriginal(transaccion.fecha);
        }
      } else {
        setForm({ importe: "", tipo: "gasto", categoria: "", concepto: "" });
        setFechaOriginal(null);
      }
      setErrors({});

      return () => {
        navigation.setOptions({ title: "Agregar" });
      };
    }, []),
  );

  const update = <K extends keyof AgregarForm>(
    field: K,
    value: AgregarForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: AgregarFormErrors = {};
    if (
      !form.importe ||
      isNaN(parseImporte(form.importe)) ||
      parseImporte(form.importe) <= 0
    ) {
      newErrors.importe = "Introduce un importe válido mayor que 0";
    }
    if (!form.categoria.trim()) {
      newErrors.categoria = "La categoría es obligatoria";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const concepto = form.concepto === "" ? null : form.concepto;

    if (isEditing && editandoId !== null) {
      actualizarTransaccion(
        editandoId,
        form.tipo,
        form.categoria,
        parseImporte(form.importe),
        fechaOriginal ?? new Date().toISOString(),
        concepto,
      );
      sincronizar().catch(console.warn);
      alertOk("Actualizado", "La transacción se ha actualizado.", () => router.back());
    } else {
      guardarTransaccion(
        form.tipo,
        form.categoria,
        parseImporte(form.importe),
        new Date().toISOString(),
        concepto,
      );
      sincronizar().catch(console.warn);
      alertOk(
        "Guardado",
        `${form.tipo === "gasto" ? "Gasto" : "Ingreso"} de ${parseImporte(form.importe).toFixed(2)} € guardado correctamente.`,
        () => router.replace("/(tabs)"),
      );
    }
  };

  const tipoActivo: typeof colors.gasto =
    form.tipo === "gasto" ? colors.gasto : colors.ingreso;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Importe */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.subtext }]}>Importe</Text>
        <View
          style={[
            styles.importeWrapper,
            {
              backgroundColor: colors.inputBg,
              borderColor: errors.importe ? colors.error : colors.inputBorder,
            },
          ]}
        >
          <Text style={[styles.currency, { color: colors.subtext }]}>€</Text>
          <TextInput
            style={[styles.importeInput, { color: colors.text }]}
            placeholder="0,00"
            placeholderTextColor={colors.subtext}
            keyboardType="decimal-pad"
            value={form.importe}
            onChangeText={(v) => update("importe", v)}
          />
        </View>
        {errors.importe && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.importe}
          </Text>
        )}
      </View>

      {/* Tipo */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.subtext }]}>Tipo</Text>
        <View style={styles.tipoRow}>
          {(["gasto", "ingreso"] as AgregarForm["tipo"][]).map((t) => {
            const isActive = form.tipo === t;
            const c = t === "gasto" ? colors.gasto : colors.ingreso;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tipoBtn,
                  {
                    borderColor: isActive ? c.active : colors.inputBorder,
                    backgroundColor: isActive ? c.bg : colors.card,
                  },
                ]}
                onPress={() => update("tipo", t)}
                activeOpacity={0.8}
              >
                <Text style={styles.tipoEmoji}>
                  {t === "gasto" ? "📉" : "📈"}
                </Text>
                <Text
                  style={[
                    styles.tipoLabel,
                    {
                      color: isActive ? c.text : colors.subtext,
                      fontWeight: isActive ? "700" : "400",
                    },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Categoría */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.subtext }]}>Categoría</Text>
        <CategoryPicker
          selected={form.categoria}
          onSelect={(v) => update("categoria", v)}
          error={errors.categoria}
        />
      </View>

      {/* Concepto (opcional) */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.subtext }]}>
            Concepto
          </Text>
          <Text style={[styles.optional, { color: colors.subtext }]}>
            opcional
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
          placeholder="Descripción breve…"
          placeholderTextColor={colors.subtext}
          value={form.concepto}
          onChangeText={(v) => update("concepto", v)}
        />
      </View>

      {/* Botón */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: tipoActivo.active }]}
        onPress={handleSubmit}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>
          {isEditing ? "Actualizar" : `Guardar ${form.tipo}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  fieldGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  optional: { fontSize: 12, fontStyle: "italic" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  importeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  currency: { fontSize: 18, marginRight: 6 },
  importeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 12,
  },
  tipoRow: { flexDirection: "row", gap: 12 },
  tipoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
  },
  tipoEmoji: { fontSize: 18 },
  tipoLabel: { fontSize: 16 },
  errorText: { fontSize: 12, marginTop: 4 },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
