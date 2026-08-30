"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer, ToastMessage } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { Wrench, CheckCircle2, MapPin, AlertCircle, Zap, ShieldCheck, Search, Filter, PlayCircle, Clock } from 'lucide-react';
import { Complaint, complaintsApi } from '../../../lib/api/complaints';
import styles from './maintenance.module.css';

export default function MaintenanceDashboard() {
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchTasks = useCallback(() => {
    setLoading(true);
    complaintsApi
      .getMaintenanceComplaints()
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load maintenance complaints:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleStartWork = async (task: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionInProgress(task.id);
    try {
      await complaintsApi.updateProgress(task.id, { note: 'Technician dispatched on site' });
      addToast(`Work started on ticket "${task.title}"!`, 'info');
      fetchTasks();
    } catch (err: any) {
      addToast(err.message || 'Failed to update progress', 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenResolveModal = (task: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvingTicketId(task.id);
    setResolutionNote('');
  };

  const handleSubmitResolve = async (task: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      addToast('Please enter a resolution note (min 5 characters)', 'warning');
      return;
    }

    setActionInProgress(task.id);
    try {
      await complaintsApi.resolveComplaint(task.id, { resolution_note: resolutionNote });
      addToast(`Task "${task.title}" marked resolved!`, 'success');
      setResolvingTicketId(null);
      fetchTasks();
    } catch (err: any) {
      addToast(err.message || 'Failed to resolve task', 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const activeTasks = tasks.filter(t => t.status === 'Forwarded' || t.status === 'InProgress');
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filteredTasks = activeTasks.filter(task => {
    const priority = task.overridden_priority || task.ai_priority || 'Medium';
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.hostel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || priority === selectedPriority;
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
            placeholder="Search tasks by title, room, or hostel..." 
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
        ) : filteredTasks.map(task => {
          const isResolving = resolvingTicketId === task.id;
          const priority = task.overridden_priority || task.ai_priority || 'Medium';
          const category = task.overridden_category || task.ai_category || 'General';
          const isForwarded = task.status === 'Forwarded';

          return (
            <GlassCard 
              key={task.id} 
              accent={priority === 'Critical' ? 'coral' : isForwarded ? 'yellow' : 'purple'} 
              className={styles.taskCard}
              onClick={() => setSelectedTicket(task)}
            >
              <div className={styles.taskInfo}>
                <div className={styles.taskHeader}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <Badge status={priority === 'Critical' ? 'danger' : 'warning'}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {priority} Priority
                    </span>
                  </Badge>
                  <Badge status={isForwarded ? 'warning' : 'info'}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {isForwarded ? 'Forwarded (Unassigned)' : 'In Progress'}
                    </span>
                  </Badge>
                  {category && (
                    <Badge status="info">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} /> {category}
                      </span>
                    </Badge>
                  )}
                </div>

                <div className={styles.taskLocation}>
                  <MapPin size={15} color="var(--color-text-muted)" />
                  {task.location} • {task.hostel}
                </div>

                <div className={styles.taskDesc}>{task.description}</div>

                {isResolving && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      Resolution Notes (Required):
                    </label>
                    <textarea 
                      placeholder="e.g. Replaced faulty washer and cleared drain blockage"
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.2)' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <BubblyButton variant="primary" onClick={(e) => handleSubmitResolve(task, e)} disabled={actionInProgress === task.id}>
                        Submit Resolution
                      </BubblyButton>
                      <BubblyButton variant="ghost" onClick={(e) => { e.stopPropagation(); setResolvingTicketId(null); }}>
                        Cancel
                      </BubblyButton>
                    </div>
                  </div>
                )}
              </div>
              
              {!isResolving && (
                <div className={styles.taskAction}>
                  {isForwarded ? (
                    <BubblyButton 
                      variant="primary" 
                      onClick={(e) => handleStartWork(task, e)}
                      disabled={actionInProgress === task.id}
                    >
                      <PlayCircle size={18} /> Start Repair
                    </BubblyButton>
                  ) : (
                    <BubblyButton 
                      variant="secondary" 
                      onClick={(e) => handleOpenResolveModal(task, e)}
                      disabled={actionInProgress === task.id}
                    >
                      <CheckCircle2 size={18} /> Mark Resolved
                    </BubblyButton>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      <TicketDrawer 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onTicketUpdated={fetchTasks}
      />
    </div>
  );
}
