// @ts-nocheck - Class components have type inference issues with strict mode
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Warning, ArrowClockwise, Bug, Copy, Check } from 'phosphor-react';
import { appLogger } from '../../utils/logger';
import { captureError, addBreadcrumb } from '../../utils/errorTracking';

interface Props {
    children: ReactNode;
    /** Fallback component to render on error */
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Identifier for this boundary (for debugging) */
    name?: string;
    /** Show detailed error in production */
    showDetails?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, copied: false };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log to console
        appLogger.error('Uncaught error:', error, errorInfo);

        // Track the error
        captureError(error, {
            severity: 'error',
            extra: {
                componentStack: errorInfo.componentStack,
                boundaryName: this.props.name,
            },
            tags: {
                type: 'react_error_boundary',
                boundary: this.props.name || 'unnamed',
            },
        });

        // Add breadcrumb
        addBreadcrumb(`Error caught in ${this.props.name || 'ErrorBoundary'}`, {
            error: error.message,
        });

        // Call custom handler
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    };

    handleCopyError = () => {
        if (!this.state.error) return;

        const errorText = [
            `Error: ${this.state.error.message}`,
            '',
            'Stack Trace:',
            this.state.error.stack || 'No stack trace available',
            '',
            'Component Stack:',
            this.state.errorInfo?.componentStack || 'No component stack available',
        ].join('\n');

        navigator.clipboard.writeText(errorText).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function') {
                    return this.props.fallback(this.state.error!, this.handleReset);
                }
                return this.props.fallback;
            }

            // Default fallback UI
            const showDetails = this.props.showDetails || import.meta.env.DEV;

            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
                    <div className="max-w-lg w-full">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Warning size={32} className="text-amber-500" weight="fill" />
                        </div>

                        {/* Error Message */}
                        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-center mb-6">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <ArrowClockwise size={16} />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                Reload Page
                            </button>
                            {showDetails && (
                                <button
                                    onClick={this.handleCopyError}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {this.state.copied ? <Check size={16} /> : <Copy size={16} />}
                                    {this.state.copied ? 'Copied!' : 'Copy Error'}
                                </button>
                            )}
                        </div>

                        {/* Error Details (Development) */}
                        {showDetails && this.state.error && (
                            <details className="text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2">
                                    <Bug size={14} />
                                    Show Technical Details
                                </summary>
                                <div className="mt-3 space-y-3">
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
                                            {this.state.error.toString()}
                                        </p>
                                    </div>
                                    {this.state.error.stack && (
                                        <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto max-h-48">
                                            {this.state.error.stack}
                                        </pre>
                                    )}
                                    {this.state.errorInfo?.componentStack && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Component Stack:</p>
                                            <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Functional wrapper for ErrorBoundary with hooks support
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    options?: Omit<Props, 'children'>
): React.FC<P> {
    const WrappedComponent: React.FC<P> = (props) => (
        <ErrorBoundary {...options}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
}
