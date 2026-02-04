import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { FontSizeProvider } from './context/FontSizeContext';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <FontSizeProvider>
        <RouterProvider router={router} />
      </FontSizeProvider>
    </ThemeProvider>
  );
}