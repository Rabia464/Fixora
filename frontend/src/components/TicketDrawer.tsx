"use client"
import React from 'react';
import { Ticket } from '../app/api/data';
import { Badge } from './Badge';
import { MapPin, Clock, CheckCircle2, Sparkles, FileText, X } from 'lucide-react';
import styles from './TicketDrawer.module.css';

interface TicketDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const isResolved = ticket.status === 'Resolved';
  const isInProgress = ticket.status === 'In Progress' || isResolved;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--color-cyan)" />
            <h2 className={styles.title}>Ticket #{ticket.id}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.ticketMetaBox}>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{ticket.title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            <MapPin size={15} /> {ticket.location}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <Badge status={isResolved ? 'success' : 'warning'}>{ticket.status}</Badge>
            {ticket.ai_category && <Badge status="info">⚡ {ticket.ai_category}</Badge>}
            {ticket.ai_priority && <Badge status="danger">{ticket.ai_priority} Priority</Badge>}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: '8px' }}>Description</div>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-main)', background: 'rgba(255,255,255,0.5)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
            {ticket.description}
          </p>
        </div>

        {/* Audit Lifecycle Timeline */}
        <div>
          <div className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Resolution Lifecycle Audit</div>
          <div className={styles.timeline}>
            <div className={`${styles.timelineItem} ${styles.completed}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineTitle}>1. Complaint Submitted by Student</div>
              <div className={styles.timelineTime}>{new Date(ticket.created_at).toLocaleString()}</div>
            </div>

            <div className={`${styles.timelineItem} ${styles.completed}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineTitle}>2. AI Automated Classification</div>
              <div className={styles.timelineTime}>Category: {ticket.ai_category || 'General'} (94% confidence)</div>
            </div>

            <div className={`${styles.timelineItem} ${isInProgress ? styles.completed : styles.active}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineTitle}>3. Hostel Supervisor Board Approval</div>
              <div className={styles.timelineTime}>{isInProgress ? 'Approved & Dispatched' : 'Awaiting Supervisor Review'}</div>
            </div>

            <div className={`${styles.timelineItem} ${isResolved ? styles.completed : isInProgress ? styles.active : ''}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineTitle}>4. Maintenance Staff Repair</div>
              <div className={styles.timelineTime}>{isResolved ? 'Marked Resolved by Work Order Staff' : 'Pending Repair Completion'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
