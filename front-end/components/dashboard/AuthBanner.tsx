// components/dashboard/AuthBanner.tsx

'use client';

import { LogIn } from 'lucide-react';

interface AuthBannerProps {
  message: string;
  buttonText: string;
  onSignIn: () => void;
}

export default function AuthBanner({ message, buttonText, onSignIn }: AuthBannerProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-(--accent-blue-border) bg-(--accent-blue-bg) p-4 sm:flex-row sm:items-center light:border-blue-500 light:bg-blue-950">
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 text-(--accent-blue)" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>

        <p className="text-sm text-(--accent-blue)">{message}</p>
      </div>

      <button
        onClick={onSignIn}
        className="inline-flex items-center whitespace-nowrap rounded-lg bg-blue-600/85 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 light:bg-blue-600"
      >
        <LogIn className="mr-2 h-4 w-4" />
        {buttonText}
      </button>
    </div>
  );
}
