import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('sp_theme') !== 'light');

  useEffect(() => {
    document.body.classList.toggle('light', !dark);
    localStorage.setItem('sp_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
