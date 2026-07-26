import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth-store'
import type { UserRole } from '@/types/api'

/** Protects authenticated app routes. No page UI — outlet only. */
export function RequireAuth() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/** Protects routes based on user role. Must be used inside RequireAuth. */
export function RoleGuard({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const role = useAuthStore((state) => state.role)
  
  if (!role || !allowedRoles.includes(role)) {
    // If authenticated but unauthorized, push to their root to avoid loops
    if (role === 'Student') return <Navigate to="/student" replace />
    if (role === 'Hostel Supervisor') return <Navigate to="/supervisor" replace />
    if (role === 'Maintenance Office') return <Navigate to="/maintenance" replace />
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/** Sends authenticated users away from public auth routes to their correct dashboard. */
export function RedirectIfAuthenticated() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const role = useAuthStore((state) => state.role)
  
  if (isAuthenticated && role) {
    switch (role) {
      case 'Student': return <Navigate to="/student" replace />
      case 'Hostel Supervisor': return <Navigate to="/supervisor" replace />
      case 'Maintenance Office': return <Navigate to="/maintenance" replace />
    }
  }
  
  return <Outlet />
}
