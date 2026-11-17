import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import { ThemeProvider } from 'styled-components';
import { App } from './app/App';
import { GlobalStyle } from './app/styles/GlobalStyle';
import { theme } from './shared/theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
