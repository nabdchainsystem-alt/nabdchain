import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './auth-adapter';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Show error in UI for debugging
function showError(message: string, error?: Error) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, sans-serif; padding: 20px; text-align: center;">
        <h1 style="color: #EF4444; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #6B7280; margin-bottom: 8px;">${message}</p>
        ${error ? `<p style="color: #9CA3AF; font-size: 12px; margin-bottom: 16px;">${error.message}</p>` : ''}
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  // Remove the initial HTML loader since React is mounting
  const initialLoader = document.getElementById('initial-loader');
  if (initialLoader) {
    initialLoader.remove();
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to initialize app:', error);
  showError('Failed to initialize application', error instanceof Error ? error : undefined);
}
