// app/[lang]/(auth)/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="light-uses-dark-surfaces">{children}</div>;
}
