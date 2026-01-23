// @ts-nocheck
import React from 'react';
import { Warning, ArrowsClockwise } from 'phosphor-react';
import { appLogger } from '../../utils/logger';

interface Props {
    children: React.ReactNode;
    featureName: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        appLogger.error(`[${this.props.featureName}] Error:`, error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-4 mb-4">
                        <Warning size={32} className="text-amber-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {this.props.featureName} encountered an error
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                        Something went wrong while loading this feature. Your other features are still working normally.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <ArrowsClockwise size={16} />
                        Try Again
                    </button>
                    {import.meta.env.DEV && this.state.error && (
                        <details className="mt-6 w-full max-w-lg text-left">
                            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                                Show error details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                                {this.state.error.toString()}
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
