import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  },
  // Static palette — brand.red is the same in both modes
  colors: {
    brand: {
      red: '#c8102e',
    },
  },
  // Mode-responsive tokens — component props like color="brand.ink" resolve here
  semanticTokens: {
    colors: {
      brand: {
        paper: { default: '#f5f1ea', _dark: '#1C1814' },
        ink:   { default: '#111111', _dark: '#F0EBE0' },
        muted: { default: '#888888', _dark: '#7A7570' },
        rule:  { default: '#e0dbd2', _dark: '#2E2A24' },
        // Card/surface bg — white in light, elevated warm dark in dark
        card:  { default: '#ffffff', _dark: '#252119' },
      },
    },
  },
  radii: {
    none: '0',
    sm:   '2px',
    base: '3px',
    md:   '4px',
    lg:   '6px',
    xl:   '8px',
    '2xl': '12px',
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 1px 4px rgba(0,0,0,0.08)',
  },
  styles: {
    global: {
      body: {
        bg: 'brand.paper',
        color: 'brand.ink',
      },
    },
  },
});

export default theme;
