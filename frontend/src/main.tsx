import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from './theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { SpeechProvider } from './contexts/SpeechContext';
import { FontSizeProvider } from './contexts/FontSizeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <>
    {/* Runs before React hydrates — prevents flash of wrong color mode */}
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <SpeechProvider>
            <FontSizeProvider>
              <App />
            </FontSizeProvider>
          </SpeechProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </React.StrictMode>
  </>
);
