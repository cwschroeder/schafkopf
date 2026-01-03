'use client';

import { hapticTap } from '@/lib/haptics';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function VolumeSlider({ value, onChange, disabled = false }: VolumeSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
  };

  const handleMouseUp = () => {
    hapticTap();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-amber-200">
          Lautstärke
        </label>
        <span className="text-sm text-amber-400">
          {value}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className={`
            flex-1 h-2 rounded-lg appearance-none cursor-pointer
            bg-amber-900/50
            accent-amber-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            background: `linear-gradient(to right, #d97706 0%, #d97706 ${value}%, rgba(139, 90, 43, 0.3) ${value}%, rgba(139, 90, 43, 0.3) 100%)`,
          }}
        />
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </div>
    </div>
  );
}
