// components/dashboard/ErrorBanner.tsx

'use client';

interface ErrorBannerProps {
  message: string;
  buttonText: string;
  onRetry: () => void;
}

export default function ErrorBanner({ message, buttonText, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-(--accent-red-border) bg-(--accent-red-bg) p-4">
      <p className="text-sm text-(--accent-red)">{message}</p>

      <button
        onClick={onRetry}
        className="rounded bg-(--accent-blue) px-3 py-1 text-sm text-(--text-inverse) hover:brightness-110"
      >
        {buttonText}
      </button>
    </div>
  );
}
