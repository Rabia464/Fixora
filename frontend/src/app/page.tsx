"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../components/GlassCard';
import { BubblyButton } from '../components/BubblyButton';
import styles from './page.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        throw new Error('Login failed. Ensure backend is running and email is valid.');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);

      // Route based on role
      if (data.role === 'Student') router.push('/dashboard/student');
      else if (data.role === 'Hostel Supervisor') router.push('/dashboard/supervisor');
      else if (data.role === 'Maintenance Office') router.push('/dashboard/maintenance');
      else router.push('/');
      
      // Force refresh to update Navbar
      window.location.reload();
      
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`animate-pop-in ${styles.container}`}>
      <GlassCard className={styles.loginCard}>
        <h1 className={styles.title}>Fixora</h1>
        <p className={styles.subtitle}>Hostel Complaint Management</p>
        
        <form onSubmit={handleLogin} className={styles.loginCard}>
          <div className={styles.inputGroup}>
            <input 
              type="email" 
              placeholder="Enter your GIKI Email" 
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <BubblyButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </BubblyButton>
        </form>
      </GlassCard>
    </div>
  );
}
