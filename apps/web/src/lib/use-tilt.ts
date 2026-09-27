'use client';
import { useCallback, useRef, type PointerEvent } from 'react';

// Writes CSS vars straight to the element (rAF-throttled) so hover tilt never re-renders React.
export function useTilt<T extends HTMLElement>(max = 8) {
  const frame = useRef(0);

  const onPointerMove = useCallback((e: PointerEvent<T>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
    });
  }, [max]);

  const onPointerLeave = useCallback((e: PointerEvent<T>) => {
    cancelAnimationFrame(frame.current);
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  }, []);

  return { onPointerMove, onPointerLeave };
}
