import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay.
 * Returns the debounced value which only updates after
 * the user stops changing it for `delay` ms.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
