'use client';

import AuthProvider from '@/components/providers/SessionProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </AuthProvider>
  );
} 