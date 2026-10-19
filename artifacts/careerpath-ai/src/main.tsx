import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem={false}
    storageKey="careerpath-ai-theme"
  >
    <App />
  </ThemeProvider>
</ErrorBoundary>
);




