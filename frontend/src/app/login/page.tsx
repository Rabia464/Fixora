"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, GraduationCap, ShieldCheck } from 'lucide-react';
import { Footer } from '../../components/Footer';
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
