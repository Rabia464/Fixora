"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { CheckCircle2, FileWarning } from 'lucide-react';
import styles from './supervisor.module.css';

// Using a Client Component here because we need interactivity (button clicks) to mutate data.
// In Next.js 14, we could use Server Actions to keep this a Server Component, 
// but calling the API route from a client component is perfectly standard for mutations.
export default function SupervisorDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      });
  }, []);

  const handleForward = async (id: number) => {
    await fetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'In Progress' })
    });
    // Optimistic UI update
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'In Progress' } : t));
    router.refresh();
  };

  const pendingTickets = tickets.filter(t => t.status === 'Pending');

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'}}>
        <FileWarning size={32} color="var(--color-primary-dark)" />
        <h1 className={styles.header}>AI Review Board</h1>
      </div>

      <div className={styles.grid}>
        {loading ? <p>Loading tickets...</p> : pendingTickets.length === 0 ? (
          <GlassCard style={{textAlign: 'center', padding: '64px'}}>
            <CheckCircle2 size={64} color="var(--color-success)" style={{margin: '0 auto 16px'}} />
            <h2>All Caught Up!</h2>
            <p style={{color: 'var(--color-text-muted)'}}>No pending tickets to review.</p>
          </GlassCard>
        ) : pendingTickets.map(ticket => (
          <GlassCard key={ticket.id} className={styles.ticketCard}>
            <div className={styles.ticketHeader}>
              <div className={styles.ticketTitle}>{ticket.title}</div>
              <span className={styles.date}>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className={styles.ticketDesc}>{ticket.description}</div>
            <div className={styles.ticketLocation}>📍 {ticket.location}</div>

            <div className={styles.aiPredictionBox}>
              <div className={styles.aiPredictionHeader}>AI Prediction</div>
              <div className={styles.aiBadges}>
                <Badge status="info">Category: {ticket.ai_category}</Badge>
                <Badge status={ticket.ai_priority === 'Critical' ? 'danger' : 'warning'}>
                  Priority: {ticket.ai_priority}
                </Badge>
              </div>
            </div>

            <div className={styles.actionArea}>
              <BubblyButton variant="secondary">Override AI</BubblyButton>
              <BubblyButton onClick={() => handleForward(ticket.id)}>Approve & Forward</BubblyButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
