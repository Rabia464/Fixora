import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth, RoleGuard } from '@/app/guards'
import { RouteStub } from '@/app/RouteStub'
import { UIShowcase } from '@/components/ui/UIShowcase'

import { Login } from '@/pages/public/Login'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { SupervisorLayout } from '@/components/layout/SupervisorLayout'
import { MaintenanceLayout } from '@/components/layout/MaintenanceLayout'

// ─── Shared ──────────────────────────────────────────────────────────────────
import { Notifications } from '@/pages/shared/Notifications'

// ─── Phase 5A — Student ───────────────────────────────────────────────────────
import { Dashboard } from '@/pages/student/Dashboard'
import { CreateComplaint } from '@/pages/student/CreateComplaint'
import { ComplaintDetail } from '@/pages/student/ComplaintDetail'

// ─── Phase 5B — Supervisor ────────────────────────────────────────────────────
import { SupervisorDashboard } from '@/pages/supervisor/Dashboard'
import { SupervisorComplaintsList } from '@/pages/supervisor/ComplaintsList'
import { SupervisorComplaintDetail } from '@/pages/supervisor/ComplaintDetail'

// ─── Phase 5B — Maintenance ───────────────────────────────────────────────────
import { MaintenanceDashboard } from '@/pages/maintenance/Dashboard'
import { MaintenanceQueue } from '@/pages/maintenance/Queue'
import { MaintenanceComplaintDetail } from '@/pages/maintenance/ComplaintDetail'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      // ─── Student Routes ────────────────────────────────────────────────
      {
        element: <RoleGuard allowedRoles={['Student']} />,
        children: [
          {
            path: '/student',
            element: <StudentLayout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'complaints/new', element: <CreateComplaint /> },
              { path: 'complaints/:id', element: <ComplaintDetail /> },
              { path: 'notifications', element: <Notifications /> },
            ],
          },
        ],
      },
      // ─── Supervisor Routes ─────────────────────────────────────────────
      {
        element: <RoleGuard allowedRoles={['Hostel Supervisor']} />,
        children: [
          {
            path: '/supervisor',
            element: <SupervisorLayout />,
            children: [
              { index: true, element: <SupervisorDashboard /> },
              { path: 'complaints', element: <SupervisorComplaintsList /> },
              { path: 'complaints/:id', element: <SupervisorComplaintDetail /> },
              { path: 'notifications', element: <Notifications /> },
            ],
          },
        ],
      },
      // ─── Maintenance Routes ────────────────────────────────────────────
      {
        element: <RoleGuard allowedRoles={['Maintenance Office']} />,
        children: [
          {
            path: '/maintenance',
            element: <MaintenanceLayout />,
            children: [
              { index: true, element: <MaintenanceDashboard /> },
              { path: 'assigned', element: <MaintenanceQueue mode="assigned" /> },
              { path: 'resolved', element: <MaintenanceQueue mode="resolved" /> },
              { path: 'complaints/:id', element: <MaintenanceComplaintDetail /> },
              { path: 'notifications', element: <Notifications /> },
            ],
          },
        ],
      },
    ],
  },
  /**
   * DEV ONLY — UI primitive showcase. No auth required.
   * Remove before production.
   */
  {
    path: '/dev/showcase',
    element: <UIShowcase />,
  },
  {
    path: '*',
    element: <RouteStub route="404 - Not Found" />,
  },
])
