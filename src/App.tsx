import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
}