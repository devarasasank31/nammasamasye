'use client';

import AIChatbot from '@/components/AIChatbot';
import CookieConsent from '@/components/CookieConsent';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AIChatbot />
      <CookieConsent />
    </>
  );
}
