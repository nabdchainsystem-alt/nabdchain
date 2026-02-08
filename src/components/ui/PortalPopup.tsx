import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalPopupProps {
  children: React.ReactNode;
  triggerRef?: React.RefObject<HTMLElement | null>;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  align?: 'start' | 'end' | 'center';
  side?: 'bottom' | 'top' | 'left' | 'right';
}

export const PortalPopup: React.FC<PortalPopupProps> = ({
  children,
  triggerRef,
  triggerElement,
  onClose,
  align = 'start',
  side = 'bottom',
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Resolve the actual trigger element
  // We use a getter to ensure we always get the latest one in effect, but for dependency arrays we need stable values
  const _effectiveTrigger = triggerElement || triggerRef?.current;

  useLayoutEffect(() => {
    const calculatePosition = () => {
      const trigger = triggerElement || triggerRef?.current;
      if (!trigger || !contentRef.current) return;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      const GAP = 4;
      const VIEWPORT_PADDING = 12;

      // Check for RTL mode
      const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';

      // Determine effective alignment based on RTL
      const effectiveAlign = isRTL ? (align === 'start' ? 'end' : align === 'end' ? 'start' : align) : align;

      // --- Vertical Positioning Logic (Smart Flip) ---

      // 1. Calculate potential positions
      const topWhenBelow = triggerRect.bottom + GAP;
      const topWhenAbove = triggerRect.top - contentRect.height - GAP;

      // 2. Check available space
      const spaceBelow = viewportHeight - topWhenBelow - VIEWPORT_PADDING;
      const spaceAbove = topWhenAbove - VIEWPORT_PADDING;

      // 3. Determine best side
      let finalSide = side;

      if (side === 'bottom') {
        // If requested bottom but no space, and there IS space above, flip to top
        if (spaceBelow < contentRect.height && spaceAbove > contentRect.height) {
          finalSide = 'top';
        }
      } else if (side === 'top') {
        // If requested top but no space, and there IS space below, flip to bottom
        if (spaceAbove < 0 && spaceBelow > contentRect.height) {
          finalSide = 'bottom';
        }
      }

      // 4. Calculate Top based on finalSide
      if (finalSide === 'bottom') {
        top = topWhenBelow;
      } else if (finalSide === 'top') {
        top = topWhenAbove;
      } else if (finalSide === 'right' || finalSide === 'left') {
        top = triggerRect.top;
      }

      // --- Horizontal Positioning Logic ---

      if (effectiveAlign === 'start') {
        left = triggerRect.left;
      } else if (effectiveAlign === 'end') {
        left = triggerRect.right - contentRect.width;
      } else {
        // center
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
      }

      // Adjust for side positioning (left/right) if needed
      if (finalSide === 'right') {
        left = triggerRect.right + GAP;
      } else if (finalSide === 'left') {
        left = triggerRect.left - contentRect.width - GAP;
      }

      // --- Viewport Constraints (Safety Clamps) ---

      // Horizontal Clamp
      const maxLeft = viewportWidth - contentRect.width - VIEWPORT_PADDING;
      const minLeft = VIEWPORT_PADDING;

      if (left > maxLeft) left = maxLeft;
      if (left < minLeft) left = minLeft;

      // Vertical Clamp (Final safety net if both sides fail)
      const maxTop = viewportHeight - contentRect.height - VIEWPORT_PADDING;

      // If it still goes off screen bottom, force it up
      if (top > maxTop) {
        // But wait, if we forced it up, does it go off screen top?
        // If height > viewport, align to top of viewport
        if (contentRect.height > viewportHeight) {
          top = VIEWPORT_PADDING;
        } else {
          // Otherwise align to bottom of viewport
          top = maxTop;
        }
      }
      if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;

      setCoords({ top, left });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    let resizeObserver: ResizeObserver | null = null;
    if (contentRef.current) {
      resizeObserver = new ResizeObserver(() => calculatePosition());
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [triggerElement, triggerRef, align, side, children]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] w-screen h-screen bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        ref={contentRef}
        style={{
          position: 'fixed',
          top: coords?.top ?? 0,
          left: coords?.left ?? 0,
          opacity: coords ? 1 : 0,
          visibility: coords ? 'visible' : 'hidden',
          transition: 'opacity 0.1s ease-out',
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body,
  );
};
