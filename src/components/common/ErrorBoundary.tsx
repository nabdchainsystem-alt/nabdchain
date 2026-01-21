// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Warning } from 'phosphor-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-stone-500">
                    <Warning size={48} className="mb-4 text-amber-500" />
                    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                    <p className="text-sm mb-4 max-w-md">We encountered an error while rendering this view.</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded text-sm transition-colors"
                    >
                        Try Again
                    </button>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="mt-4 p-4 bg-stone-100 rounded text-xs text-left overflow-auto max-w-lg w-full">
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
