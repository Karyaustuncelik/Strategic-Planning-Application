import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, ShieldCheck, Users } from 'lucide-react';
import { fetchAuthOptions, login } from '../lib/api';
import { useI18n } from '../i18n';
import { AuthSession, LoginMode, ViewerAccount } from '../types';

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t } = useI18n();
  const [activeMode, setActiveMode] = useState<LoginMode | null>(null);
  const [viewerAccounts, setViewerAccounts] = useState<ViewerAccount[]>([]);
  const [viewerPasswordHint, setViewerPasswordHint] = useState('viewer123');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [selectedViewerId, setSelectedViewerId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [viewerPassword, setViewerPassword] = useState('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      setIsLoadingAccounts(true);
      setError(null);

      try {
        const options = await fetchAuthOptions({
        });

        if (!isMounted) return;

        setViewerAccounts(options.viewerAccounts);
        setViewerPasswordHint(options.viewerPasswordHint || 'viewer123');
        setAdminUsername(options.adminUsername || 'admin');
        setSelectedViewerId((current) =>
          current || options.viewerAccounts[0]?.id || ''
        );
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Login options could not be loaded'
        );
        setViewerAccounts([]);
      } finally {
        if (isMounted) {
          setIsLoadingAccounts(false);
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedViewer = useMemo(
    () => viewerAccounts.find((account) => account.id === selectedViewerId) ?? null,
    [selectedViewerId, viewerAccounts]
  );

  const resetErrors = () => setError(null);

  const handleAdminSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await login({
        loginMode: 'admin',
        username: adminUsername,
        password: adminPassword,
      });
      onLogin(session);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Admin login failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedViewerId) {
      setError('Please choose a team member account.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const session = await login({
        loginMode: 'viewer',
        viewerId: selectedViewerId,
        password: viewerPassword,
      });
      onLogin(session);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Viewer login failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,39,118,0.18),_transparent_35%),linear-gradient(135deg,_#f4f8fc_0%,_#ffffff_48%,_#e4ecf8_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <Building2 className="h-4 w-4" />
                {t('Strategic Planning Tracking System')}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    resetErrors();
                    setActiveMode('admin');
                  }}
                  className={`rounded-3xl border p-5 text-left transition-all ${
                    activeMode === 'admin'
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    {t('Admin Login')}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t('Goal creation, task assignment, analytics, and calendar settings.')}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetErrors();
                    setActiveMode('viewer');
                  }}
                  className={`rounded-3xl border p-5 text-left transition-all ${
                    activeMode === 'viewer'
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-8 w-8 text-blue-600" />
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    {t('Team Member Login')}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t('Assigned tasks, goals, timeline, and progress tracking.')}
                  </p>
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)]">
            {!activeMode && (
              <div className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-slate-900">
                  {t('Choose a sign-in type')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t(
                    'The form on the right updates based on whether you choose admin or team member access.'
                  )}
                </p>
              </div>
            )}

            {activeMode === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="flex h-full flex-col">
                <button
                  type="button"
                  onClick={() => {
                    resetErrors();
                    setActiveMode(null);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('Back')}
                </button>

                <h2 className="mt-6 text-2xl font-semibold text-slate-900">
                  {t('Admin Login')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t('This sign-in opens the full management workspace.')}
                </p>

                <label className="mt-6 text-sm font-medium text-slate-700">
                  {t('Username')}
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(event) => setAdminUsername(event.target.value)}
                  className="mt-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="admin"
                  required
                />

                <label className="mt-4 text-sm font-medium text-slate-700">
                  {t('Password')}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  className="mt-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="admin123"
                  required
                />

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t(error)}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-auto rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? t('Signing in...') : t('Login as Admin')}
                </button>
              </form>
            )}

            {activeMode === 'viewer' && (
              <form onSubmit={handleViewerSubmit} className="flex h-full flex-col">
                <button
                  type="button"
                  onClick={() => {
                    resetErrors();
                    setActiveMode(null);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('Back')}
                </button>

                <h2 className="mt-6 text-2xl font-semibold text-slate-900">
                  {t('Team Member Login')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t('Only the pages and tasks assigned to this person are shown.')}
                </p>

                <label className="mt-6 text-sm font-medium text-slate-700">
                  {t('Team member')}
                </label>
                <select
                  value={selectedViewerId}
                  onChange={(event) => setSelectedViewerId(event.target.value)}
                  disabled={isLoadingAccounts || viewerAccounts.length === 0}
                  className="mt-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                  required
                >
                  <option value="">{t('Select a team member')}</option>
                  {viewerAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {account.unit ? ` - ${account.unit}` : ''}
                    </option>
                  ))}
                </select>

                {selectedViewer && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    <div className="font-medium">{selectedViewer.name}</div>
                    <div className="mt-1">
                      {selectedViewer.unit || t('No unit information')}
                    </div>
                  </div>
                )}

                <label className="mt-4 text-sm font-medium text-slate-700">
                  {t('Password')}
                </label>
                <input
                  type="password"
                  value={viewerPassword}
                  onChange={(event) => setViewerPassword(event.target.value)}
                  className="mt-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder={viewerPasswordHint}
                  required
                />

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t(error)}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isSubmitting || isLoadingAccounts || viewerAccounts.length === 0
                  }
                  className="mt-auto rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting ? t('Signing in...') : t('Login as Team Member')}
                </button>
              </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
