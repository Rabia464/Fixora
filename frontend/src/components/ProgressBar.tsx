import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'mint' | 'cyan' | 'yellow' | 'coral' | 'purple' | 'orange';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'mint',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`${styles.track} ${className}`}>
      <div 
        className={`${styles.fill} ${styles[color]}`} 
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};
