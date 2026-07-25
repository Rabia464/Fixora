import { Text } from '@/components/ui/Text'

/**
 * Developer placeholder for reserved routes.
 * Not an application page — no product UI.
 */
export function RouteStub({ route }: { route: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-app px-4">
      <div className="max-w-[var(--layout-form-max)] text-center">
        <Text variant="h2" className="text-brand-primary">
          Fixora
        </Text>
        <Text variant="body-md" className="mt-4 text-neutral-600">
          Route reserved: <span className="text-mono-md text-neutral-800">{route}</span>
        </Text>
        <Text variant="body-sm" className="mt-2 text-neutral-500">
          Application pages are not implemented yet. Foundation only.
        </Text>
      </div>
    </main>
  )
}
