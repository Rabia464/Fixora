"use client"
import React, { useState, useCallback } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { FileWarning, Sparkles, MapPin, ArrowRight, ShieldCheck, Search, Filter, LayoutGrid, BarChart2, Edit3, Clock } from 'lucide-react';
import { LoadError } from '../../../components/LoadError';
import { Complaint, ComplaintPriority, complaintsApi } from '../../../lib/api/complaints';
import {
  CATEGORIES,
  COMPLAINT_STATUSES,
  DEPARTMENTS,
  departmentFor,
  effectiveDepartment,
} from '../../../lib/domain/complaint';
import { useAuthStore } from '../../../stores/auth-store';
import { useToast } from '../../../hooks/useToast';
import { useAsyncData } from '../../../hooks/useAsyncData';
import {
  byUrgency,
  clickableCardProps,
  effectiveCategory,
  effectivePriority,
  priorityTone,
  statusLabel,
  statusTone,
  timeAgo,
} from '../../../lib/ui/ticket';
import styles from './supervisor.module.css';

const EMPTY_TICKETS: Complaint[] = [];

export default function SupervisorDashboard() {
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overridePriority, setOverridePriority] = useState<ComplaintPriority>('High');
  const [overrideDepartment, setOverrideDepartment] = useState('');
  const user = useAuthStore(state => state.user);
  const { toasts, addToast, dismissToast } = useToast();

  const fetchTickets = useCallback(() => complaintsApi.getComplaints(), []);
  const { data: tickets, loading, error, reload } = useAsyncData(fetchTickets, EMPTY_TICKETS);

  const handleForward = async (ticket: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionInProgress(ticket.id);
    try {
      // Still Open or Reopened: accepting the triage as shown is the review
      // step (-> UnderReview). If the supervisor already adjusted it, keep that.
      if (ticket.status === 'Open' || ticket.status === 'Reopened') {
        await complaintsApi.supervisorReview(ticket.id, {
          category: effectiveCategory(ticket),
          priority: effectivePriority(ticket),
          department: effectiveDepartment(ticket),
          override: ticket.supervisor_override,
        });
      }
      
      await complaintsApi.forwardToMaintenance(ticket.id);
      addToast(`Ticket "${ticket.title}" approved & forwarded to Maintenance!`, 'success');
      reload();
    } catch (err) {
      addToast((err instanceof Error ? err.message : 'Failed to forward ticket'), 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSaveOverride = async (ticket: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionInProgress(ticket.id);
    const category = overrideCategory || effectiveCategory(ticket);
    const department = overrideDepartment || departmentFor(category);
    // An override means the supervisor's triage differs from the system's suggestion.
    const override =
      category !== (ticket.ai_category || 'General') ||
      overridePriority !== (ticket.ai_priority || 'Medium') ||
      department !== (ticket.ai_department || departmentFor(ticket.ai_category || 'General'));
    try {
      await complaintsApi.supervisorReview(ticket.id, {
        category,
        priority: overridePriority,
        department,
        override,
      });
      addToast(`Updated AI recommendations for "${ticket.title}"!`, 'info');
      setEditingTicketId(null);
      reload();
    } catch (err) {
      addToast((err instanceof Error ? err.message : 'Failed to save override'), 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'Open' || t.status === 'UnderReview' || t.status === 'Reopened');
  const categories = ['All', ...CATEGORIES];

  const query = searchQuery.trim().toLowerCase();
  const filteredTickets = pendingTickets
    .filter(ticket => {
      const matchesSearch = !query ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.location.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All' || effectiveCategory(ticket) === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort(byUrgency);
  const isFiltering = !!query || selectedCategory !== 'All';

  // Calculate stats for Analytics view
  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  tickets.forEach(t => {
    const cat = effectiveCategory(t);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className={styles.headerRow}>
        <div className={styles.header}>
          <FileWarning size={30} color="var(--color-amber)" />
          <span>
            Supervisor Review Board {user?.hostel ? `(${user.hostel})` : ''}
          </span>
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <LayoutGrid size={15} /> Review Queue ({pendingTickets.length})
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'analytics' ? styles.active : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            <BarChart2 size={15} /> Visual Analytics
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={18} color="var(--color-text-muted)" />
              <input 
                type="text" 
                className={styles.searchInput} 
                aria-label="Search review queue"
                placeholder="Search review tickets by title or room..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filterChips} role="group" aria-label="Filter by category">
              <Filter size={14} color="var(--color-text-muted)" style={{ marginRight: '4px' }} />
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

          <div className={styles.grid}>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : error ? (
              <LoadError message={error} onRetry={reload} />
            ) : filteredTickets.length === 0 ? (
              isFiltering ? (
                <GlassCard style={{ textAlign: 'center', padding: '48px', gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    No tickets in the review queue match these filters.
                  </p>
                </GlassCard>
              ) : (
                <GlassCard accent="mint" style={{ textAlign: 'center', padding: '48px', gridColumn: '1 / -1' }}>
                  <ShieldCheck size={48} color="var(--color-mint)" style={{ margin: '0 auto 12px' }} />
                  <h2 style={{ fontSize: '24px', fontWeight: 800 }}>All Clear!</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '6px' }}>
                    No pending complaints requiring supervisor review in your hostel right now.
                  </p>
                </GlassCard>
              )
            ) : filteredTickets.map(ticket => {
              const isEditing = editingTicketId === ticket.id;
              const category = effectiveCategory(ticket);
              const priority = effectivePriority(ticket);
              const department = effectiveDepartment(ticket);
              const openTicket = () => setSelectedTicket(ticket);

              return (
                <GlassCard 
                  key={ticket.id} 
                  accent={priority === 'Critical' ? 'coral' : 'yellow'} 
                  className={styles.ticketCard}
                  onClick={openTicket}
                  {...clickableCardProps(openTicket, `Open ticket: ${ticket.title}`)}
                >
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketTitle}>{ticket.title}</div>
                    <Badge status={statusTone(ticket.status)}>
                      {statusLabel(ticket.status, 'Hostel Supervisor')}
                    </Badge>
                  </div>
                  
                  <div className={styles.ticketLocation}>
                    <MapPin size={15} color="var(--color-text-muted)" />
                    {ticket.location} • {ticket.hostel}
                    <span title={new Date(ticket.created_at).toLocaleString()} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                      <Clock size={13} /> {timeAgo(ticket.created_at)}
                    </span>
                  </div>

                  <div className={styles.ticketDesc}>{ticket.description}</div>

                  {/* AI Recommendation & Override Box */}
                  <div className={styles.aiPredictionBox}>
                    <div className={styles.aiPredictionHeader}>
                      <Sparkles size={14} /> Suggested category, priority &amp; department
                    </div>

                    {!isEditing ? (
                      <>
                        <div className={styles.aiBadges}>
                          <Badge status="info">Category: {category}</Badge>
                          <Badge status={priorityTone(priority)}>
                            Priority: {priority}
                          </Badge>
                          <Badge status="purple">Department: {department}</Badge>
                          {ticket.supervisor_override && (
                            <Badge status="neutral">Adjusted by supervisor</Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select 
                            aria-label="Category"
                            value={overrideCategory || category} 
                            onChange={e => {
                              setOverrideCategory(e.target.value);
                              // Default the department to the one that handles this category.
                              setOverrideDepartment(departmentFor(e.target.value));
                            }}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                          >
                            {categories.filter(c => c !== 'All').map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <select 
                            aria-label="Priority"
                            value={overridePriority} 
                            onChange={e => setOverridePriority(e.target.value as ComplaintPriority)}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                        <select
                          aria-label="Department"
                          value={overrideDepartment || department}
                          onChange={e => setOverrideDepartment(e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <BubblyButton variant="primary" onClick={(e) => handleSaveOverride(ticket, e)} disabled={actionInProgress === ticket.id}>
                            Save Changes
                          </BubblyButton>
                          <BubblyButton variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingTicketId(null); }}>
                            Cancel
                          </BubblyButton>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.actionArea}>
                    {!isEditing && (
                      <BubblyButton 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverrideCategory(category);
                          setOverridePriority(priority as ComplaintPriority);
                          setOverrideDepartment(department);
                          setEditingTicketId(ticket.id);
                        }}
                      >
                        <Edit3 size={14} /> Adjust
                      </BubblyButton>
                    )}
                    <BubblyButton 
                      variant="primary" 
                      onClick={(e) => handleForward(ticket, e)}
                      disabled={actionInProgress === ticket.id}
                    >
                      {actionInProgress === ticket.id ? 'Forwarding...' : 'Approve & Forward'} <ArrowRight size={15} />
                    </BubblyButton>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </>
      ) : (
        /* Visual Analytics UI Tab */
        <div className={styles.analyticsGrid}>
          <GlassCard accent="cyan" className={styles.chartCard}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Category Breakdown (Hostel Complaints)</h3>
            
            {Object.keys(categoryCounts).length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '12px' }}>No complaint data recorded yet.</p>
            ) : (
              Object.entries(categoryCounts).map(([cat, count]) => {
                const percentage = Math.round((count / tickets.length) * 100);
                return (
                  <div key={cat} className={styles.barRow}>
                    <div className={styles.barMeta}>
                      <span>{cat}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${percentage}%`, background: 'var(--color-cyan)' }} />
                    </div>
                  </div>
                );
              })
            )}
          </GlassCard>

          <GlassCard accent="purple" className={styles.chartCard}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Hostel Status Overview</h3>
            
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {tickets.length} complaint{tickets.length === 1 ? '' : 's'} in total
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {COMPLAINT_STATUSES.map(status => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <span style={{ fontWeight: 700 }}>{statusLabel(status, 'Hostel Supervisor')}</span>
                  <Badge status={statusTone(status)}>{statusCounts[status] || 0}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      <TicketDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={reload}
        onNotify={addToast}
      />
    </div>
  );
}
