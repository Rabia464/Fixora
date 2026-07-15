import React from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { Badge } from '../../../components/Badge';
import { Flame, Star, UserRound } from 'lucide-react';
import { mockTickets } from '../../api/data';
import styles from './student.module.css';

// Server Component
export default async function StudentDashboard() {
  // In a real app we would query DB by student ID. Here we just take all tickets for the demo.
  const tickets = mockTickets;

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      
      <GlassCard className={styles.profileBanner}>
        <div className={styles.avatar}><UserRound size={48} color="var(--color-primary-dark)" /></div>
        <div className={styles.profileInfo}>
          <div className={styles.welcomeText}>Welcome back, Fixer!</div>
          <div className={styles.statsRow}>
            <div className={styles.statBadge}>
              <Flame size={18} color="#ff6b6b" />
              <span>3 Day Streak</span>
            </div>
            <div className={styles.statBadge}>
              <Star size={18} color="#fcc419" />
              <span>120 Fixer Points</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>My Tickets</h2>
        {tickets.length === 0 ? (
          <p>No tickets found. You're all good!</p>
        ) : (
          <div className={styles.grid}>
            {tickets.map(ticket => (
              <GlassCard key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketTitle}>{ticket.title}</div>
                  <Badge status={ticket.status === 'Resolved' ? 'success' : 'warning'}>
                    {ticket.status}
                  </Badge>
                </div>
                <div className={styles.ticketDesc}>{ticket.description}</div>
                <div className={styles.ticketMeta}>
                  {ticket.ai_category && <Badge status="info">{ticket.ai_category}</Badge>}
                  {ticket.ai_priority === 'Critical' && <Badge status="danger">Critical</Badge>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
