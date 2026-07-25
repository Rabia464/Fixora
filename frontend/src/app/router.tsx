import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth } from '@/app/guards'
import { RouteStub } from '@/app/RouteStub'
import { UIShowcase } from '@/components/ui/UIShowcase'

/**
 * Routing skeleton — paths reserved for future screens.
 * No application pages are implemented.
 */
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
        element: <RouteStub route="/login" />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <RouteStub route="/app" />,
      },
      {
        path: '/app/complaints',
        element: <RouteStub route="/app/complaints" />,
      },
      {
        path: '/app/complaints/:id',
        element: <RouteStub route="/app/complaints/:id" />,
      },
      {
        path: '/app/maintenance',
        element: <RouteStub route="/app/maintenance" />,
      },
      {
        path: '/app/notifications',
        element: <RouteStub route="/app/notifications" />,
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
    element: <RouteStub route="404" />,
  },
])
