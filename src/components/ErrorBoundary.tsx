import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Ocorreu um erro inesperado na interface.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[MatchBook ErrorBoundary]', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
          role="alert"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h1 className="font-display italic text-2xl sm:text-3xl mb-2">
            Algo saiu do esperado
          </h1>
          <p className="text-sm max-w-md mb-6" style={{ color: 'var(--text-secondary)' }}>
            {this.state.message}
          </p>
          <button
            onClick={this.handleReload}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar MatchBook</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
