import { useState, useEffect } from "react";

/**
 * Debounce a value — delays updating until user stops typing
 * @param {any}    value - the value to debounce
 * @param {number} delay - milliseconds to wait (default 400ms)
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
