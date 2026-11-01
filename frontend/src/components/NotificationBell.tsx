"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, X } from 'lucide-react';
import { NotificationItem, notificationsApi } from '../lib/api/notifications';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { timeAgo } from '../lib/ui/ticket';
import styles from './NotificationBell.module.css';

const POLL_MS = 60_000;

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Turns a raw notification into a one-line headline plus optional detail. */
export function describeNotification(n: NotificationItem): { headline: string; detail?: string } {
  const p = n.payload ?? {};
  const title = str(p.title) || 'A ticket';
  switch (n.type) {
    case 'ComplaintCreated':
      return { headline: `New complaint: ${title}`, detail: [str(p.location), str(p.hostel)].filter(Boolean).join(' • ') };
    case 'MaintenanceStarted':
      return { headline: `Repair started on "${title}"`, detail: str(p.note) || undefined };
    case 'ResolutionPendingConfirmation':
      return { headline: `"${title}" was marked fixed. Please confirm.`, detail: str(p.resolution_note) || undefined };
    case 'ComplaintReopened':
      return { headline: `"${title}" was reopened`, detail: str(p.reason) || undefined };
    case 'ComplaintClosed':
      return { headline: `"${title}" is closed` };
    case 'StatusUpdated':
      return { headline: `"${title}" was updated`, detail: str(p.status) ? `New status: ${str(p.status)}` : undefined };
    default:
      return { headline: `Update on "${title}"` };
  }
}

interface NotificationBellProps {
  /** Rendered with the same look as the sidebar nav items. */
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(() => {
    notificationsApi
      .getUnread()
      .then(setItems)
      .catch(() => {
        // Notifications are secondary: keep the last list rather than interrupting the page.
      });
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  useEscapeKey(open, () => {
    setOpen(false);
    buttonRef.current?.focus();
  });

  // Close when clicking anywhere outside the panel or the bell.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await notificationsApi.markAllAsRead();
      setItems([]);
    } catch {
      // Leave the list as-is; the next poll will reconcile.
    } finally {
      setMarking(false);
    }
  };

  const count = items.length;
  const label = count === 0 ? 'Notifications' : `Notifications, ${count} unread`;

  return (
    <>
      <button
        ref={buttonRef}
        className={`${className} ${styles.bellButton}`}
        onClick={() => setOpen(o => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={styles.iconWrap}>
          <Bell size={20} />
          {count > 0 && (
            <span className={styles.badge} aria-hidden="true">{count > 9 ? '9+' : count}</span>
          )}
        </span>
        <span>Updates</span>
      </button>

      {/* Portaled: the sidebar uses backdrop-filter, which would otherwise make it
          the containing block for this fixed panel. */}
      {open && createPortal(
        <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Updates</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {count > 0 && (
                <button className={styles.textButton} onClick={markAllRead} disabled={marking}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button className={styles.iconButton} onClick={() => setOpen(false)} aria-label="Close notifications">
                <X size={16} />
              </button>
            </div>
          </div>

          {count === 0 ? (
            <p className={styles.empty}>You&rsquo;re all caught up.</p>
          ) : (
            <ul className={styles.list}>
              {items.map(n => {
                const { headline, detail } = describeNotification(n);
                return (
                  <li key={n.id} className={styles.item}>
                    <div className={styles.headline}>{headline}</div>
                    {detail && <div className={styles.detail}>{detail}</div>}
                    <div className={styles.time}>{timeAgo(n.created_at)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>,
        document.body,
      )}
    </>
  );
};
