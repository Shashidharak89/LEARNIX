"use client";
import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme === "light" ? "bg-white text-black" : "bg-black text-white"
      }`}
    >
      <h1 className="text-3xl font-bold mb-4">Hello there..!</h1>
      <p className="mb-4">Current theme: {theme}</p>

      <button
        onClick={toggleTheme}
        className="px-4 py-2 rounded bg-blue-500 text-white"
      >
        Toggle Theme
      </button>
    </div>
  );
}
