import { useEffect, useState } from "react";
import { Appearance, useColorScheme as useRNColorScheme } from "react-native";

/**
 * On the static web export, the very first read of Appearance.getColorScheme()
 * during hydration can return the wrong value even though the browser's
 * prefers-color-scheme already matches — and since react-native-web's
 * useColorScheme only updates on a live 'change' event, a component that
 * mounts once (e.g. the initial route) and never sees an actual OS theme
 * switch stays stuck on that first, wrong read.
 *
 * This wraps it with one extra direct check right after mount, which
 * self-corrects that stale read, while still tracking `live` for any real
 * theme change that happens afterwards.
 */
export function useColorScheme() {
  const live = useRNColorScheme();
  const [resolved, setResolved] = useState(live);

  useEffect(() => {
    setResolved(live);
  }, [live]);

  useEffect(() => {
    setResolved(Appearance.getColorScheme());
    // Mount-only: corrects a stale initial read; later changes are
    // already covered by the effect above reacting to `live`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return resolved;
}
