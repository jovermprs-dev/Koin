import { useAppColors } from "@/hooks/useAppColors";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Modo = "login" | "registro";

export default function LoginScreen() {
  const colors = useAppColors();
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limpiarError = () => setError(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Introduce email y contraseña");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    setError(null);

    if (modo === "login") {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        { email: email.trim(), password },
      );
      setCargando(false);
      if (authError) {
        setError(traduccirError(authError.message));
        return;
      }
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError("Confirma tu email antes de entrar. Revisa tu bandeja de entrada.");
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signUp(
        { email: email.trim(), password },
      );
      setCargando(false);
      if (authError) {
        setError(traduccirError(authError.message));
        return;
      }
      setError("Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada.");
    }
    // Si login sin error, onAuthStateChange en _layout.tsx detecta la sesión y redirige
  };

  const cambiarModo = (nuevoModo: Modo) => {
    setModo(nuevoModo);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        {/* Logo / título */}
        <Text style={[styles.logo, { color: colors.tint }]}>💰 Koin</Text>
        <Text style={[styles.subtitulo, { color: colors.subtext }]}>
          Tu finanzas personales
        </Text>

        {/* Selector de modo */}
        <View
          style={[styles.modoSelector, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}
        >
          {(["login", "registro"] as Modo[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modoBtn,
                modo === m && { backgroundColor: colors.tint },
              ]}
              onPress={() => cambiarModo(m)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modoBtnText,
                  { color: modo === m ? "#fff" : colors.subtext },
                ]}
              >
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulario */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              placeholder="tu@email.com"
              placeholderTextColor={colors.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); limpiarError(); }}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.subtext }]}>Contraseña</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); limpiarError(); }}
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.tint }, cargando && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {modo === "login" ? "Entrar" : "Crear cuenta"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function traduccirError(mensaje: string): string {
  if (mensaje.includes("Invalid login credentials"))
    return "Email o contraseña incorrectos";
  if (mensaje.includes("Email not confirmed"))
    return "Confirma tu email antes de entrar";
  if (mensaje.includes("User already registered"))
    return "Ya existe una cuenta con este email";
  if (mensaje.includes("Password should be"))
    return "La contraseña debe tener al menos 6 caracteres";
  return "Ha ocurrido un error. Inténtalo de nuevo";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },
  logo: { fontSize: 40, fontWeight: "800", textAlign: "center" },
  subtitulo: { fontSize: 14, textAlign: "center", marginTop: -12 },
  modoSelector: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  modoBtnText: { fontSize: 14, fontWeight: "600" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: { fontSize: 13, textAlign: "center" },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
