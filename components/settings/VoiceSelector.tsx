'use client';

import { hapticTap } from '@/lib/haptics';

interface VoiceSelectorProps {
  value: 'male' | 'female';
  onChange: (value: 'male' | 'female') => void;
  disabled?: boolean;
}

export default function VoiceSelector({ value, onChange, disabled = false }: VoiceSelectorProps) {
  const handleChange = (newValue: 'male' | 'female') => {
    if (newValue !== value) {
      hapticTap();
      onChange(newValue);
    }
  };

  const buttonClass = (isSelected: boolean) =>
    `flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
      isSelected
        ? 'bg-amber-700 border-2 border-amber-500 text-white'
        : 'bg-amber-900/50 border border-amber-800 text-amber-300 hover:bg-amber-800/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-amber-200">
        TTS Stimme
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleChange('male')}
          disabled={disabled}
          className={buttonClass(value === 'male')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Männlich</span>
        </button>
        <button
          type="button"
          onClick={() => handleChange('female')}
          disabled={disabled}
          className={buttonClass(value === 'female')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Weiblich</span>
        </button>
      </div>
    </div>
  );
}
