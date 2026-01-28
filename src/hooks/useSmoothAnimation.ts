/**
 * React hooks for smooth animations
 * Provides easy-to-use smooth animation utilities for components
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    rafThrottle,
    springAnimation,
    smoothLerp,
    prefersReducedMotion,
    getOptimalDuration
} from '../utils/performance';

/**
 * Hook for smooth spring-based number transitions
 */
export function useSpringValue(
    target: number,
    options: {
        stiffness?: number;
        damping?: number;
        mass?: number;
    } = {}
): number {
    const [value, setValue] = useState(target);
    const animationRef = useRef<{ stop: () => void } | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip animation on first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            setValue(target);
            return;
        }

        // Skip animation if reduced motion is preferred
        if (prefersReducedMotion()) {
            setValue(target);
            return;
        }

        // Stop any existing animation
        animationRef.current?.stop();

        // Start new spring animation
        animationRef.current = springAnimation(
            value,
            target,
            setValue,
            options
        );

        return () => {
            animationRef.current?.stop();
        };
    }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

    return value;
}

/**
 * Hook for smooth mouse/pointer position tracking
 */
export function useSmoothMousePosition(smoothing = 0.15): { x: number; y: number } {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = rafThrottle((e: MouseEvent) => {
            targetRef.current = { x: e.clientX, y: e.clientY };
        });

        const animate = (currentTime: number) => {
            const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16.67;
            lastTimeRef.current = currentTime;

            setPosition(prev => ({
                x: smoothLerp(prev.x, targetRef.current.x, smoothing, deltaTime),
                y: smoothLerp(prev.y, targetRef.current.y, smoothing, deltaTime)
            }));

            animationRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [smoothing]);

    return position;
}

/**
 * Hook for smooth scroll position tracking
 */
export function useSmoothScrollPosition(
    elementRef?: React.RefObject<HTMLElement>,
    smoothing = 0.2
): { scrollX: number; scrollY: number } {
    const [position, setPosition] = useState({ scrollX: 0, scrollY: 0 });
    const targetRef = useRef({ scrollX: 0, scrollY: 0 });
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const element = elementRef?.current ?? window;

        const handleScroll = rafThrottle(() => {
            if (element === window) {
                targetRef.current = { scrollX: window.scrollX, scrollY: window.scrollY };
            } else {
                const el = element as HTMLElement;
                targetRef.current = { scrollX: el.scrollLeft, scrollY: el.scrollTop };
            }
        });

        const animate = (currentTime: number) => {
            const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16.67;
            lastTimeRef.current = currentTime;

            setPosition(prev => ({
                scrollX: smoothLerp(prev.scrollX, targetRef.current.scrollX, smoothing, deltaTime),
                scrollY: smoothLerp(prev.scrollY, targetRef.current.scrollY, smoothing, deltaTime)
            }));

            animationRef.current = requestAnimationFrame(animate);
        };

        element.addEventListener('scroll', handleScroll, { passive: true });
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            element.removeEventListener('scroll', handleScroll);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [elementRef, smoothing]);

    return position;
}

/**
 * Hook for respecting reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
    const [prefersReduced, setPrefersReduced] = useState(() => prefersReducedMotion());

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReduced(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReduced;
}

/**
 * Hook that returns optimal animation duration based on user preferences
 */
export function useOptimalDuration(baseDuration: number): number {
    const prefersReduced = usePrefersReducedMotion();
    return prefersReduced ? 0 : baseDuration;
}

/**
 * Hook for smooth hover state transitions
 */
export function useSmoothHover(): {
    isHovered: boolean;
    hoverProgress: number;
    handlers: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
} {
    const [isHovered, setIsHovered] = useState(false);
    const hoverProgress = useSpringValue(isHovered ? 1 : 0, {
        stiffness: 300,
        damping: 30
    });

    const handlers = {
        onMouseEnter: useCallback(() => setIsHovered(true), []),
        onMouseLeave: useCallback(() => setIsHovered(false), [])
    };

    return { isHovered, hoverProgress, handlers };
}

/**
 * Hook for smooth visibility transitions (for dropdowns, tooltips, etc.)
 */
export function useSmoothVisibility(
    isVisible: boolean,
    duration = 150
): {
    shouldRender: boolean;
    opacity: number;
    transform: string;
} {
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [opacity, setOpacity] = useState(isVisible ? 1 : 0);
    const [transform, setTransform] = useState(isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-4px)');
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        if (isVisible) {
            setShouldRender(true);
            // Small delay to ensure DOM is ready
            animationRef.current = requestAnimationFrame(() => {
                setOpacity(1);
                setTransform('scale(1) translateY(0)');
            });
        } else {
            setOpacity(0);
            setTransform('scale(0.95) translateY(-4px)');
            // Delay unmount until animation completes
            const timeout = setTimeout(() => {
                setShouldRender(false);
            }, getOptimalDuration(duration));
            return () => clearTimeout(timeout);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isVisible, duration]);

    return { shouldRender, opacity, transform };
}
