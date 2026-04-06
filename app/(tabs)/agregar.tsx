import { guardarTransaccion } from "@/db/database";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type Tipo = "gasto" | "ingreso";

interface FormData {
  importe: string;
  tipo: Tipo;
  categoria: string;
  concepto: string;
}

interface FormErrors {
  importe?: string;
  categoria?: string;
}

export default function AgregarScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#666",
    background: isDark ? "#1a1a1a" : "#f5f5f5",
    card: isDark ? "#2a2a2a" : "#fff",
    border: isDark ? "#444" : "#ddd",
    inputBg: isDark ? "#333" : "#fafafa",
    errorBorder: "#e53e3e",
    errorText: "#e53e3e",
    gasto: { bg: "#fee2e2", text: "#b91c1c", active: "#ef4444" },
    ingreso: { bg: "#dcfce7", text: "#15803d", active: "#22c55e" },
  };

  const [form, setForm] = useState<FormData>({
    importe: "",
    tipo: "gasto",
    categoria: "",
    concepto: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (
      !form.importe ||
      isNaN(Number(form.importe)) ||
      Number(form.importe) <= 0
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
    guardarTransaccion(
      form.tipo,
      form.categoria,
      Number(form.importe),
      new Date().toISOString(),
      form.concepto == "" ? null : form.concepto,
    );
    Alert.alert(
      "Guardado",
      `${form.tipo === "gasto" ? "Gasto" : "Ingreso"} de ${Number(form.importe).toFixed(2)} € guardado correctamente.`,
      [
        {
          text: "OK",
          onPress: () =>
            setForm({
              importe: "",
              tipo: "gasto",
              categoria: "",
              concepto: "",
            }),
        },
      ],
    );
  };

  const tipoActivo = form.tipo === "gasto" ? colors.gasto : colors.ingreso;

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
              borderColor: errors.importe ? colors.errorBorder : colors.border,
            },
          ]}
        >
          <Text style={[styles.currency, { color: colors.subtext }]}>€</Text>
          <TextInput
            style={[styles.importeInput, { color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.subtext}
            keyboardType="decimal-pad"
            value={form.importe}
            onChangeText={(v) => update("importe", v)}
          />
        </View>
        {errors.importe && (
          <Text style={styles.errorText}>{errors.importe}</Text>
        )}
      </View>

      {/* Tipo */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.subtext }]}>Tipo</Text>
        <View style={styles.tipoRow}>
          {(["gasto", "ingreso"] as Tipo[]).map((t) => {
            const isActive = form.tipo === t;
            const c = t === "gasto" ? colors.gasto : colors.ingreso;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tipoBtn,
                  {
                    borderColor: isActive ? c.active : colors.border,
                    backgroundColor: isActive ? c.bg : colors.card,
                  },
                ]}
                onPress={() => update("tipo", t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipoEmoji]}>
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
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.inputBg,
              borderColor: errors.categoria
                ? colors.errorBorder
                : colors.border,
            },
          ]}
          placeholder="Ej: Alimentación, Nómina…"
          placeholderTextColor={colors.subtext}
          value={form.categoria}
          onChangeText={(v) => update("categoria", v)}
        />
        {errors.categoria && (
          <Text style={styles.errorText}>{errors.categoria}</Text>
        )}
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
              borderColor: colors.border,
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
        <Text style={styles.submitText}>Guardar {form.tipo}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  fieldGroup: {
    marginBottom: 20,
  },
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
  optional: {
    fontSize: 12,
    fontStyle: "italic",
  },
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
  currency: {
    fontSize: 18,
    marginRight: 6,
  },
  importeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 12,
  },
  tipoRow: {
    flexDirection: "row",
    gap: 12,
  },
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
  tipoEmoji: {
    fontSize: 18,
  },
  tipoLabel: {
    fontSize: 16,
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 12,
    marginTop: 4,
  },
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
