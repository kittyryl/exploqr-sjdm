"use client";

import { useCallback, useEffect, useState } from "react";

// Shared by ThemeProvider and LocaleProvider: both persist one choice from a
// fixed set of allowed values to localStorage, restoring it after mount
// (the page is fully static, so nothing is known before that).
export function usePersistentChoice<T extends string>(
  storageKey: string,
  allowedValues: readonly T[],
  defaultValue: T
): [T, (next: T) => void] {
  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved && (allowedValues as readonly string[]).includes(saved)) {
      setValueState(saved as T);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setValue = useCallback(
    (next: T) => {
      if (!allowedValues.includes(next)) return;
      localStorage.setItem(storageKey, next);
      setValueState(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey]
  );

  return [value, setValue];
}
