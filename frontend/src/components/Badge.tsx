import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ children, status = 'neutral' }) => {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {children}
    </span>
  );
};
