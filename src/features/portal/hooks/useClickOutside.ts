import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element
 * Used to close dropdowns, menus, panels when clicking outside
 *
 * @param handler - Callback function to run when click outside is detected
 * @param enabled - Optional boolean to enable/disable the listener (default: true)
 * @returns RefObject to attach to the target element
 *
 * @example
 * const dropdownRef = useClickOutside(() => setIsOpen(false), isOpen);
 * return <div ref={dropdownRef}>...</div>
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Ignore clicks on the element itself or its children
      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    };

    // Use mousedown for faster response (before click completes)
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
 * Used to close dropdowns, menus, panels with keyboard
 *
 * @param handler - Callback function to run when Escape is pressed
 * @param enabled - Optional boolean to enable/disable the listener (default: true)
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
 * Most common pattern for dropdowns and modals
 *
 * @param handler - Callback function to close the dropdown/modal
 * @param enabled - Whether the dropdown/modal is open
 * @returns RefObject to attach to the dropdown container
 */
export function useDropdownClose<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
): RefObject<T> {
  useEscapeKey(handler, enabled);
  return useClickOutside<T>(handler, enabled);
}

export default useClickOutside;
