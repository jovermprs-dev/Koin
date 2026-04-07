import { CATEGORIAS } from "@/constants/Categorias";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  selected: string;
  onSelect: (nombre: string) => void;
  error?: string;
};

export default function CategoryPicker({ selected, onSelect, error }: Props) {
  const isDark = useColorScheme() === "dark";
  const colors = {
    border: isDark ? "#444" : "#ddd",
    chipBg: isDark ? "#2a2a2a" : "#f0f0f0",
    chipText: isDark ? "#ccc" : "#555",
    activeBg: isDark ? "#1d4ed8" : "#dbeafe",
    activeBorder: "#2f95dc",
    activeText: isDark ? "#93c5fd" : "#1d4ed8",
    errorBorder: "#e53e3e",
    errorText: "#e53e3e",
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORIAS.map((cat) => {
          const isActive = selected === cat.nombre;
          return (
            <TouchableOpacity
              key={cat.nombre}
              onPress={() => onSelect(cat.nombre)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.activeBg : colors.chipBg,
                  borderColor: isActive
                    ? colors.activeBorder
                    : error && !selected
                    ? colors.errorBorder
                    : colors.border,
                },
              ]}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: isActive ? colors.activeText : colors.chipText },
                ]}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {error && <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 15 },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 12, marginTop: 4 },
});
