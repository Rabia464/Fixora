"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { ProgressBar } from '../../../components/ProgressBar';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer, ToastMessage } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { FileWarning, Sparkles, MapPin, ArrowRight, ShieldCheck, Search, Filter, LayoutGrid, BarChart2, CheckCircle2, Clock } from 'lucide-react';
import { Ticket } from '../../api/data';
import styles from './supervisor.module.css';

export default function SupervisorDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleForward = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'In Progress' })
    });
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'In Progress' } : t));
    addToast(`Ticket "${title}" approved & dispatched to Maintenance!`, 'success');
    router.refresh();
  };

  const pendingTickets = tickets.filter(t => t.status === 'Pending');
  const categories = ['All', 'Plumbing', 'Carpentry', 'Electrical', 'Wi-Fi'];

  const filteredTickets = pendingTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ticket.ai_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      <div className={styles.headerRow}>
        <div className={styles.header}>
          <FileWarning size={30} color="var(--color-amber)" />
          <span>Supervisor Review Board</span>
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <LayoutGrid size={15} /> Review List
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
                placeholder="Search review tickets by title or location..." 
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
                  No pending tickets requiring supervisor review right now.
                </p>
              </GlassCard>
            ) : filteredTickets.map(ticket => (
              <GlassCard 
                key={ticket.id} 
                accent="yellow" 
                className={styles.ticketCard}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketTitle}>{ticket.title}</div>
                  <span className={styles.date}>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className={styles.ticketLocation}>
                  <MapPin size={15} color="var(--color-text-muted)" />
                  {ticket.location}
                </div>

                <div className={styles.ticketDesc}>{ticket.description}</div>

                <div className={styles.aiPredictionBox}>
                  <div className={styles.aiPredictionHeader}>
                    <Sparkles size={14} /> AI Recommendation & Classification
                  </div>
                  <div className={styles.aiBadges}>
                    <Badge status="info">Category: {ticket.ai_category || 'General'}</Badge>
                    <Badge status={ticket.ai_priority === 'Critical' ? 'danger' : 'warning'}>
                      Priority: {ticket.ai_priority || 'Normal'}
                    </Badge>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>AI Confidence: 94%</span>
                    <ProgressBar progress={94} color="cyan" />
                  </div>
                </div>

                <div className={styles.actionArea}>
                  <BubblyButton 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToast('AI classification overridden.', 'info');
                    }}
                  >
                    Override
                  </BubblyButton>
                  <BubblyButton 
                    variant="primary" 
                    onClick={(e) => handleForward(ticket.id, ticket.title, e)}
                  >
                    Approve & Forward <ArrowRight size={15} />
                  </BubblyButton>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      ) : (
        /* Visual Analytics UI Tab */
        <div className={styles.analyticsGrid}>
          <GlassCard accent="cyan" className={styles.chartCard}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Category Breakdown & Frequency</h3>
            
            <div className={styles.barRow}>
              <div className={styles.barMeta}>
                <span>Plumbing Issues</span>
                <span>42%</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: '42%', background: 'var(--color-cyan)' }} />
              </div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barMeta}>
                <span>Carpentry & Furniture</span>
                <span>28%</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: '28%', background: 'var(--color-indigo)' }} />
              </div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barMeta}>
                <span>Wi-Fi & Network</span>
                <span>18%</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: '18%', background: 'var(--color-mint)' }} />
              </div>
            </div>

            <div className={styles.barRow}>
              <div className={styles.barMeta}>
                <span>Electrical & Lighting</span>
                <span>12%</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: '12%', background: 'var(--color-amber)' }} />
              </div>
            </div>
          </GlassCard>

          <GlassCard accent="purple" className={styles.chartCard}>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Hostel Distribution</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 700 }}>Hostel A (Boys)</span>
                <Badge status="danger">14 Active</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 700 }}>Hostel B (Boys)</span>
                <Badge status="warning">8 Active</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 700 }}>Hostel C (Girls)</span>
                <Badge status="success">3 Active</Badge>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <TicketDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
