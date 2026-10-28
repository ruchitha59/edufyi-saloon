import { useEffect, useRef } from 'react';

const LuxuryCursor = () => {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor || window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    let frameId = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let currentX = pointerX;
    let currentY = pointerY;

    const handleMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const tick = () => {
      currentX += (pointerX - currentX) * 0.1;
      currentY += (pointerY - currentY) * 0.1;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      frameId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMove);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <div ref={cursorRef} className="luxury-cursor" aria-hidden="true" />;
};

export default LuxuryCursor;
