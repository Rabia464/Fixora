"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, GraduationCap, ShieldCheck, AlertCircle } from 'lucide-react';
import { Footer } from '../../components/Footer';
import { useAuthStore } from '../../stores/auth-store';
import styles from './login.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  const handleLoginWithEmail = async (loginEmail: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const role = await login(loginEmail);
      if (role === 'Student') router.push('/dashboard/student');
      else if (role === 'Hostel Supervisor') router.push('/dashboard/supervisor');
      else if (role === 'Maintenance Office') router.push('/dashboard/maintenance');
      else router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) handleLoginWithEmail(email);
  };


  return (
    <>
      <div className={styles.container}>

        {/* ── Brand header — slides in first ── */}
        <div className={styles.brandHeader}>
          <div className={styles.brandLogoWrap}>
            <Wrench size={26} color="#F0DFC0" strokeWidth={2.5} />
          </div>
          <h1 className={styles.brandTitle}>Fixora</h1>
          <p className={styles.brandSub}>GIKI Hostel Complaint Management</p>
        </div>

        {/* ── Login card — slides in second ── */}
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <h2 className={styles.title}>Welcome back</h2>
            <p className={styles.subtitle}>Sign in with your GIKI email</p>
          </div>
          
          <form onSubmit={handleFormSubmit} className={styles.formGroup}>
            {errorMessage && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className={styles.inputGroup}>
              <input 
                type="email"
                className={styles.input} 
                placeholder="Enter your GIKI email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" disabled={loading} className={styles.loginBtn}>
              {loading ? 'Logging in…' : 'Login'}
            </button>

            <p className={styles.roleSectionLabel}>or sign in as</p>

            {/* ── Role grid — pops in last ── */}
            <div className={styles.roleGrid}>
              <button 
                type="button" 
                className={styles.roleBtn}
                onClick={() => handleLoginWithEmail('student@giki.edu.pk')}
                title="Student"
              >
                <GraduationCap size={26} />
                <span>Student</span>
              </button>
              
              <button 
                type="button" 
                className={styles.roleBtn}
                onClick={() => handleLoginWithEmail('supervisor@giki.edu.pk')}
                title="Supervisor"
              >
                <ShieldCheck size={26} />
                <span>Supervisor</span>
              </button>
              
              <button 
                type="button" 
                className={styles.roleBtn}
                onClick={() => handleLoginWithEmail('maintenance@giki.edu.pk')}
                title="Maintenance"
              >
                <Wrench size={26} />
                <span>Maintenance</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
