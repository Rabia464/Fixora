"use client"
import { useCallback, useState } from 'react';
import { ToastMessage } from '../components/Toast';

export type ToastType = ToastMessage['type'];

/**
 * Shared toast state used by every dashboard. Returns the current toasts plus
 * `addToast` / `dismissToast` helpers, so the identical toast boilerplate is
 * defined once instead of copied into each page.
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (text: string, type: ToastType = 'success') => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, type, text }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  return { toasts, addToast, dismissToast };
}
