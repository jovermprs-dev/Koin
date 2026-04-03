import { StyleSheet, Text, useColorScheme, View } from "react-native";

export default function ResumenScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === "dark" ? "#fff" : "#000";

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Resumen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
