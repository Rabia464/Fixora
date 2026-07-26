import { Home, FilePlus, Bell } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import type { SidebarSection } from '@/components/ui/Sidebar'
import { useNavigate, useLocation } from 'react-router-dom'

export function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const sections: SidebarSection[] = [
    {
      title: 'Dashboard',
      items: [
        {
          id: 'home',
          label: 'Overview',
          icon: Home,
          active: location.pathname === '/student',
          onClick: () => navigate('/student'),
        },
        {
          id: 'new-complaint',
          label: 'New Complaint',
          icon: FilePlus,
          active: location.pathname === '/student/complaints/new',
          onClick: () => navigate('/student/complaints/new'),
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          active: location.pathname.startsWith('/student/notifications'),
          onClick: () => navigate('/student/notifications'),
        },
      ],
    },
  ]

  return <Shell sections={sections} />
}
