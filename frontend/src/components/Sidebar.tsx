"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, [pathname]); // Re-check on route change

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const NavItem = ({ icon, label, path, action }: any) => {
    const isActive = pathname === path;
    return (
      <button 
        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
        onClick={() => action ? action() : router.push(path)}
      >
        <span className={styles.icon}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} style={{cursor: 'pointer'}} onClick={() => router.push('/')}>Fixora</div>
      
      <NavItem icon="🏠" label="Home" path="/" />
      
      {role === 'Student' && (
        <NavItem icon="📋" label="My Dashboard" path="/dashboard/student" />
      )}
      
      {role === 'Hostel Supervisor' && (
        <NavItem icon="👀" label="Review Board" path="/dashboard/supervisor" />
      )}

      {role === 'Maintenance Office' && (
        <NavItem icon="🔧" label="Task List" path="/dashboard/maintenance" />
      )}

      {role ? (
        <NavItem icon="🚪" label="Logout" action={handleLogout} />
      ) : (
        <NavItem icon="🔑" label="Login" path="/login" />
      )}
    </aside>
  );
};
