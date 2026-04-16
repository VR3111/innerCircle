import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Top-level class-based error boundary.
 *
 * React Router's ErrorBoundary (useRouteError) only catches errors thrown
 * inside route loaders and actions. This component catches errors thrown
 * during rendering — e.g. a Supabase response shape mismatch, missing env
 * vars causing a null-dereference, or any other unexpected runtime crash —
 * and shows a styled recovery screen instead of a blank page.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  // React.Component provides these at runtime; declare them here so TypeScript
  // is satisfied when @types/react is not installed in the project.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare context: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare setState: (...args: any[]) => void
  declare forceUpdate: () => void
  declare props: Readonly<Props>

  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[AppErrorBoundary] Unhandled render error:', error)
    console.error(info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
    // Navigate to root and do a hard reload so all state is fresh
    window.location.href = '/'
  }

  render() {
    if (this.state.error) {
      const isEnvError =
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY

      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
          <div className="w-full max-w-[360px] text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-[#E63946]/15 border border-[#E63946]/30 flex items-center justify-center mx-auto mb-6">
              <span className="font-['Outfit'] font-extrabold text-[#E63946] text-4xl leading-none">
                !
              </span>
            </div>

            <h1 className="font-['Unbounded'] font-bold text-white text-xl mb-3 leading-snug">
              Something went wrong
            </h1>

            {isEnvError ? (
              <p className="font-['DM_Sans'] text-white/50 text-sm leading-relaxed mb-8">
                Supabase environment variables are missing.
                <br />
                Add <code className="text-white/70 bg-white/8 px-1.5 py-0.5 rounded text-xs">VITE_SUPABASE_URL</code> and{' '}
                <code className="text-white/70 bg-white/8 px-1.5 py-0.5 rounded text-xs">VITE_SUPABASE_ANON_KEY</code>
                <br />
                to your Vercel environment variables.
              </p>
            ) : (
              <p className="font-['DM_Sans'] text-white/50 text-sm leading-relaxed mb-8">
                {this.state.error.message || 'An unexpected error occurred.'}
                <br />
                <span className="text-white/25 text-xs">
                  Try refreshing the page.
                </span>
              </p>
            )}

            <button
              onClick={this.handleReset}
              className="inline-block px-8 py-3 rounded-full bg-white text-black font-['Outfit'] font-bold text-sm hover:bg-white/90 active:scale-[0.97] transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
