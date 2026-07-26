import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureApiClient } from '@/lib/api'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function ApiClientBridge({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => useAuthStore.getState().accessToken,
      onUnauthorized: () => useAuthStore.getState().clearSession(),
    })

    // Hydrate the user profile if we have a token but no user object
    // (e.g. after a page refresh where only the token was persisted)
    const { accessToken, user } = useAuthStore.getState()
    if (accessToken && !user) {
      authApi.me().then(setUser).catch(() => {
        // Token is invalid/expired — the 401 interceptor will clear the session
      })
    }
  }, [setUser])

  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientBridge>{children}</ApiClientBridge>
    </QueryClientProvider>
  )
}
