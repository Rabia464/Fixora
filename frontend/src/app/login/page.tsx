"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../components/GlassCard';
import { BubblyButton } from '../../components/BubblyButton';
import styles from '../page.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        router.refresh();
        const data = await res.json();
        if (data.role === 'Student') router.push('/dashboard/student');
        else if (data.role === 'Hostel Supervisor') router.push('/dashboard/supervisor');
        else if (data.role === 'Maintenance Office') router.push('/dashboard/maintenance');
        else router.push('/');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className={`animate-pop-in ${styles.hero}`}>
      <h1 className={styles.headline}>Welcome to Fixora</h1>
      <p className={styles.subheadline}>Log in to manage hostel complaints.</p>
      
      <GlassCard className={styles.formCard}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email"
              className={styles.input} 
              placeholder="e.g. hassan@giki.edu.pk" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <small style={{color: 'var(--color-text-muted)', marginTop: '8px'}}>
              Hint: use <code>supervisor@giki.edu.pk</code> or <code>maintenance@giki.edu.pk</code> to test roles.
            </small>
          </div>
          <BubblyButton type="submit">{loading ? 'Logging in...' : 'Login'}</BubblyButton>
        </form>
      </GlassCard>
    </div>
  );
}
