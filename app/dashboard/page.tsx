/**
 * Protected dashboard page
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/ui/Logo';
import { SignOutButton } from '@/components/dashboard/SignOutButton';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth');
  }

  // Get profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single();

  const profile = profileData as { full_name: string | null; email: string | null; role: string } | null;

  if (profileError || !profile) {
    console.error('Profile error:', profileError);
    redirect('/auth?error=profile_not_found');
  }

  // Check if role is assigned
  if (!profile.role) {
    redirect('/onboarding');
  }

  const isCurator = profile.role === 'curator';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo variant="lime" size="md" />
              <span className="text-xl font-bold text-gray-900">Adapt</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isCurator 
                    ? 'bg-[#C8F65D] bg-opacity-20 text-gray-900' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isCurator ? '💼 Curator' : '👤 Employee'}
                </span>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.full_name || 'there'}! 👋
          </h1>
          <p className="text-gray-600">
            {isCurator 
              ? 'Manage your training courses and track employee progress' 
              : 'Access your assigned courses and track your learning progress'}
          </p>
        </div>

        {/* Role-specific Content */}
        {isCurator ? (
          <div className="space-y-6">
            {/* Curator Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Courses</h3>
                  <div className="w-10 h-10 bg-[#C8F65D] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">No courses yet</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Active Employees</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">👥</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">No employees enrolled</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">-%</p>
                <p className="text-sm text-gray-500 mt-1">No data available</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-[#C8F65D] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🚀</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Course Management Coming Soon
                </h2>
                <p className="text-gray-600 mb-6">
                  Create AI-powered training courses, upload company documents, and track employee progress. These features will be available in Stage 3.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Stay tuned for updates
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Employee Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Assigned Courses</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">No courses assigned</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Completed</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Nothing completed yet</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Your Progress</h3>
                  <div className="w-10 h-10 bg-[#C8F65D] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0%</p>
                <p className="text-sm text-gray-500 mt-1">Start learning today</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📖</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Courses Will Appear Here
                </h2>
                <p className="text-gray-600 mb-6">
                  Once your curator assigns training courses to you, they&apos;ll show up here. You&apos;ll be able to complete interactive quizzes and track your progress.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Check back soon
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
