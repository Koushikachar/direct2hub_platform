"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isManual: boolean;
  toggleTheme: () => void;
  useAutoTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "d2h-theme";
const STORAGE_MANUAL_KEY = "d2h-theme-manual";

// Same logic as the inline no-flash script in layout.tsx — kept in sync so
// re-computation on the client always agrees with the very first paint.
// 6:00–18:00 local device time => light, otherwise => dark.
function timeBasedTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const storedManual = localStorage.getItem(STORAGE_MANUAL_KEY) === "1";
    const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = storedManual && storedTheme ? storedTheme : timeBasedTheme();
    setTheme(initial);
    setIsManual(storedManual);
    applyTheme(initial);

    // Re-check the auto theme every few minutes so a page left open across
    // sunrise/sunset (or midnight) still flips on its own, unless the
    // person has manually pinned a theme.
    const interval = setInterval(() => {
      setIsManual((manual) => {
        if (!manual) {
          const auto = timeBasedTheme();
          setTheme(auto);
          applyTheme(auto);
        }
        return manual;
      });
    }, 5 * 60_000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(STORAGE_MANUAL_KEY, "1");
      setIsManual(true);
      return next;
    });
  }, []);

  const useAutoTheme = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_MANUAL_KEY);
    const auto = timeBasedTheme();
    setTheme(auto);
    setIsManual(false);
    applyTheme(auto);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isManual, toggleTheme, useAutoTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
