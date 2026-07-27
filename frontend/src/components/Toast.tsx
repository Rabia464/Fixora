"use client"
import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import styles from './Toast.module.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} color="var(--color-mint)" />}
          {toast.type === 'info' && <Info size={18} color="var(--color-cyan)" />}
          {toast.type === 'warning' && <AlertTriangle size={18} color="var(--color-amber)" />}
          
          <span style={{ flex: 1 }}>{toast.text}</span>
          
          <button 
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
