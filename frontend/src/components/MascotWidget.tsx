import React from 'react';
import { HelpCircle } from 'lucide-react';
import styles from './MascotWidget.module.css';

interface MascotWidgetProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MascotWidget: React.FC<MascotWidgetProps> = ({
  message,
  icon = <HelpCircle size={20} color="var(--color-cyan)" />,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.iconCircle}>
        {icon}
      </div>
      <p className={styles.text}>{message}</p>
    </div>
  );
};
