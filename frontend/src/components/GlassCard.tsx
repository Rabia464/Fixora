import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style }) => {
  return (
    <div className={`glass-panel ${styles.card} ${className}`} style={style}>
      {children}
    </div>
  );
};
