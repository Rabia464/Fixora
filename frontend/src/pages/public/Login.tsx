import { useState } from 'react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Text } from '@/components/ui/Text'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PublicNavbar } from '@/components/ui/PublicNavbar'
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
    <div className="flex min-h-screen w-full flex-col bg-bg-app">
      <PublicNavbar />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8">
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
              Fixora
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

      {/* Page footer */}
      <footer className="border-t border-neutral-200 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Text variant="caption" className="text-neutral-400">
            © {new Date().getFullYear()} Fixora. All rights reserved.
          </Text>
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-caption text-neutral-400 no-underline transition-colors hover:text-neutral-700 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
            aria-label="Fixora on GitHub"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

