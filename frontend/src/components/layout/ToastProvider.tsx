import { useUiStore } from '@/stores/ui-store'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/cn'

export function ToastProvider() {
  const toasts = useUiStore((state) => state.toasts)
  const dismissToast = useUiStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3',
        'pointer-events-none',
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto shadow-surface rounded-md">
          <Alert
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onDismiss={() => dismissToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
