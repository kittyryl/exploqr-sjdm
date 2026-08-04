"use client";

import { useCallback, useEffect, useState } from "react";

// Used to remember one saved choice (like theme or language) in the browser
// so it's still set the next time someone visits.
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
