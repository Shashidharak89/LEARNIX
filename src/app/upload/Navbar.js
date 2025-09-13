"use client";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Menu, X, Sun, Moon } from "lucide-react"; // icons

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Navbar */}
      <nav
        className={`flex items-center justify-between px-6 py-4 shadow-md ${
          theme === "light" ? "bg-white text-black" : "bg-gray-900 text-white"
        }`}
      >
        {/* Logo */}
        <h1 className="text-2xl font-bold tracking-wide">LEARNIX</h1>

        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Hamburger */}
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      {isOpen && (
        <aside
          className={`fixed top-0 right-0 h-full w-64 shadow-lg transition-transform duration-300 ${
            theme === "light" ? "bg-white text-black" : "bg-gray-900 text-white"
          }`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Menu</h2>
            <button onClick={() => setIsOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <ul className="flex flex-col p-6 gap-4">
            <li className="cursor-pointer hover:underline">Home</li>
            <li className="cursor-pointer hover:underline">About</li>
            <li className="cursor-pointer hover:underline">Resources</li>
            <li className="cursor-pointer hover:underline">Contact</li>
          </ul>
        </aside>
      )}
    </>
  );
};
