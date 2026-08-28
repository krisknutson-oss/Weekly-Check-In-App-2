import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#121212] border border-[#1F1F1F] p-8 rounded-2xl shadow-2xl">
            <h1 className="font-serif italic text-2xl mb-3 text-[#D4AF37]">
              Something unexpected occurred.
            </h1>
            <p className="text-xs text-[#888888] font-mono mb-6 leading-relaxed">
              {this.state.error?.message || 'An error occurred while loading the application.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#D4AF37] text-black font-bold font-mono text-xs uppercase tracking-widest rounded-lg hover:bg-[#E5C158] transition cursor-pointer"
            >
              Reset &amp; Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

