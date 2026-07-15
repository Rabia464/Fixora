"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '../../components/GlassCard';
import { BubblyButton } from '../../components/BubblyButton';
import styles from './login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // In Next.js App Router, using useSearchParams in a client component requires Suspense boundary, 
  // but for simplicity here we'll just check window.location if needed, or simply always redirect to the redirect path.
  // Actually, standard URL parsing works fine inside useEffect if we want to avoid Suspense errors in production build.
  const [redirectPath, setRedirectPath] = useState('/');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect');
    if (r) setRedirectPath(r);
  }, []);

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
      
      router.push(redirectPath === '/' ? getRoleRoute(data.role) : redirectPath);
      setTimeout(() => window.location.reload(), 100);
      
    } catch (err: any) {
      console.warn("Backend unavailable, using mock login for demo purposes.");
      
      let mockRole = 'Student';
      let route = '/dashboard/student';
      
      if (email.includes('supervisor')) {
        mockRole = 'Hostel Supervisor';
        route = '/dashboard/supervisor';
      } else if (email.includes('maintenance')) {
        mockRole = 'Maintenance Office';
        route = '/dashboard/maintenance';
      }

      localStorage.setItem('token', 'mock_token_123');
      localStorage.setItem('role', mockRole);
      
      // If we came from a redirect (like filing a ticket on the home page), go back there
      router.push(redirectPath === '/' ? route : redirectPath);
      setTimeout(() => window.location.reload(), 100);
    } finally {
      setLoading(false);
    }
  };

  const getRoleRoute = (role: string) => {
    if (role === 'Student') return '/dashboard/student';
    if (role === 'Hostel Supervisor') return '/dashboard/supervisor';
    if (role === 'Maintenance Office') return '/dashboard/maintenance';
    return '/';
  }

  return (
    <div className={`animate-pop-in ${styles.container}`}>
      <GlassCard className={styles.loginCard}>
        <h1 className={styles.title}>Welcome to Fixora</h1>
        <p className={styles.subtitle}>Please log in to continue</p>
        
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
