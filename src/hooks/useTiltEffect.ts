import { useRef, useCallback, useState } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

export const useTiltEffect = (intensity: number = 10) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tiltState, setTiltState] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateX = (mouseY / (rect.height / 2)) * -intensity;
    const rotateY = (mouseX / (rect.width / 2)) * intensity;

    setTiltState({
      rotateX,
      rotateY,
      scale: 1.02,
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setTiltState({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
    });
  }, []);

  const style = {
    transform: `perspective(1000px) rotateX(${tiltState.rotateX}deg) rotateY(${tiltState.rotateY}deg) scale(${tiltState.scale})`,
    transition: 'transform 0.15s ease-out',
  };

  return {
    ref,
    style,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
};
