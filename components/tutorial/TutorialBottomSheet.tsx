'use client';

import { ReactNode } from 'react';

interface TutorialBottomSheetProps {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
}

export default function TutorialBottomSheet({
  children,
  title,
  onClose,
}: TutorialBottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 bottom-sheet-backdrop z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet safe-area-bottom max-h-[85vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          borderTop: '2px solid rgba(139,90,43,0.5)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle-Bar */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-inherit z-10">
          <div
            className="w-12 h-1 rounded-full"
            style={{ background: 'rgba(139,90,43,0.5)' }}
          />
        </div>

        <div className="px-4 pb-6 pt-2">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-amber-400">{title}</h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  &times;
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
