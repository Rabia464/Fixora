"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer, ToastMessage } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { Wrench, CheckCircle2, MapPin, AlertCircle, Zap, ShieldCheck, Search, Filter } from 'lucide-react';
import { Ticket } from '../../api/data';
import styles from './maintenance.module.css';

export default function MaintenanceDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
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

  const handleResolve = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open drawer when clicking Resolve button
    await fetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Resolved' })
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
    addToast(`Task "${title}" marked resolved!`, 'success');
    router.refresh();
  };

  const activeTasks = tasks.filter(t => t.status === 'In Progress');
  const priorities = ['All', 'Critical', 'High'];

  const filteredTasks = activeTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || task.ai_priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      <div className={styles.headerRow}>
        <div className={styles.header}>
          <Wrench size={28} color="var(--color-indigo)" />
          <span>Maintenance Task Queue</span>
        </div>
        <Badge status="purple">
          {activeTasks.length} Active Work Orders
        </Badge>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search tasks by title or location..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterChips}>
          <Filter size={14} color="var(--color-text-muted)" style={{ marginRight: '4px' }} />
          {priorities.map(prio => (
            <button 
              key={prio} 
              className={`${styles.chip} ${selectedPriority === prio ? styles.active : ''}`}
              onClick={() => setSelectedPriority(prio)}
            >
              {prio} Priority
            </button>
          ))}
        </div>
      </div>

      <div className={styles.taskList}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredTasks.length === 0 ? (
          <GlassCard accent="mint" style={{ textAlign: 'center', padding: '48px' }}>
            <ShieldCheck size={48} color="var(--color-mint)" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Queue Clear!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '6px' }}>
              All assigned maintenance tasks have been resolved.
            </p>
          </GlassCard>
        ) : filteredTasks.map(task => (
          <GlassCard 
            key={task.id} 
            accent={task.ai_priority === 'Critical' ? 'coral' : 'purple'} 
            className={styles.taskCard}
            onClick={() => setSelectedTicket(task)}
          >
            <div className={styles.taskInfo}>
              <div className={styles.taskHeader}>
                <div className={styles.taskTitle}>{task.title}</div>
                <Badge status={task.ai_priority === 'Critical' ? 'danger' : 'warning'}>
                  {task.ai_priority === 'Critical' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> Critical Priority
                    </span>
                  ) : 'High Priority'}
                </Badge>
                {task.ai_category && (
                  <Badge status="info">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} /> {task.ai_category}
                    </span>
                  </Badge>
                )}
              </div>

              <div className={styles.taskLocation}>
                <MapPin size={15} color="var(--color-text-muted)" />
                {task.location}
              </div>

              <div className={styles.taskDesc}>{task.description}</div>
            </div>
            
            <div className={styles.taskAction}>
              <BubblyButton variant="secondary" onClick={(e) => handleResolve(task.id, task.title, e)}>
                <CheckCircle2 size={18} /> Mark Resolved
              </BubblyButton>
            </div>
          </GlassCard>
        ))}
      </div>

      <TicketDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
