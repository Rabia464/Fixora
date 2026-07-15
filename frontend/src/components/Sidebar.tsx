"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Eye, Wrench, LogOut, KeyRound } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  // Still fetching role on client for Sidebar rendering. 
  // We could use cookies on server, but keeping sidebar client is fine for interactivity.
  useEffect(() => {
    // For the UI to know the role instantly, we can read a client-accessible way, 
    // but HTTP-only cookies can't be read. We will need an API call to get session info,
    // or we can pass it down from layout if layout reads cookies.
    // For now, let's fetch session info:
    const fetchSession = async () => {
      // In a real app we'd have a /api/auth/session endpoint.
      // Since we don't, and middleware protects routes, let's just infer from cookie on server
      // and pass down. But Sidebar is currently a Client Component.
      // Let's rely on a non-httpOnly cookie or just a safe API call.
      // Wait, we can just fetch /api/complaints and if it works, we have a role. 
      // This is a bit hacky. Let's create a quick session endpoint.
    };
    
    // Instead of doing it this way, let's temporarily check if we are on a dashboard path
    // and assume the role from the path since middleware enforces it.
    if (pathname.includes('/student')) setRole('Student');
    else if (pathname.includes('/supervisor')) setRole('Hostel Supervisor');
    else if (pathname.includes('/maintenance')) setRole('Maintenance Office');
    else setRole(null);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const NavItem = ({ icon: Icon, label, path, action }: any) => {
    const isActive = pathname === path;
    return (
      <button 
        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
        onClick={() => action ? action() : router.push(path)}
      >
        <Icon className={styles.icon} size={24} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} style={{cursor: 'pointer'}} onClick={() => router.push('/')}>Fixora</div>
      
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
        <NavItem icon={KeyRound} label="Login" path="/login" />
      )}
    </aside>
  );
};
