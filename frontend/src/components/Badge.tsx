import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, status = 'neutral', className = '' }) => {
  return (
    <span className={`${styles.badge} ${styles[status]} ${className}`}>
      {children}
    </span>
  );
};
