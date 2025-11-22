'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While checking auth, show nothing or a skeleton
  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto p-8 bg-[var(--bg-color)]">
        {children}
      </main>
    </div>
  );
}