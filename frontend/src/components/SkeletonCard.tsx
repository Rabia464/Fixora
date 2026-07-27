import React from 'react';
import styles from './SkeletonCard.module.css';

export const SkeletonCard: React.FC = () => {
  return (
    <div className={styles.skeletonCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className={styles.bone} style={{ width: '60%', height: '22px' }} />
        <div className={styles.bone} style={{ width: '25%', height: '22px', borderRadius: '12px' }} />
      </div>
      <div className={styles.bone} style={{ width: '40%', height: '14px' }} />
      <div className={styles.bone} style={{ width: '100%', height: '44px' }} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <div className={styles.bone} style={{ width: '80px', height: '20px', borderRadius: '12px' }} />
        <div className={styles.bone} style={{ width: '90px', height: '20px', borderRadius: '12px' }} />
      </div>
    </div>
  );
};
