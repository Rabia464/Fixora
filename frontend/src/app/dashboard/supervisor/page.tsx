"use client"
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import styles from './supervisor.module.css';

export default function SupervisorDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would fetch only "Open" tickets for their hostel.
    // We mock it for the UI implementation since DB isn't connected.
    setTickets([
      { id: '1', title: 'Leaking Pipe in Room 204', description: 'Water is dripping from the ceiling.', status: 'Open', ai_priority: 'High', ai_category: 'Plumbing' },
      { id: '2', title: 'Broken Window', description: 'Window won\'t close properly.', status: 'Open', ai_priority: 'Medium', ai_category: 'Carpentry' }
    ]);
  }, []);

  const handleForward = (id: string) => {
    // Optimistic UI update
    setTickets(tickets.filter(t => t.id !== id));
  };

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <h1 className={styles.header}>Supervisor Review Board</h1>
      
      <div className={styles.grid}>
        {tickets.map(ticket => (
          <GlassCard key={ticket.id} className={styles.ticketCard}>
            <div>
              <div className={styles.ticketTitle}>{ticket.title}</div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>{ticket.description}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge status="info">AI: {ticket.ai_category}</Badge>
              <Badge status={ticket.ai_priority === 'High' ? 'danger' : 'warning'}>AI: {ticket.ai_priority}</Badge>
            </div>

            <div className={styles.actions}>
              <BubblyButton onClick={() => handleForward(ticket.id)}>Approve & Forward</BubblyButton>
              <BubblyButton variant="secondary">Override AI</BubblyButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
