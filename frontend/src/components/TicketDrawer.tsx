"use client"
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Complaint, complaintsApi } from '../lib/api/complaints';
import { AuditLogItem, auditLogsApi } from '../lib/api/auditLogs';
import { Badge } from './Badge';
import { BubblyButton } from './BubblyButton';
import { MapPin, CheckCircle2, FileText, X, RotateCcw, Clock } from 'lucide-react';
import type { ToastType } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useAuthStore } from '../stores/auth-store';
import {
  formatAuditDetail,
  PROGRESS_STEPS,
  effectiveCategory,
  effectivePriority,
  priorityTone,
  progressStepIndex,
  statusLabel,
  statusTone,
  timeAgo,
} from '../lib/ui/ticket';
import styles from './TicketDrawer.module.css';

interface TicketDrawerProps {
  ticket: Complaint | null;
  onClose: () => void;
  onTicketUpdated?: () => void;
  /** Surface success/error feedback as a toast (falls back to no-op). */
  onNotify?: (text: string, type?: ToastType) => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  ticket,
  onClose,
  onTicketUpdated,
  onNotify,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [logsTicketId, setLogsTicketId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const role = useAuthStore(state => state.role);

  const notify = (text: string, type: ToastType = 'success') => onNotify?.(text, type);

  const handleClose = () => {
    setShowReopenInput(false);
    setReopenReason('');
    onClose();
  };

  useEscapeKey(!!ticket, handleClose);

  useEffect(() => {
    if (!ticket) return;
    let active = true;
    auditLogsApi
      .getByComplaint(ticket.id)
      .then(logs => {
        if (active) {
          setAuditLogs(logs);
          setLogsTicketId(ticket.id);
        }
      })
      .catch(() => {
        if (active) {
          setAuditLogs([]);
          setLogsTicketId(ticket.id);
        }
      });
    return () => {
      active = false;
    };
  }, [ticket]);

  if (!ticket) return null;

  // Derived so we never call setState synchronously inside the effect: logs are
  // "loading" until the fetch for the currently selected ticket has landed.
  const loadingLogs = logsTicketId !== ticket.id;

  const isResolved = ticket.status === 'Resolved';
  // Only the student who filed the ticket can confirm or reopen it; staff
  // would just get a permission error from the API.
  const canConfirm = isResolved && role === 'Student';
  const currentStep = progressStepIndex(ticket.status);
  const priority = effectivePriority(ticket);

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await complaintsApi.confirmResolution(ticket.id);
      notify('Ticket confirmed and closed. Thank you!', 'success');
      if (onTicketUpdated) onTicketUpdated();
      handleClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to confirm resolution', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 10) {
      notify('Please provide a reason with at least 10 characters.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await complaintsApi.reopenComplaint(ticket.id, { reason: reopenReason });
      notify('Ticket reopened. Maintenance has been notified.', 'info');
      if (onTicketUpdated) onTicketUpdated();
      handleClose();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to reopen complaint', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  const formatActionTitle = (action: string) => {
    return action.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
  };

  // Portal to <body> so the fixed overlay isn't trapped inside an animated
  // (transformed) page container, which would clip it to that container.
  return createPortal(
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.drawer}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-drawer-title"
      >
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--color-cyan)" />
            <h2 className={styles.title} id="ticket-drawer-title">Ticket Details</h2>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close ticket details" autoFocus>
            <X size={18} />
          </button>
        </div>

        <div className={styles.ticketMetaBox}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{ticket.title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            <MapPin size={15} /> {ticket.location} • {ticket.hostel}
          </div>

          <div className={styles.metaLine} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} />
            <span title={new Date(ticket.created_at).toLocaleString()}>
              Reported {timeAgo(ticket.created_at)}
            </span>
            {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
              <span>• updated {timeAgo(ticket.updated_at)}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <Badge status={statusTone(ticket.status)}>{statusLabel(ticket.status, role)}</Badge>
            <Badge status="info">{effectiveCategory(ticket)}</Badge>
            <Badge status={priorityTone(priority)}>{priority} priority</Badge>
            {ticket.supervisor_override && (
              <Badge status="neutral">Adjusted by supervisor</Badge>
            )}
          </div>
        </div>

        {/* Where the ticket is in the process */}
        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: '12px' }}>Progress</div>
          <ol className={styles.stepper} aria-label="Ticket progress">
            {PROGRESS_STEPS.map((label, i) => {
              const state = i < currentStep ? styles.stepDone : i === currentStep ? styles.stepCurrent : '';
              return (
                <li
                  key={label}
                  className={`${styles.step} ${state}`}
                  aria-current={i === currentStep ? 'step' : undefined}
                >
                  <span className={styles.stepDot} aria-hidden="true" />
                  {label}
                </li>
              );
            })}
          </ol>
          {ticket.status === 'Reopened' && (
            <p className={styles.metaLine} style={{ marginTop: '8px' }}>
              This ticket was reopened and is back with the hostel supervisor.
            </p>
          )}
        </div>

        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: '8px' }}>Description</div>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-main)', background: 'var(--glass-bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            {ticket.description}
          </p>
        </div>

        {/* Student Resolution Confirmation Actions */}
        {canConfirm && (
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-mint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={18} /> Maintenance has marked this ticket as Resolved!
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-main)' }}>
              Please inspect the repair. If satisfied, confirm to close the ticket. If the issue persists, you can reopen it.
            </p>
            
            {!showReopenInput ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <BubblyButton variant="primary" onClick={handleConfirm} disabled={actionLoading}>
                  <CheckCircle2 size={16} /> Confirm & Close
                </BubblyButton>
                <BubblyButton variant="ghost" onClick={() => setShowReopenInput(true)}>
                  <RotateCcw size={16} /> Reopen Ticket
                </BubblyButton>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  aria-label="Reason for reopening"
                  placeholder="Explain why the issue is not resolved (at least 10 characters)..."
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)', fontSize: '13px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <BubblyButton variant="secondary" onClick={handleReopen} disabled={actionLoading || reopenReason.trim().length < 10}>
                    Submit Reopen Request
                  </BubblyButton>
                  <BubblyButton variant="ghost" onClick={() => setShowReopenInput(false)}>
                    Cancel
                  </BubblyButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Trail Timeline */}
        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: '16px' }}>History</div>
          {loadingLogs ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading audit history...</p>
          ) : auditLogs.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No audit history found.</p>
          ) : (
            <div className={styles.timeline}>
              {auditLogs.map((log) => (
                <div key={log.id} className={`${styles.timelineItem} ${styles.completed}`}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineTitle}>{formatActionTitle(log.action)}</div>
                  <div className={styles.timelineTime}>
                    {log.actor_name ? `${log.actor_name} • ` : ''}
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', background: 'var(--glass-bg)', padding: '6px 8px', borderRadius: '6px' }}>
                      {Object.entries(log.details).map(([key, val]) => {
                        const line = formatAuditDetail(key, val);
                        return line ? (
                          <div key={key}>
                            <span style={{ fontWeight: 600 }}>{line.label}:</span> {line.value}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
