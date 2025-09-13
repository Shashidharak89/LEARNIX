"use client";
import { createContext, useContext, useState } from "react";

// Create Context
const ThemeContext = createContext();

// Provider Component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light"); // default = light

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for easy access
export function useTheme() {
  return useContext(ThemeContext);
}
