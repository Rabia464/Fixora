import { LayoutDashboard, FileText, Bell } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import type { SidebarSection } from '@/components/ui/Sidebar'
import { useNavigate, useLocation } from 'react-router-dom'

export function SupervisorLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const sections: SidebarSection[] = [
    {
      title: 'Management',
      items: [
        {
          id: 'home',
          label: 'Dashboard',
          icon: LayoutDashboard,
          active: location.pathname === '/supervisor',
          onClick: () => navigate('/supervisor'),
        },
        {
          id: 'complaints',
          label: 'Complaints',
          icon: FileText,
          active: location.pathname.startsWith('/supervisor/complaints'),
          onClick: () => navigate('/supervisor/complaints'),
        },
        {
          id: 'notifications',
          label: 'Alerts',
          icon: Bell,
          active: location.pathname.startsWith('/supervisor/notifications'),
          onClick: () => navigate('/supervisor/notifications'),
        },
      ],
    },
  ]

  return <Shell sections={sections} />
}
