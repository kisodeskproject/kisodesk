// components/lessons/DifficultyFilter.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface DifficultyFilterProps {
  value: string;
  onChange: (val: string) => void;
  labels: Record<string, string>;
}

const DifficultyFilter = ({ value, onChange, labels }: DifficultyFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = Object.entries(labels);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-(--bg-secondary) light:bg-(--bg-card) border border-(--border-card) rounded-lg px-4 py-2 text-sm text-(--text-primary) hover:bg-(--bg-card-hover) transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        {labels[value]}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[140px] w-max bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none border border-(--border-card) rounded-xl shadow-lg overflow-hidden z-50">
          {options.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm whitespace-nowrap transition-colors ${
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
};

export default DifficultyFilter;
