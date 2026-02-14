import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element.
 * Unlike the root useClickOutside (which takes a ref), this version
 * creates and returns its own ref — more convenient for portal components.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true,
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler, enabled]);

  return ref;
}

/**
 * Hook to detect escape key press
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handler, enabled]);
}

/**
 * Combined hook for both click outside and escape key
 */
export function useDropdownClose<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true,
): RefObject<T> {
  useEscapeKey(handler, enabled);
  return useClickOutside<T>(handler, enabled);
}

export default useClickOutside;
