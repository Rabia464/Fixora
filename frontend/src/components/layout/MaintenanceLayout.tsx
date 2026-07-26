import { Activity, Wrench, CheckCircle, Bell } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import type { SidebarSection } from '@/components/ui/Sidebar'
import { useNavigate, useLocation } from 'react-router-dom'

export function MaintenanceLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const sections: SidebarSection[] = [
    {
      title: 'Operations',
      items: [
        {
          id: 'home',
          label: 'Dashboard',
          icon: Activity,
          active: location.pathname === '/maintenance',
          onClick: () => navigate('/maintenance'),
        },
        {
          id: 'assigned',
          label: 'Assigned',
          icon: Wrench,
          // Also active when viewing a complaint detail
          active:
            location.pathname.startsWith('/maintenance/assigned') ||
            location.pathname.startsWith('/maintenance/complaints'),
          onClick: () => navigate('/maintenance/assigned'),
        },
        {
          id: 'resolved',
          label: 'Resolved',
          icon: CheckCircle,
          active: location.pathname.startsWith('/maintenance/resolved'),
          onClick: () => navigate('/maintenance/resolved'),
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          active: location.pathname.startsWith('/maintenance/notifications'),
          onClick: () => navigate('/maintenance/notifications'),
        },
      ],
    },
  ]

  return <Shell sections={sections} />
}
