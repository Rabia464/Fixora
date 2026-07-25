import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth-store'

/** Protects authenticated app routes. No page UI — outlet only. */
export function RequireAuth() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/** Sends authenticated users away from public auth routes. */
export function RedirectIfAuthenticated() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }
  return <Outlet />
}
