import React, { createContext, useContext, useState } from 'react';

export type FontSize = 'sm' | 'md' | 'lg';

const LS_KEY = 'nl-font-size';

// Maps the three levels to Chakra fontSize tokens
export const FONT_SIZE_MAP: Record<FontSize, { zh: string; en: string }> = {
  sm: { zh: 'sm', en: 'xs' },
  md: { zh: 'md', en: 'sm' },
  lg: { zh: 'lg', en: 'md' },
};

interface Ctx {
  fontSize: FontSize;
  increase(): void;
  decrease(): void;
}

const FontSizeCtx = createContext<Ctx>({
  fontSize: 'sm',
  increase: () => {},
  decrease: () => {},
});

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem(LS_KEY) as FontSize | null) ?? 'sm';
  });

  const increase = () => setFontSize(f => {
    const next = f === 'sm' ? 'md' : 'lg';
    localStorage.setItem(LS_KEY, next);
    return next;
  });

  const decrease = () => setFontSize(f => {
    const next = f === 'lg' ? 'md' : 'sm';
    localStorage.setItem(LS_KEY, next);
    return next;
  });

  return (
    <FontSizeCtx.Provider value={{ fontSize, increase, decrease }}>
      {children}
    </FontSizeCtx.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeCtx);
