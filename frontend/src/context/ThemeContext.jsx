import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

// Preference is 'light', 'dark' or 'system' (follow the OS). Matches the
// inline script in index.html, which applies it before React loads so there is
// no flash of the wrong theme.
const readPreference = () => {
  const stored = localStorage.getItem('theme');
  return stored === 'light' || stored === 'dark' ? stored : 'system';
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreferenceState] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const mql = media();
    const onChange = (e) => setSystemDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setPreference = (next) => {
    if (next === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', next);
    setPreferenceState(next);
  };

  const toggleTheme = () => setPreference(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
