'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type CentralTheme = 'light' | 'dark';

interface CentralThemeContextType {
  theme: CentralTheme;
  toggleTheme: () => void;
  setTheme: (theme: CentralTheme) => void;
}

const CentralThemeContext = createContext<CentralThemeContextType | undefined>(
  undefined
);

export function CentralThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<CentralTheme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('central-theme') as CentralTheme | null;
    if (saved) setThemeState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-central-theme', theme);
    localStorage.setItem('central-theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  const setTheme = (t: CentralTheme) => setThemeState(t);

  return (
    <CentralThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </CentralThemeContext.Provider>
  );
}

export function useCentralTheme() {
  const ctx = useContext(CentralThemeContext);
  if (!ctx)
    throw new Error('useCentralTheme must be used within CentralThemeProvider');
  return ctx;
}
