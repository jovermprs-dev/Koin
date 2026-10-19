import { Linking, StyleSheet, Text, View } from "react-native";

import { DEMO_LINKS } from "@/lib/demo";

/** Notice shown on top of every screen in the public demo build. */
export default function DemoBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        <Text style={styles.bold}>Modo demostración.</Text> Los datos son ficticios y no hay servidor: puedes añadir o borrar
        movimientos para probarlo, pero los cambios solo viven en tu navegador y se pierden al recargar.
      </Text>
      <Text style={styles.text}>
        ¿Quieres usarla de verdad? Descarga el{" "}
        <Text accessibilityRole="link" style={styles.link} onPress={() => Linking.openURL(DEMO_LINKS.repository)}>
          repositorio en GitHub
        </Text>{" "}
        o{" "}
        <Text accessibilityRole="link" style={styles.link} onPress={() => Linking.openURL(DEMO_LINKS.portfolio)}>
          escríbeme desde mi portafolio
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#fef3c7",
    borderBottomColor: "#fcd34d",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  text: { color: "#78350f", fontSize: 13, lineHeight: 19 },
  bold: { fontWeight: "700" },
  link: { color: "#78350f", fontWeight: "600", textDecorationLine: "underline" },
});
