"use client"
import React, { useEffect, useState } from 'react';
import { Complaint, complaintsApi } from '../lib/api/complaints';
import { AuditLogItem, auditLogsApi } from '../lib/api/auditLogs';
import { Badge } from './Badge';
import { BubblyButton } from './BubblyButton';
import { MapPin, Clock, CheckCircle2, AlertCircle, FileText, X, RotateCcw, User, ShieldAlert } from 'lucide-react';
import styles from './TicketDrawer.module.css';

interface TicketDrawerProps {
  ticket: Complaint | null;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ ticket, onClose, onTicketUpdated }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (ticket) {
      setLoadingLogs(true);
      auditLogsApi
        .getByComplaint(ticket.id)
        .then(logs => {
          setAuditLogs(logs);
          setLoadingLogs(false);
        })
        .catch(() => setLoadingLogs(false));
    } else {
      setAuditLogs([]);
      setShowReopenInput(false);
      setReopenReason('');
    }
  }, [ticket]);

  if (!ticket) return null;

  const isResolved = ticket.status === 'Resolved';
  const isClosed = ticket.status === 'Closed';

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await complaintsApi.confirmResolution(ticket.id);
      if (onTicketUpdated) onTicketUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm resolution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 10) {
      alert('Please provide a reason with at least 10 characters.');
      return;
    }
    setActionLoading(true);
    try {
      await complaintsApi.reopenComplaint(ticket.id, { reason: reopenReason });
      if (onTicketUpdated) onTicketUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to reopen complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const formatActionTitle = (action: string) => {
    return action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--color-cyan)" />
            <h2 className={styles.title}>Ticket Details</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.ticketMetaBox}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{ticket.title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            <MapPin size={15} /> {ticket.location} • {ticket.hostel}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <Badge status={isClosed ? 'success' : isResolved ? 'info' : 'warning'}>{ticket.status}</Badge>
            {(ticket.overridden_category || ticket.ai_category) && (
              <Badge status="info">⚡ {ticket.overridden_category || ticket.ai_category}</Badge>
            )}
            {(ticket.overridden_priority || ticket.ai_priority) && (
              <Badge status={ticket.overridden_priority === 'Critical' || ticket.ai_priority === 'Critical' ? 'danger' : 'warning'}>
                {ticket.overridden_priority || ticket.ai_priority} Priority
              </Badge>
            )}
            {ticket.supervisor_override && (
              <Badge status="warning">Supervisor Override</Badge>
            )}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: '8px' }}>Description</div>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-main)', background: 'rgba(255,255,255,0.5)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
            {ticket.description}
          </p>
        </div>

        {/* Student Resolution Confirmation Actions */}
        {isResolved && (
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  placeholder="Explain why the issue is not resolved..."
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)', fontSize: '13px' }}
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
          <div className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Chronological Audit Trail</div>
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
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '6px' }}>
                      {Object.entries(log.details).map(([key, val]) => (
                        <div key={key}>
                          <span style={{ fontWeight: 600 }}>{key}:</span> {String(val)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
