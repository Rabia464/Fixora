"use client"
import React, { useState, useCallback } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { Badge } from '../../../components/Badge';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { TicketModal } from '../../../components/TicketModal';
import { BubblyButton } from '../../../components/BubblyButton';
import { MapPin, Clock, GraduationCap, ClipboardList, Zap, AlertCircle, Search, Plus, Filter, BellRing } from 'lucide-react';
import { LoadError } from '../../../components/LoadError';
import { Complaint, complaintsApi } from '../../../lib/api/complaints';
import { CATEGORIES } from '../../../lib/domain/complaint';
import { useAuthStore } from '../../../stores/auth-store';
import { useToast } from '../../../hooks/useToast';
import { useAsyncData } from '../../../hooks/useAsyncData';
import {
  byStudentAttention,
  clickableCardProps,
  effectiveCategory,
  effectivePriority,
  priorityTone,
  statusLabel,
  statusTone,
  timeAgo,
} from '../../../lib/ui/ticket';
import styles from './student.module.css';

const EMPTY_TICKETS: Complaint[] = [];

type StatusFilter = 'All' | 'Needs action' | 'Active' | 'Closed';
const STATUS_FILTERS: StatusFilter[] = ['All', 'Needs action', 'Active', 'Closed'];

const matchesStatusFilter = (t: Complaint, f: StatusFilter) => {
  if (f === 'Needs action') return t.status === 'Resolved';
  if (f === 'Active') return t.status !== 'Resolved' && t.status !== 'Closed';
  if (f === 'Closed') return t.status === 'Closed';
  return true;
};

export default function StudentDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useAuthStore(state => state.user);
  const { toasts, addToast, dismissToast } = useToast();

  const fetchTickets = useCallback(() => complaintsApi.getComplaints(), []);
  const { data: tickets, loading, error, reload } = useAsyncData(fetchTickets, EMPTY_TICKETS);

  const categories = ['All', ...CATEGORIES];

  const query = searchQuery.trim().toLowerCase();
  const filteredTickets = tickets
    .filter(ticket => {
      const matchesSearch = !query ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.location.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All' || effectiveCategory(ticket) === selectedCategory;
      return matchesSearch && matchesCategory && matchesStatusFilter(ticket, statusFilter);
    })
    .sort(byStudentAttention);

  const awaitingConfirmation = tickets.filter(t => t.status === 'Resolved').length;
  const isFiltering = !!query || selectedCategory !== 'All' || statusFilter !== 'All';

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

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
            Open any ticket to see where it is and its full history.
          </p>
        </div>
      </GlassCard>

      {awaitingConfirmation > 0 && (
        <GlassCard accent="yellow" role="status" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
          <BellRing size={20} color="var(--color-amber)" />
          <span style={{ fontWeight: 700, flex: 1 }}>
            {awaitingConfirmation === 1
              ? '1 repair is waiting for you to confirm it was fixed.'
              : `${awaitingConfirmation} repairs are waiting for you to confirm they were fixed.`}
          </span>
          <BubblyButton variant="ghost" onClick={() => setStatusFilter('Needs action')}>
            Review now
          </BubblyButton>
        </GlassCard>
      )}

      {/* Search & Filter Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            className={styles.searchInput} 
            aria-label="Search tickets"
            placeholder="Search tickets by title or room location..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterChips} role="group" aria-label="Filter by status">
          <Filter size={14} color="var(--color-text-muted)" style={{ marginRight: '4px' }} />
          {STATUS_FILTERS.map(f => (
            <button 
              key={f} 
              className={`${styles.chip} ${statusFilter === f ? styles.active : ''}`}
              aria-pressed={statusFilter === f}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className={styles.filterChips} role="group" aria-label="Filter by category">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`${styles.chip} ${selectedCategory === cat ? styles.active : ''}`}
              aria-pressed={selectedCategory === cat}
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
        </div>

        {loading ? (
          <div className={styles.grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <LoadError message={error} onRetry={reload} />
        ) : filteredTickets.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {isFiltering
                ? 'No tickets match these filters.'
                : 'You haven\u2019t reported any issues yet. Use \u201cNew Ticket\u201d to report something that needs fixing.'}
            </p>
          </GlassCard>
        ) : (
          <div className={styles.grid}>
            {filteredTickets.map(ticket => {
              const isResolved = ticket.status === 'Resolved';
              const isClosed = ticket.status === 'Closed';
              const category = effectiveCategory(ticket);
              const priority = effectivePriority(ticket);
              const openTicket = () => setSelectedTicket(ticket);

              return (
                <GlassCard 
                  key={ticket.id} 
                  accent={isClosed ? 'mint' : isResolved ? 'yellow' : 'cyan'} 
                  className={styles.ticketCard}
                  onClick={openTicket}
                  {...clickableCardProps(openTicket, `Open ticket: ${ticket.title}`)}
                >
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketTitle}>{ticket.title}</div>
                    <Badge status={statusTone(ticket.status)}>{statusLabel(ticket.status, 'Student')}</Badge>
                  </div>

                  <div className={styles.ticketLocation}>
                    <MapPin size={15} color="var(--color-text-muted)" />
                    {ticket.location} • {ticket.hostel}
                  </div>

                  <div className={styles.ticketDesc}>{ticket.description}</div>

                  <div className={styles.ticketMeta}>
                    <Badge status="info">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} /> {category}
                      </span>
                    </Badge>
                    <Badge status={priorityTone(priority)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} /> {priority}
                      </span>
                    </Badge>
                    <span
                      title={new Date(ticket.created_at).toLocaleString()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}
                    >
                      <Clock size={12} /> {timeAgo(ticket.created_at)}
                    </span>
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
        onTicketUpdated={reload}
        onNotify={addToast}
      />

      {/* Submit Ticket Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={msg => {
          addToast(msg, 'success');
          reload();
        }}
      />
    </div>
  );
}
