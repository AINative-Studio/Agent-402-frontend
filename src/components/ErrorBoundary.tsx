import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Update state with error info
        this.setState({
            errorInfo,
        });

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // In production, you could send error to logging service here
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    Something went wrong
                                </h1>
                                <p className="text-gray-400 mb-6">
                                    An unexpected error occurred in the application.
                                    Please try refreshing the page or go back to the home page.
                                </p>

                                {import.meta.env.DEV && this.state.error && (
                                    <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
                                        <p className="text-xs font-mono text-red-400 mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <details className="mt-2">
                                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                                    Stack trace
                                                </summary>
                                                <pre className="mt-2 text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={this.handleReset}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                        aria-label="Try again"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={this.handleReload}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                                        aria-label="Reload page"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reload Page
                                    </button>
                                    <button
                                        onClick={this.handleGoHome}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                                        aria-label="Go to home"
                                    >
                                        <Home className="w-4 h-4" />
                                        Go Home
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
