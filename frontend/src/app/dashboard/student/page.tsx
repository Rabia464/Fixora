"use client"
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import styles from './student.module.css';

export default function StudentDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/v1/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/v1/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, location })
      });
      
      if (res.ok) {
        setTitle('');
        setDescription('');
        setLocation('');
        fetchTickets(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to submit ticket", err);
    }
  };

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <h1 className={styles.header}>Student Dashboard</h1>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Report an Issue</h2>
        <GlassCard className={styles.formCard}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>What's the issue?</label>
              <input 
                className={styles.input} 
                placeholder="e.g. Broken Window" 
                value={title} onChange={e => setTitle(e.target.value)} required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Where is it?</label>
              <input 
                className={styles.input} 
                placeholder="e.g. Room 402, Hostel A" 
                value={location} onChange={e => setLocation(e.target.value)} required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Describe it</label>
              <textarea 
                className={styles.textarea} 
                placeholder="Please describe the issue in detail..." 
                value={description} onChange={e => setDescription(e.target.value)} required 
              />
            </div>
            <BubblyButton type="submit">Submit Ticket</BubblyButton>
          </form>
        </GlassCard>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>My Tickets</h2>
        {loading ? (
          <p>Loading tickets...</p>
        ) : tickets.length === 0 ? (
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
