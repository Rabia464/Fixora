import { useState } from 'react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Text } from '@/components/ui/Text'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ShieldCheck } from 'lucide-react'
import { Icon } from '@/components/ui/Icon'

export function Login() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await authApi.login(email)
      setSession({ accessToken: response.access_token, role: response.role })
      // Immediately hydrate user profile so sidebar renders correct name/email
      const user = await authApi.me()
      setUser(user)
      // The RedirectIfAuthenticated guard re-evaluates on session change
      // and redirects to the role-appropriate dashboard automatically.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please verify your credentials.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-bg-app px-4 sm:px-8">
      <div className="w-full max-w-[400px]">

        {/* Brand Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary-subtle text-brand-primary">
            <Icon icon={ShieldCheck} size="lg" />
          </div>
          <Text
            variant="h1"
            as="h1"
            className="mb-1.5 text-neutral-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Campus Signal
          </Text>
          <Text variant="body-md" className="text-neutral-500">
            GIKI Hostel Complaint Management
          </Text>
        </div>

        {/* Login Card */}
        <GlassSurface elevation="modal" className="w-full p-6 sm:p-8">
          <h2 className="mb-6 text-body-lg font-semibold text-neutral-800">
            Sign in to continue
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {error && (
              <Alert
                variant="danger"
                description={error}
                onDismiss={() => setError(null)}
              />
            )}

            <Input
              label="Institutional Email"
              id="email"
              name="email"
              type="email"
              placeholder="yourname@giki.edu.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Use your official GIKI email address."
              required
              autoComplete="email"
              disabled={loading}
              autoFocus
            />

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full mt-1"
              loading={loading}
              disabled={!email.trim()}
            >
              Continue
            </Button>
          </form>
        </GlassSurface>

        {/* Footer */}
        <p className="mt-8 text-center text-caption text-neutral-400">
          Access restricted to authorised university members.
        </p>
      </div>
    </div>
  )
}
