"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BubblyButton } from '../../components/BubblyButton';
import { Wrench, GraduationCap, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
import styles from './login.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginWithEmail = async (loginEmail: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) handleLoginWithEmail(email);
  };

  return (
    <div className={`animate-pop-in ${styles.container}`}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <Wrench size={26} color="var(--color-cyan)" />
          </div>
          <h1 className={styles.title}>Welcome to Fixora</h1>
          <p className={styles.subtitle}>Sign in to manage and resolve hostel complaints.</p>
        </div>
        
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
          </div>

          <BubblyButton type="submit" disabled={loading} variant="primary">
            {loading ? 'Logging in...' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Sign In <ArrowRight size={16} />
              </span>
            )}
          </BubblyButton>
        </form>

        <div className={styles.hintBox}>
          <HelpCircle size={15} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
          <span>Quick Role Demo: Select a role below for instant test switching.</span>
        </div>
        
        <div className={styles.roleGrid}>
          <button 
            type="button" 
            className={styles.roleBtn}
            onClick={() => handleLoginWithEmail('student@giki.edu.pk')}
          >
            <div className={styles.roleIconCircle} style={{ background: 'var(--color-mint-bg)', borderColor: 'var(--color-mint-border)' }}>
              <GraduationCap size={18} color="var(--color-mint)" />
            </div>
            <span>Student</span>
          </button>
          
          <button 
            type="button" 
            className={styles.roleBtn}
            onClick={() => handleLoginWithEmail('supervisor@giki.edu.pk')}
          >
            <div className={styles.roleIconCircle} style={{ background: 'var(--color-amber-bg)', borderColor: 'var(--color-amber-border)' }}>
              <ShieldCheck size={18} color="var(--color-amber)" />
            </div>
            <span>Supervisor</span>
          </button>
          
          <button 
            type="button" 
            className={styles.roleBtn}
            onClick={() => handleLoginWithEmail('maintenance@giki.edu.pk')}
          >
            <div className={styles.roleIconCircle} style={{ background: 'var(--color-indigo-bg)', borderColor: 'var(--color-indigo-border)' }}>
              <Wrench size={18} color="var(--color-indigo)" />
            </div>
            <span>Maintenance</span>
          </button>
        </div>
      </div>
    </div>
  );
}
