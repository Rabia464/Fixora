"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { ProgressBar } from '../../../components/ProgressBar';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer, ToastMessage } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { FileWarning, Sparkles, MapPin, ArrowRight, ShieldCheck, Search, Filter, LayoutGrid, BarChart2, Edit3, CheckCircle } from 'lucide-react';
import { Complaint, ComplaintPriority, complaintsApi } from '../../../lib/api/complaints';
import { useAuthStore } from '../../../stores/auth-store';
import styles from './supervisor.module.css';

export default function SupervisorDashboard() {
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overridePriority, setOverridePriority] = useState<ComplaintPriority>('High');
  const user = useAuthStore(state => state.user);

  const fetchTickets = useCallback(() => {
    setLoading(true);
    complaintsApi
      .getComplaints()
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load supervisor complaints:", err);
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

  const handleForward = async (ticket: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionInProgress(ticket.id);
    try {
      // If still Open or Reopened, first review it so it is UnderReview
      if (ticket.status === 'Open' || ticket.status === 'Reopened') {
        await complaintsApi.supervisorReview(ticket.id, {
          category: ticket.ai_category || 'General',
          priority: ticket.ai_priority || 'High',
          department: ticket.ai_department || 'Maintenance',
          override: false,
        });
      }
      
      await complaintsApi.forwardToMaintenance(ticket.id);
      addToast(`Ticket "${ticket.title}" approved & forwarded to Maintenance!`, 'success');
      fetchTickets();
    } catch (err: any) {
      addToast(err.message || 'Failed to forward ticket', 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSaveOverride = async (ticket: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionInProgress(ticket.id);
    try {
      await complaintsApi.supervisorReview(ticket.id, {
        category: overrideCategory || ticket.ai_category || 'General',
        priority: overridePriority,
        department: 'Maintenance',
        override: true,
      });
      addToast(`Updated AI recommendations for "${ticket.title}"!`, 'info');
      setEditingTicketId(null);
      fetchTickets();
    } catch (err: any) {
      addToast(err.message || 'Failed to save override', 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'Open' || t.status === 'UnderReview' || t.status === 'Reopened');
  const categories = ['All', 'Plumbing', 'Carpentry', 'Electrical', 'Sanitation', 'General'];

  const filteredTickets = pendingTickets.filter(ticket => {
    const category = ticket.overridden_category || ticket.ai_category || 'General';
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats for Analytics view
  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    const cat = t.overridden_category || t.ai_category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

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
                placeholder="Search review tickets by title or room..." 
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

          <div className={styles.grid}>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredTickets.length === 0 ? (
              <GlassCard accent="mint" style={{ textAlign: 'center', padding: '48px', gridColumn: '1 / -1' }}>
                <ShieldCheck size={48} color="var(--color-mint)" style={{ margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>All Clear!</h2>
                <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '6px' }}>
                  No pending complaints requiring supervisor review in your hostel right now.
                </p>
              </GlassCard>
            ) : filteredTickets.map(ticket => {
              const isEditing = editingTicketId === ticket.id;
              const category = ticket.overridden_category || ticket.ai_category || 'General';
              const priority = ticket.overridden_priority || ticket.ai_priority || 'Medium';

              return (
                <GlassCard 
                  key={ticket.id} 
                  accent="yellow" 
                  className={styles.ticketCard}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketTitle}>{ticket.title}</div>
                    <Badge status={ticket.status === 'Reopened' ? 'danger' : 'warning'}>
                      {ticket.status}
                    </Badge>
                  </div>
                  
                  <div className={styles.ticketLocation}>
                    <MapPin size={15} color="var(--color-text-muted)" />
                    {ticket.location} • {ticket.hostel}
                  </div>

                  <div className={styles.ticketDesc}>{ticket.description}</div>

                  {/* AI Recommendation & Override Box */}
                  <div className={styles.aiPredictionBox}>
                    <div className={styles.aiPredictionHeader}>
                      <Sparkles size={14} /> AI Recommendation & Classification
                    </div>

                    {!isEditing ? (
                      <>
                        <div className={styles.aiBadges}>
                          <Badge status="info">Category: {category}</Badge>
                          <Badge status={priority === 'Critical' ? 'danger' : 'warning'}>
                            Priority: {priority}
                          </Badge>
                          {ticket.supervisor_override && (
                            <Badge status="warning">Manual Override</Badge>
                          )}
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                            Rule-based Triage Confidence: High
                          </span>
                          <ProgressBar progress={95} color="cyan" />
                        </div>
                      </>
                    ) : (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select 
                            value={overrideCategory || category} 
                            onChange={e => setOverrideCategory(e.target.value)}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', fontSize: '12px' }}
                          >
                            {categories.filter(c => c !== 'All').map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <select 
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
                          setEditingTicketId(ticket.id);
                        }}
                      >
                        <Edit3 size={14} /> Override AI
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 700 }}>Open / Pending Review</span>
                <Badge status="warning">{pendingTickets.length} Tickets</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 700 }}>In Progress at Maintenance</span>
                <Badge status="info">{tickets.filter(t => t.status === 'Forwarded' || t.status === 'InProgress').length} Active</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 700 }}>Resolved & Closed</span>
                <Badge status="success">{tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length} Completed</Badge>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <TicketDrawer 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onTicketUpdated={fetchTickets}
      />
    </div>
  );
}
