import { CATEGORIAS } from "@/constants/Categorias";
import { useAppColors } from "@/hooks/useAppColors";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  selected: string;
  onSelect: (nombre: string) => void;
  error?: string;
};

export default function CategoryPicker({ selected, onSelect, error }: Props) {
  const colors = useAppColors();

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
                  backgroundColor: isActive ? colors.chipActiveBg : colors.chipBg,
                  borderColor: isActive
                    ? colors.tint
                    : error && !selected
                    ? colors.error
                    : colors.inputBorder,
                },
              ]}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: isActive ? colors.chipActiveText : colors.chipText },
                ]}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
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
