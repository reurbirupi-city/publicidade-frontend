import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/10 transition-all group"
      title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon (Light Mode) */}
        <Sun 
          className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-0'
          }`}
        />
        
        {/* Moon Icon (Dark Mode) */}
        <Moon 
          className={`absolute inset-0 w-6 h-6 text-purple-400 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
