import { Component, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { GlassSurface } from '@/components/ui/GlassSurface'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-brand-primary-subtle/30">
          <GlassSurface className="w-full max-w-md p-6">
            <Alert
              variant="danger"
              title="Something went wrong"
              description={this.state.error?.message || 'An unexpected error occurred.'}
              className="mb-4"
            />
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
            >
              Reload Page
            </button>
          </GlassSurface>
        </div>
      )
    }

    return this.props.children
  }
}
