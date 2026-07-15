"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import { Wrench, CheckCircle2 } from 'lucide-react';
import styles from './maintenance.module.css';

export default function MaintenanceDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  const handleResolve = async (id: number) => {
    await fetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Resolved' })
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
    router.refresh();
  };

  const activeTasks = tasks.filter(t => t.status === 'In Progress');

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'}}>
        <Wrench size={32} color="var(--color-primary-dark)" />
        <h1 className={styles.header}>Active Task List</h1>
      </div>

      <div className={styles.taskList}>
        {loading ? <p>Loading tasks...</p> : activeTasks.length === 0 ? (
          <GlassCard style={{textAlign: 'center', padding: '64px'}}>
            <CheckCircle2 size={64} color="var(--color-success)" style={{margin: '0 auto 16px'}} />
            <h2>Inbox Zero!</h2>
            <p style={{color: 'var(--color-text-muted)'}}>No active tasks right now.</p>
          </GlassCard>
        ) : activeTasks.map(task => (
          <GlassCard key={task.id} className={styles.taskCard}>
            <div className={styles.taskInfo}>
              <div className={styles.taskHeader}>
                <div className={styles.taskTitle}>{task.title}</div>
                <Badge status={task.ai_priority === 'Critical' ? 'danger' : 'warning'}>
                  {task.ai_priority}
                </Badge>
              </div>
              <div className={styles.taskLocation}>📍 {task.location}</div>
              <div className={styles.taskDesc}>{task.description}</div>
            </div>
            
            <div className={styles.taskAction}>
              <BubblyButton onClick={() => handleResolve(task.id)}>
                <CheckCircle2 size={18} style={{marginRight: '8px', verticalAlign: 'text-bottom'}} />
                Mark Resolved
              </BubblyButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
