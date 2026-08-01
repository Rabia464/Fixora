"use client"
import React, { useRef } from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: 'mint' | 'cyan' | 'yellow' | 'coral' | 'purple';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  accent,
  onClick,
  onMouseMove,
  ...props 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const accentClass = accent ? styles[`${accent}Accent`] : '';
  const clickableStyle = onClick ? { cursor: 'pointer' } : {};

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardRef.current.style.setProperty('--mouse-x', `${x}px`);
      cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
    if (onMouseMove) onMouseMove(e);
  };

  return (
    <div 
      ref={cardRef}
      className={`${styles.card} ${accentClass} ${className}`} 
      style={{ ...clickableStyle, ...props.style }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </div>
  );
};
