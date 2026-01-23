/**
 * Accessibility Utilities
 * Helpers for keyboard navigation, focus management, and screen reader support
 */

/**
 * Focus trap - keeps focus within a container (for modals, dialogs)
 */
export function createFocusTrap(container: HTMLElement): {
    activate: () => void;
    deactivate: () => void;
} {
    const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
    ].join(',');

    let previouslyFocused: HTMLElement | null = null;

    const getFocusableElements = () =>
        Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return {
        activate: () => {
            previouslyFocused = document.activeElement as HTMLElement;
            container.addEventListener('keydown', handleKeyDown);

            // Focus first focusable element
            const focusable = getFocusableElements();
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        },
        deactivate: () => {
            container.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus();
        },
    };
}

/**
 * Announce message to screen readers
 */
export function announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
): void {
    const id = 'sr-announcer';
    let announcer = document.getElementById(id);

    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = id;
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        // Screen reader only styles
        Object.assign(announcer.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
        });
        document.body.appendChild(announcer);
    }

    announcer.setAttribute('aria-live', priority);
    // Clear and set to trigger announcement
    announcer.textContent = '';
    requestAnimationFrame(() => {
        announcer!.textContent = message;
    });
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix = 'aria'): string {
    return `${prefix}-${++idCounter}`;
}

/**
 * Skip link for keyboard users
 */
export function setupSkipLinks(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    Object.assign(skipLink.style, {
        position: 'absolute',
        top: '-40px',
        left: '0',
        background: '#000',
        color: '#fff',
        padding: '8px 16px',
        zIndex: '10000',
        transition: 'top 0.2s',
    });

    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Roving tabindex for lists/grids
 */
export function createRovingTabindex(
    container: HTMLElement,
    selector: string,
    options: {
        orientation?: 'horizontal' | 'vertical' | 'both';
        loop?: boolean;
        onSelect?: (element: HTMLElement) => void;
    } = {}
): () => void {
    const { orientation = 'vertical', loop = true, onSelect } = options;

    const getItems = () =>
        Array.from(container.querySelectorAll<HTMLElement>(selector));

    const setTabIndex = (items: HTMLElement[], activeIndex: number) => {
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
        });
    };

    let currentIndex = 0;
    const items = getItems();
    setTabIndex(items, currentIndex);

    const handleKeyDown = (event: KeyboardEvent) => {
        const items = getItems();
        if (items.length === 0) return;

        let newIndex = currentIndex;
        const isHorizontal = orientation === 'horizontal' || orientation === 'both';
        const isVertical = orientation === 'vertical' || orientation === 'both';

        switch (event.key) {
            case 'ArrowDown':
                if (isVertical) {
                    event.preventDefault();
                    newIndex = loop
                        ? (currentIndex + 1) % items.length
                        : Math.min(currentIndex + 1, items.length - 1);
                }
                break;
            case 'ArrowUp':
                if (isVertical) {
                    event.preventDefault();
                    newIndex = loop
                        ? (currentIndex - 1 + items.length) % items.length
                        : Math.max(currentIndex - 1, 0);
                }
                break;
            case 'ArrowRight':
                if (isHorizontal) {
                    event.preventDefault();
                    newIndex = loop
                        ? (currentIndex + 1) % items.length
                        : Math.min(currentIndex + 1, items.length - 1);
                }
                break;
            case 'ArrowLeft':
                if (isHorizontal) {
                    event.preventDefault();
                    newIndex = loop
                        ? (currentIndex - 1 + items.length) % items.length
                        : Math.max(currentIndex - 1, 0);
                }
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = items.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                onSelect?.(items[currentIndex]);
                return;
        }

        if (newIndex !== currentIndex) {
            currentIndex = newIndex;
            setTabIndex(items, currentIndex);
            items[currentIndex].focus();
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Update on focus
    const handleFocus = (event: FocusEvent) => {
        const items = getItems();
        const index = items.indexOf(event.target as HTMLElement);
        if (index !== -1) {
            currentIndex = index;
            setTabIndex(items, currentIndex);
        }
    };

    container.addEventListener('focusin', handleFocus);

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
        container.removeEventListener('focusin', handleFocus);
    };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Focus visible polyfill helper
 */
export function shouldShowFocusRing(event: FocusEvent): boolean {
    const target = event.target as HTMLElement;
    // Show focus ring for keyboard navigation, hide for mouse clicks
    try {
        return target.matches(':focus-visible');
    } catch {
        // Fallback for browsers without :focus-visible
        return true;
    }
}

/**
 * ARIA live region manager
 */
export class LiveRegion {
    private element: HTMLElement;

    constructor(
        id: string,
        politeness: 'polite' | 'assertive' = 'polite'
    ) {
        this.element = document.createElement('div');
        this.element.id = id;
        this.element.setAttribute('aria-live', politeness);
        this.element.setAttribute('aria-atomic', 'true');
        this.element.setAttribute('role', 'status');
        Object.assign(this.element.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
        });
        document.body.appendChild(this.element);
    }

    announce(message: string): void {
        this.element.textContent = '';
        requestAnimationFrame(() => {
            this.element.textContent = message;
        });
    }

    destroy(): void {
        this.element.remove();
    }
}

export const a11y = {
    createFocusTrap,
    announce,
    generateId,
    setupSkipLinks,
    createRovingTabindex,
    prefersReducedMotion,
    prefersHighContrast,
    shouldShowFocusRing,
    LiveRegion,
};

export default a11y;
