"use client"
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { BubblyButton } from '../../../components/BubblyButton';
import { Badge } from '../../../components/Badge';
import styles from './maintenance.module.css';

export default function MaintenanceDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for UI demonstration
    setTasks([
      { id: '1', title: 'Leaking Pipe in Room 204', location: 'Hostel A, Room 204', status: 'Forwarded', priority: 'High' },
      { id: '2', title: 'Fix AC in Hall', location: 'Main Hall', status: 'In Progress', priority: 'Medium' }
    ]);
  }, []);

  const handleResolve = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
  };

  return (
    <div className={`animate-pop-in ${styles.dashboard}`}>
      <h1 className={styles.header}>Maintenance Task List</h1>
      
      <div className={styles.list}>
        {tasks.map(task => (
          <GlassCard key={task.id} className={styles.taskCard}>
            <div className={styles.taskInfo}>
              <div className={styles.taskTitle}>{task.title}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{task.location}</div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={task.status === 'Resolved' ? 'success' : task.status === 'In Progress' ? 'info' : 'warning'}>
                  {task.status}
                </Badge>
              </div>
            </div>
            
            <div className={styles.actions}>
              {task.status !== 'Resolved' && (
                <BubblyButton onClick={() => handleResolve(task.id)}>Mark Resolved</BubblyButton>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
