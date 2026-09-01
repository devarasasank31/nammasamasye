'use client';

import AIChatbot from '@/components/AIChatbot';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AIChatbot />
    </>
  );
}
