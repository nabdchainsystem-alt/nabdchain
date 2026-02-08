import React, { useState, useRef, useEffect, Suspense } from 'react';

interface LazyDashboardProps {
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  props?: Record<string, unknown>;
  height?: string;
}

// Delayed spinner - only shows after delay to prevent flash
const DelayedSpinner: React.FC<{ delay?: number }> = ({ delay = 200 }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />;
};

/**
 * Lazy loads dashboard components when they become visible in the viewport.
 * Uses IntersectionObserver for efficient visibility detection.
 * Delayed loading indicators prevent flash on fast loads.
 */
export const LazyDashboard: React.FC<LazyDashboardProps> = ({ component: Component, props = {}, height = '400px' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        rootMargin: '0px', // Only load when actually visible
        threshold: 0.01,
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : height }}>
      {isVisible ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8" style={{ minHeight: height }}>
              <DelayedSpinner delay={150} />
            </div>
          }
        >
          <Component {...props} />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center p-8" style={{ minHeight: height }}>
          {/* Empty placeholder - no loading text to prevent flash */}
        </div>
      )}
    </div>
  );
};
