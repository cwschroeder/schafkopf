'use client';

import { hapticTap } from '@/lib/haptics';

type Period = 'alltime' | 'weekly' | 'monthly';

interface PeriodTabsProps {
  value: Period;
  onChange: (period: Period) => void;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'alltime', label: 'Gesamt' },
  { value: 'weekly', label: 'Diese Woche' },
  { value: 'monthly', label: 'Dieser Monat' },
];

export default function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  const handleChange = (period: Period) => {
    if (period !== value) {
      hapticTap();
      onChange(period);
    }
  };

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-amber-900/30">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => handleChange(period.value)}
          className={`
            flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all
            ${value === period.value
              ? 'bg-amber-700 text-white shadow-md'
              : 'text-amber-300 hover:bg-amber-800/50'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
