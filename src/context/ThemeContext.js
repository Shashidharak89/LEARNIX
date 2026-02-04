"use client";
import { createContext, useContext, useState, useEffect, useSyncExternalStore } from "react";

const ThemeContext = createContext();

// Helper to get theme from localStorage (only runs on client)
function getSnapshot() {
  return localStorage.getItem("theme") || "light";
}

function getServerSnapshot() {
  return "light";
}

function subscribe(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ThemeProvider({ children }) {
  // Use useSyncExternalStore to read from localStorage without triggering cascading renders
  const storedTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, setTheme] = useState(storedTheme);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
