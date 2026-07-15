"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Basic auth check
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Fixora</div>
      {role && (
        <div className={styles.user}>
          <span>{role}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};
