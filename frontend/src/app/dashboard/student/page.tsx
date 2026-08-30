"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { Badge } from '../../../components/Badge';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer, ToastMessage } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { TicketModal } from '../../../components/TicketModal';
import { BubblyButton } from '../../../components/BubblyButton';
import { MapPin, CheckCircle, Clock, GraduationCap, ClipboardList, Zap, AlertCircle, Search, Plus, Filter } from 'lucide-react';
import { Complaint, complaintsApi } from '../../../lib/api/complaints';
import { useAuthStore } from '../../../stores/auth-store';
import styles from './student.module.css';

export default function StudentDashboard() {
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const user = useAuthStore(state => state.user);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    complaintsApi
      .getComplaints()
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load complaints:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const addToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const categories = ['All', 'Plumbing', 'Carpentry', 'Electrical', 'Sanitation', 'General'];

  const filteredTickets = tickets.filter(ticket => {
    const category = ticket.overridden_category || ticket.ai_category || 'General';
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Student Profile Banner */}
      <GlassCard className={styles.profileBanner}>
        <div className={styles.avatar}>
          <GraduationCap size={32} color="var(--color-cyan)" />
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.welcomeRow}>
            <div className={styles.welcomeText}>
              Welcome back, {user?.full_name || 'Student'}
            </div>
            <BubblyButton variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> New Ticket
            </BubblyButton>
          </div>
          <p className={styles.subText}>
            {user?.hostel ? `Assigned Hostel: ${user.hostel} • ` : ''}
            Click any ticket card below to view its complete audit lifecycle timeline.
          </p>
        </div>
      </GlassCard>

      {/* Search & Filter Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search tickets by title or room location..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterChips}>
          <Filter size={14} color="var(--color-text-muted)" style={{ marginRight: '4px' }} />
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`${styles.chip} ${selectedCategory === cat ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.sectionTitle}>
            <ClipboardList size={20} color="var(--color-cyan)" /> My Tickets ({filteredTickets.length})
          </h2>
          <Badge status="info">Click to Inspect Audit</Badge>
        </div>

        {loading ? (
          <div className={styles.grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredTickets.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              No matching tickets found. Click "New Ticket" to submit a maintenance request.
            </p>
          </GlassCard>
        ) : (
          <div className={styles.grid}>
            {filteredTickets.map(ticket => {
              const isResolved = ticket.status === 'Resolved';
              const isClosed = ticket.status === 'Closed';
              const category = ticket.overridden_category || ticket.ai_category;
              const priority = ticket.overridden_priority || ticket.ai_priority;

              return (
                <GlassCard 
                  key={ticket.id} 
                  accent={isClosed ? 'mint' : isResolved ? 'yellow' : 'cyan'} 
                  className={styles.ticketCard}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketTitle}>{ticket.title}</div>
                    <Badge status={isClosed ? 'success' : isResolved ? 'warning' : 'info'}>
                      {isClosed ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={13} /> Closed
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {ticket.status}
                        </span>
                      )}
                    </Badge>
                  </div>

                  <div className={styles.ticketLocation}>
                    <MapPin size={15} color="var(--color-text-muted)" />
                    {ticket.location} • {ticket.hostel}
                  </div>

                  <div className={styles.ticketDesc}>{ticket.description}</div>

                  <div className={styles.ticketMeta}>
                    {category && (
                      <Badge status="info">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Zap size={12} /> {category}
                        </span>
                      </Badge>
                    )}
                    {priority && (
                      <Badge status={priority === 'Critical' ? 'danger' : 'warning'}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> {priority}
                        </span>
                      </Badge>
                    )}
                    {ticket.supervisor_override && (
                      <Badge status="warning">Supervisor Overridden</Badge>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Slide-over Detail Drawer */}
      <TicketDrawer 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onTicketUpdated={fetchTickets}
      />

      {/* Submit Ticket Modal */}
      <TicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={msg => {
          addToast(msg, 'success');
          fetchTickets();
        }}
      />
    </div>
  );
}
