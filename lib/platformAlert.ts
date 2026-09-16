import { Alert, Platform } from "react-native";

/**
 * Single-button informational alert. react-native-web's Alert doesn't
 * support button press callbacks, so on web this just runs `onOk`
 * immediately instead of waiting for a tap that would never register.
 */
export function alertOk(title: string, message: string, onOk?: () => void): void {
  if (Platform.OS === "web") {
    onOk?.();
    return;
  }
  Alert.alert(title, message, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
}

/**
 * Destructive confirm dialog (e.g. "sign out?"). Falls back to
 * window.confirm on web for the same reason as alertOk.
 */
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
): void {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
