import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation shell — will be replaced with BDS sidebar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Renew PMS</h1>
          <span className="text-sm text-gray-500">{authUser.profile.email}</span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
