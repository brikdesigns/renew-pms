import { getAuthUser } from '@/lib/auth';

export default async function DashboardPage() {
  const authUser = await getAuthUser();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <p className="mt-2 text-gray-600">
        Welcome back, {authUser?.profile.first_name ?? authUser?.profile.email}
      </p>

      {/* Placeholder cards — will be replaced with BDS components */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Training Modules</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Staff</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Schedule</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
      </div>
    </div>
  );
}
