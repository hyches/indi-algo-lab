import React from 'react';
import { useTiltEffect } from '@/hooks/useTiltEffect';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowOnHover?: boolean;
  onClick?: () => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  intensity = 8,
  glowOnHover = true,
  onClick,
}) => {
  const { ref, style, handlers } = useTiltEffect(intensity);

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        'glass-card p-4 cursor-pointer',
        glowOnHover && 'hover:glow-primary',
        className
      )}
      onClick={onClick}
      {...handlers}
    >
      <div className="tilt-card-inner">{children}</div>
    </div>
  );
};
