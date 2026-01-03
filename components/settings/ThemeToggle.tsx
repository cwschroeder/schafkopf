'use client';

import { hapticTap } from '@/lib/haptics';

interface ThemeToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function ThemeToggle({ value, onChange, disabled = false }: ThemeToggleProps) {
  const handleToggle = () => {
    hapticTap();
    onChange(!value);
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="block text-sm font-medium text-amber-200">
          Dark Mode
        </label>
        <p className="text-xs text-amber-400/60 mt-0.5">
          Dunkles Farbschema verwenden
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-brown-900
          ${value ? 'bg-amber-600' : 'bg-amber-900/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
            transition duration-200 ease-in-out
            ${value ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
