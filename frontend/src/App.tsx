import React from 'react';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { router } from './routes';

export default function App() {
  return (
    <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <FontSizeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </LanguageProvider>
    </React.StrictMode>
  );
}