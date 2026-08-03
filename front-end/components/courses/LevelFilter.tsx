// components/courses/LevelFilter.tsx

'use client';

import { useEffect, useRef, useState } from 'react';

interface LevelFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  labels: Record<string, string>;
}

export default function LevelFilterDropdown({ value, onChange, labels }: LevelFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = Object.entries(labels);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-(--border-card) bg-(--bg-secondary) px-4 py-2 text-sm text-(--text-primary) transition-colors hover:bg-(--bg-card-hover) light:bg-(--bg-card)"
      >
        {labels[value]}

        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-max min-w-[140px] overflow-hidden rounded-xl border border-(--border-card) bg-(--bg-card) shadow-lg backdrop-blur-sm light:backdrop-blur-none">
          {options.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`block w-full whitespace-nowrap px-4 py-2 text-left text-sm transition-colors ${
                value === key
                  ? 'bg-(--accent-blue-bg) text-(--accent-blue)'
                  : 'text-(--text-secondary) hover:bg-(--bg-secondary)'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
