import { Error as ErrorColor, Gasto, Ingreso, Tint } from "@/constants/Colors";
import { useColorScheme } from "react-native";

export function useAppColors() {
  const isDark = useColorScheme() === "dark";
  return {
    background: isDark ? "#1a1a1a" : "#f5f5f5",
    card: isDark ? "#2a2a2a" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#666",
    border: isDark ? "#333" : "#eee",
    inputBg: isDark ? "#333" : "#fafafa",
    inputBorder: isDark ? "#444" : "#ddd",
    chipBg: isDark ? "#2a2a2a" : "#f0f0f0",
    chipText: isDark ? "#ccc" : "#555",
    chipActiveBg: isDark ? "#1d4ed8" : "#dbeafe",
    chipActiveText: isDark ? "#93c5fd" : "#1d4ed8",
    tint: Tint,
    error: ErrorColor,
    gasto: Gasto,
    ingreso: Ingreso,
  };
}
