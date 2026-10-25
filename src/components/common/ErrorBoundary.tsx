import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-surface text-center select-none">
          <div className="w-10 h-10 rounded-full bg-error-container/40 flex items-center justify-center text-error mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface">
            {this.props.fallbackTitle || 'Navigation State Reset'}
          </h3>
          <p className="text-[12px] font-body-sm text-outline mt-1 max-w-xs">
            {this.state.error?.message || 'Recovering view smoothly...'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-code text-[11px] transition-colors shadow-xs border border-outline-variant/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
