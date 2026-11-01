"use client"
import React, { useState, useCallback } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { TicketDrawer } from '../../../components/TicketDrawer';
import { ToastContainer } from '../../../components/Toast';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { Wrench, CheckCircle2, MapPin, AlertCircle, Zap, ShieldCheck, Search, Filter, PlayCircle, Clock } from 'lucide-react';
import { LoadError } from '../../../components/LoadError';
import { Complaint, complaintsApi } from '../../../lib/api/complaints';
import { useToast } from '../../../hooks/useToast';
import { useAsyncData } from '../../../hooks/useAsyncData';
import {
  byUrgency,
  clickableCardProps,
  effectiveCategory,
  effectivePriority,
  priorityTone,
  timeAgo,
} from '../../../lib/ui/ticket';
import styles from './maintenance.module.css';

const EMPTY_TASKS: Complaint[] = [];

export default function MaintenanceDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const { toasts, addToast, dismissToast } = useToast();

  const fetchTasks = useCallback(() => complaintsApi.getMaintenanceComplaints(), []);
  const { data: tasks, loading, error, reload } = useAsyncData(fetchTasks, EMPTY_TASKS);

  const handleStartWork = async (task: Complaint, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionInProgress(task.id);
    try {
      await complaintsApi.updateProgress(task.id, { note: 'Technician dispatched on site' });
      addToast(`Work started on ticket "${task.title}"!`, 'info');
      reload();
    } catch (err) {
      addToast((err instanceof Error ? err.message : 'Failed to update progress'), 'warning');
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
      reload();
    } catch (err) {
      addToast((err instanceof Error ? err.message : 'Failed to resolve task'), 'warning');
    } finally {
      setActionInProgress(null);
    }
  };

  const activeTasks = tasks.filter(t => t.status === 'Forwarded' || t.status === 'InProgress');
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const query = searchQuery.trim().toLowerCase();
  const filteredTasks = activeTasks
    .filter(task => {
      const matchesSearch = !query ||
        task.title.toLowerCase().includes(query) ||
        task.location.toLowerCase().includes(query) ||
        task.hostel.toLowerCase().includes(query);
      const matchesPriority = selectedPriority === 'All' || effectivePriority(task) === selectedPriority;
      return matchesSearch && matchesPriority;
    })
    // Most urgent first, oldest first within a priority, so nothing waits forever.
    .sort(byUrgency);
  const isFiltering = !!query || selectedPriority !== 'All';
  const criticalCount = activeTasks.filter(t => effectivePriority(t) === 'Critical').length;

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className={styles.headerRow}>
        <div className={styles.header}>
          <Wrench size={28} color="var(--color-indigo)" />
          <span>Maintenance Task Queue</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {criticalCount > 0 && (
            <Badge status="danger">{criticalCount} Critical</Badge>
          )}
          <Badge status="purple">
            {activeTasks.length} Active Work Orders
          </Badge>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text" 
            className={styles.searchInput} 
            aria-label="Search tasks"
            placeholder="Search tasks by title, room, or hostel..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterChips} role="group" aria-label="Filter by priority">
          <Filter size={14} color="var(--color-text-muted)" style={{ marginRight: '4px' }} />
          {priorities.map(prio => (
            <button 
              key={prio} 
              className={`${styles.chip} ${selectedPriority === prio ? styles.active : ''}`}
              aria-pressed={selectedPriority === prio}
              onClick={() => setSelectedPriority(prio)}
            >
              {prio === 'All' ? 'All priorities' : prio}
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
        ) : error ? (
          <LoadError message={error} onRetry={reload} />
        ) : filteredTasks.length === 0 ? (
          isFiltering ? (
            <GlassCard style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                No tasks match these filters.
              </p>
            </GlassCard>
          ) : (
            <GlassCard accent="mint" style={{ textAlign: 'center', padding: '48px' }}>
              <ShieldCheck size={48} color="var(--color-mint)" style={{ margin: '0 auto 12px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Queue Clear!</h2>
              <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '6px' }}>
                All assigned maintenance tasks have been resolved.
              </p>
            </GlassCard>
          )
        ) : filteredTasks.map(task => {
          const isResolving = resolvingTicketId === task.id;
          const priority = effectivePriority(task);
          const category = effectiveCategory(task);
          const isForwarded = task.status === 'Forwarded';
          const openTask = () => setSelectedTicket(task);

          return (
            <GlassCard 
              key={task.id} 
              accent={priority === 'Critical' ? 'coral' : isForwarded ? 'yellow' : 'purple'} 
              className={styles.taskCard}
              onClick={openTask}
              {...clickableCardProps(openTask, `Open task: ${task.title}`)}
            >
              <div className={styles.taskInfo}>
                <div className={styles.taskHeader}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <Badge status={priorityTone(priority)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {priority} Priority
                    </span>
                  </Badge>
                  <Badge status={isForwarded ? 'warning' : 'info'}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {isForwarded ? 'Not started' : 'In progress'}
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
                  <span title={new Date(task.created_at).toLocaleString()} style={{ marginLeft: '8px' }}>
                    • reported {timeAgo(task.created_at)}
                  </span>
                </div>

                <div className={styles.taskDesc}>{task.description}</div>

                {isResolving && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                    <label htmlFor={`resolution-${task.id}`} style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      Resolution Notes (Required):
                    </label>
                    <textarea 
                      id={`resolution-${task.id}`}
                      placeholder="e.g. Replaced faulty washer and cleared drain blockage"
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)', fontFamily: 'inherit' }}
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
        onTicketUpdated={reload}
        onNotify={addToast}
      />
    </div>
  );
}
