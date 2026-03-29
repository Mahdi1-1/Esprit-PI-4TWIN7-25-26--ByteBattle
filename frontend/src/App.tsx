import React from 'react';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { EditorThemeProvider } from './context/EditorThemeContext';
import { router } from './routes';
import { Toaster } from 'react-hot-toast';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <h1 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h1>
            <p className="mb-4 text-gray-300">We're sorry, but an unexpected error occurred.</p>
            <pre className="bg-black/50 p-4 rounded text-sm overflow-auto mb-6 text-red-400 font-mono">
              {this.state.error?.message}
            </pre>
            <button
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <LanguageProvider>
          <FontSizeProvider>
            <AuthProvider>
              <ThemeProvider>
                <EditorThemeProvider>
                  <RouterProvider router={router} />
                  <Toaster position="bottom-right" />
                </EditorThemeProvider>
              </ThemeProvider>
            </AuthProvider>
          </FontSizeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}