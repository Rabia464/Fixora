import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Navbar } from '@/components/ui/Navbar'
import { Sidebar, type SidebarSection } from '@/components/ui/Sidebar'
import { Icon } from '@/components/ui/Icon'
import { ToastProvider } from '@/components/layout/ToastProvider'
import { GlobalErrorBoundary } from '@/components/layout/GlobalErrorBoundary'
import { useAuthStore } from '@/stores/auth-store'

interface ShellProps {
  sections: SidebarSection[]
}

export function Shell({ sections }: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const handleLogout = () => {
    clearSession()
  }

  const footerAction = (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md px-3 text-danger-default',
        'hover:bg-danger-default/10 focus:outline-none focus:shadow-[var(--color-focus-ring)]',
        'transition-colors duration-[var(--motion-fast)]',
      )}
    >
      <Icon icon={LogOut} size="sm" />
      <span className="text-body-sm font-medium">Log out</span>
    </button>
  )

  const sidebarElement = (
    <Sidebar
      sections={sections}
      userEmail={user?.email}
      userRole={user?.role_id}
      footer={footerAction}
    />
  )

  return (
    <GlobalErrorBoundary>
      <div className="flex h-screen w-full bg-bg-app overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden h-full md:block shrink-0 z-30">
          {sidebarElement}
        </div>

        {/* Mobile Sidebar Drawer (using Dialog primitive overlay logic) */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 z-50 w-[240px] shadow-modal transition-transform">
              {sidebarElement}
            </div>
          </div>
        )}

        {/* Main Content Wrapper */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Navbar
            onProfileClick={() => {}}
            actions={
              <button
                type="button"
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-hover-surface"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Icon icon={Menu} size="md" />
              </button>
            }
          />

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
        <ToastProvider />
      </div>
    </GlobalErrorBoundary>
  )
}
