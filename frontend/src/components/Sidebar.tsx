"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Eye, Wrench, LogOut, GraduationCap, ShieldCheck, Sun, Moon, Info } from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { role, user, logout, initialize } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    initialize();
    const savedTheme = (localStorage.getItem('fixora_theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [initialize]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('fixora_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };


  const getActiveTheme = (path: string) => {
    if (path.includes('/student')) return styles.studentActive;
    if (path.includes('/supervisor')) return styles.supervisorActive;
    if (path.includes('/maintenance')) return styles.maintenanceActive;
    return '';
  };

  const NavItem = ({ icon: Icon, label, path, action }: any) => {
    const isActive = pathname === path;
    const activeTheme = isActive ? getActiveTheme(path) : '';
    return (
      <button 
        className={`${styles.navLink} ${isActive ? styles.active : ''} ${activeTheme}`}
        onClick={() => action ? action() : router.push(path)}
      >
        <Icon className={styles.icon} size={20} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand} onClick={() => router.push('/')}>
        <div className={styles.logoIcon}>
          <Wrench size={20} color="#F0DFC0" strokeWidth={2.5} />
        </div>
        <span className={styles.logoText}>Fixora</span>
      </div>
      
      <NavItem icon={Home} label="Home" path="/" />
      
      {role === 'Student' && (
        <NavItem icon={LayoutDashboard} label="My Dashboard" path="/dashboard/student" />
      )}
      
      {role === 'Hostel Supervisor' && (
        <NavItem icon={Eye} label="Review Board" path="/dashboard/supervisor" />
      )}

      {role === 'Maintenance Office' && (
        <NavItem icon={Wrench} label="Task List" path="/dashboard/maintenance" />
      )}

      {role ? (
        <NavItem icon={LogOut} label="Logout" action={handleLogout} />
      ) : (
        <>
          <NavItem icon={Info} label="About Fixora" path="/about" />
        </>
      )}

      {/* Theme Switcher */}
      <button className={styles.themeToggleBtn} onClick={toggleTheme}>
        {theme === 'light' ? (
          <>
            <Moon size={18} color="var(--color-indigo)" />
            <span>Midnight Glass</span>
          </>
        ) : (
          <>
            <Sun size={18} color="var(--color-amber)" />
            <span>Daylight Glass</span>
          </>
        )}
      </button>

      {/* User Widget in Desktop Sidebar */}
      {role && (
        <div className={styles.userWidget}>
          <div className={styles.userWidgetHeader}>
            <div className={styles.userAvatar}>
              {role === 'Student' ? (
                <GraduationCap size={18} color="var(--color-mint)" />
              ) : role === 'Hostel Supervisor' ? (
                <ShieldCheck size={18} color="var(--color-amber)" />
              ) : (
                <Wrench size={18} color="var(--color-indigo)" />
              )}
            </div>
            <div>
              <div className={styles.userName}>
                {user?.full_name || (role === 'Student' ? 'Fixer Student' : role === 'Hostel Supervisor' ? 'Supervisor' : 'Maintenance')}
              </div>
              <div className={styles.userRoleTag}>
                {user?.hostel ? `${role} • ${user.hostel}` : role}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
