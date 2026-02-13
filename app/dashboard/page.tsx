/**
 * Protected dashboard page
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SignOutButton } from '@/components/dashboard/SignOutButton';
import { CourseCodeEntry } from '@/components/employee/CourseCodeEntry';

function LogoMark() {
  return (
    <div className="w-9 h-9 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center">
      <span className="font-display font-bold text-lime text-lg">A</span>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth');
  }

  // Use service role key to bypass RLS for profile read
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Get profile using admin client
  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle();

  const profile = profileData as { full_name: string | null; email: string | null; role: string | null } | null;

  // If no role, redirect to role selection
  if (!profile || !profile.role) {
    redirect('/auth/role');
  }

  // Use role from profile or default to curator
  const role = profile?.role || 'curator';
  const isCurator = role === 'curator';

  // Curators have a dedicated cabinet — send them there directly
  if (isCurator) {
    redirect('/curator/courses');
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Пользователь';
  const displayEmail = profile?.email || user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="font-display text-xl font-bold text-gray-900">Adapt</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{displayEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isCurator 
                    ? 'bg-lime/20 text-gray-900' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isCurator ? '💼 Куратор' : '👤 Сотрудник'}
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
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            С возвращением, {displayName}! 👋
          </h1>
          <p className="text-gray-600">
            {isCurator 
              ? 'Управляйте курсами и отслеживайте прогресс сотрудников' 
              : 'Проходите назначенные курсы и следите за своим прогрессом'}
          </p>
        </div>

        {/* Role-specific Content */}
        {isCurator ? (
          <div className="space-y-6">
            {/* Curator Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Всего курсов</h3>
                  <div className="w-10 h-10 bg-lime/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Пока нет курсов</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Активных сотрудников</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">👥</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Нет записанных сотрудников</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Процент завершения</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">—%</p>
                <p className="text-sm text-gray-500 mt-1">Нет данных</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-lime/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🚀</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
                  Управление курсами скоро появится
                </h2>
                <p className="text-gray-600 mb-6">
                  Создавайте ИИ-курсы, загружайте документы компании и отслеживайте прогресс сотрудников. Эти функции появятся в следующем обновлении.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Следите за обновлениями
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Employee Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Назначено курсов</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Пока нет курсов</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Завершено</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Пока ничего не завершено</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Ваш прогресс</h3>
                  <div className="w-10 h-10 bg-lime/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0%</p>
                <p className="text-sm text-gray-500 mt-1">Начните обучение</p>
              </div>
            </div>

            <CourseCodeEntry />
          </div>
        )}
      </main>
    </div>
  );
}
