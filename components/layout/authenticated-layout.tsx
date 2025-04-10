'use client';

import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import TabNav from './tab-nav';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, signOut } = useSupabaseAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {user && (
        <div className="sticky top-0 z-50 bg-white">
          <header className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-semibold">AI Assistant</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </header>
          <TabNav />
        </div>
      )}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
} 