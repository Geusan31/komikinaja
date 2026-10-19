import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Label section untuk pesan error, mis. "Halaman Beranda". */
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary per area untuk mencegah blank screen saat sebuah
 * komponen tree gagal merender (mis. data tak terduga dari API).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold font-heading text-primary">
            Terjadi kesalahan pada {this.props.sectionName ?? 'halaman ini'}
          </h2>
          <p className="text-gray-600 max-w-md">
            Data gagal dimuat. Coba lagi, atau kembali ke beranda.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              Ke Beranda
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
