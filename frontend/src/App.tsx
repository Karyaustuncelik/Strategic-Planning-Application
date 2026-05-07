import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Copy,
  Flag,
  LayoutDashboard,
  ListChecks,
  ListTree,
  LogOut,
  Menu,
  ScrollText,
  Settings2,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { HierarchyView } from './components/HierarchyView';
import { GoalDetail } from './components/GoalDetail';
import { AnalyticsView } from './components/AnalyticsView';
import { AssignmentManagement } from './components/AssignmentManagement';
import { TimelineView } from './components/TimelineView';
import { MyAssignedGoals } from './components/MyAssignedGoals';
import { MilestoneManagement } from './components/MilestoneManagement';
import { AcademicCalendarEditor } from './components/AcademicCalendarEditor';
import { UnassignedGoalsView } from './components/UnassignedGoalsView';
import { KpiProjectionComparisonView } from './components/KpiProjectionComparisonView';
import { AdminAuditLogsView } from './components/AdminAuditLogsView';
import { UserManagementView } from './components/UserManagementView';
import { UnauthorizedView } from './components/UnauthorizedView';
import { setAuthToken } from './lib/api';
import { Login } from './components/Login';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/ui/sheet';
import { HierarchyNavigationFilter, AuthSession } from './types';
import { useI18n } from './i18n';
import {
  formatAcademicYearRange,
  getCurrentAcademicYearStart,
  parseAcademicYearRange,
} from './utils/academicPeriod';
import { isViewerRole } from './lib/access';

type AppView =
  | 'dashboard'
  | 'hierarchy'
  | 'detail'
  | 'analytics'
  | 'assignments'
  | 'timeline'
  | 'myGoals'
  | 'milestones'
  | 'projections'
  | 'unassignedGoals'
  | 'calendarSettings'
  | 'auditLogs'
  | 'userManagement';

interface NavigationItem {
  id: Exclude<AppView, 'detail'>;
  label: string;
  icon: typeof LayoutDashboard;
}

const SESSION_STORAGE_KEY = 'spa-auth-session';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function UserBadge({ name, onLogout, t }: { name: string; onLogout: () => void; t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-[#d7e3f2] bg-white px-3 text-sm font-medium text-[#15345c] transition-colors hover:bg-blue-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#15345c] text-xs font-bold text-white">
          {getInitials(name)}
        </span>
        <span className="hidden sm:inline max-w-[160px] truncate">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#d7e3f2] bg-white py-2 shadow-xl z-50">
          <div className="px-4 py-2 border-b border-[#d7e3f2] mb-1">
            <p className="text-xs text-slate-500">{t('Signed in as')}</p>
            <p className="text-sm font-semibold text-[#15345c] truncate">{name}</p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className="inline-flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('Logout')}
          </button>
        </div>
      )}
    </div>
  );
}


function readStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) return null;
    const session = JSON.parse(rawSession) as AuthSession;
    // Admin sessions without a token are from before RBAC was added — force re-login
    if (session.role === 'Strategy Office' && !session.token) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export default function App() {
  const { language, toggleLanguage, t } = useI18n();
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(
    readStoredSession
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < 760
  );

  const currentYearStart = getCurrentAcademicYearStart();
  const previousYearRange = formatAcademicYearRange(currentYearStart - 1);
  const currentYearRange = formatAcademicYearRange(currentYearStart);
  const nextYearRange = formatAcademicYearRange(currentYearStart + 1);

  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([
    previousYearRange,
    currentYearRange,
    nextYearRange,
  ]);
  const [selectedAcademicYearRange, setSelectedAcademicYearRange] =
    useState<string>(currentYearRange);
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [previousView, setPreviousView] = useState<AppView>('dashboard');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [hierarchyNavigationFilter, setHierarchyNavigationFilter] =
    useState<HierarchyNavigationFilter | null>(null);

  const selectedAcademicYearStart = parseAcademicYearRange(
    selectedAcademicYearRange
  );
  const isReadOnly = selectedAcademicYearStart < currentYearStart;
  const isViewer = currentUser ? isViewerRole(currentUser.role) : false;

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(currentUser)
      );
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [currentUser]);

  // Sync auth token for protected API calls whenever session changes
  useEffect(() => {
    setAuthToken(currentUser?.token ?? null);
  }, [currentUser]);

  // SSO callback: backend sets 'spu_sso_token' cookie, read it here
  useEffect(() => {
    // Check for unauthorized SSO rejection
    const params = new URLSearchParams(window.location.search);
    if (params.get('sso_error') === 'unauthorized') {
      setShowUnauthorized(true);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('spu_sso_token='));
    if (!match) return;

    const token = match.split('=').slice(1).join('=');
    document.cookie = 'spu_sso_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    try {
      const payloadBase64Url = token.split('.')[1];
      const payloadBase64 = payloadBase64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(payloadBase64Url.length / 4) * 4, '=');
      const payload = JSON.parse(atob(payloadBase64));
      const session: AuthSession = {
        id: payload.email,
        name: payload.name || payload.email,
        role: (payload.role as AuthSession['role']) || 'Viewer',
        loginMode: 'sso',
        token,
      };
      setCurrentUser(session);
    } catch (e) {
      console.error('SSO token parse failed', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsCompactLayout(window.innerWidth < 760);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (
      academicYearOptions.length > 0 &&
      !academicYearOptions.includes(selectedAcademicYearRange)
    ) {
      const fallback = academicYearOptions.includes(currentYearRange)
        ? currentYearRange
        : academicYearOptions[0];
      setSelectedAcademicYearRange(fallback);
    }
  }, [academicYearOptions, currentYearRange, selectedAcademicYearRange]);

  const navigationItems = useMemo<NavigationItem[]>(() => {
    if (!currentUser) return [];

    if (isViewerRole(currentUser.role)) {
      return [
        { id: 'dashboard', label: t('My Workspace'), icon: LayoutDashboard },
        { id: 'assignments', label: t('My Tasks'), icon: ListChecks },
        { id: 'myGoals', label: t('My Goals'), icon: Target },
        { id: 'milestones', label: t('Milestones'), icon: Flag },
        { id: 'timeline', label: t('Timeline'), icon: Calendar },
      ];
    }

    return [
      { id: 'dashboard', label: t('Dashboard'), icon: LayoutDashboard },
      { id: 'hierarchy', label: t('Goal Hierarchy'), icon: ListTree },
      { id: 'unassignedGoals', label: t('Unassigned Goals'), icon: Copy },
      { id: 'myGoals', label: t('My Assigned Goals'), icon: Target },
      { id: 'assignments', label: t('Assignments'), icon: ListChecks },
      { id: 'milestones', label: t('Milestones'), icon: Flag },
      { id: 'analytics', label: t('Analytics'), icon: BarChart3 },
      { id: 'projections', label: t('Projections'), icon: TrendingUp },
      { id: 'timeline', label: t('Timeline'), icon: Calendar },
      { id: 'calendarSettings', label: t('Academic Calendar'), icon: Settings2 },
      { id: 'auditLogs', label: t('Audit Log'), icon: ScrollText },
      { id: 'userManagement', label: t('User Management'), icon: Users },
    ];
  }, [currentUser, t]);

  useEffect(() => {
    if (!currentUser) return;
    if (currentView === 'detail') return;

    const availableViews = new Set(navigationItems.map((item) => item.id));
    if (availableViews.has(currentView)) return;

    setCurrentView(navigationItems[0]?.id ?? 'dashboard');
  }, [currentUser, currentView, navigationItems]);

  const sortAcademicYears = (years: string[]) =>
    [...years].sort(
      (a, b) => parseAcademicYearRange(a) - parseAcademicYearRange(b)
    );

  const handleAddAcademicYear = (yearRange: string) => {
    setAcademicYearOptions((prev) => {
      if (prev.includes(yearRange)) return prev;
      return sortAcademicYears([...prev, yearRange]);
    });
  };

  const handleRemoveAcademicYear = (yearRange: string) => {
    setAcademicYearOptions((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((year) => year !== yearRange);
    });
  };

  const handleViewGoalDetail = (goalId: string) => {
    setPreviousView(currentView);
    setSelectedGoalId(goalId);
    setCurrentView('detail');
  };

  const handleOpenHierarchy = (
    filters: HierarchyNavigationFilter | null = null
  ) => {
    if (!currentUser || isViewerRole(currentUser.role)) return;
    setHierarchyNavigationFilter(filters);
    setCurrentView('hierarchy');
  };

  const handleChangeView = (view: Exclude<AppView, 'detail'>) => {
    setMobileMenuOpen(false);
    if (view === 'calendarSettings') {
      setPreviousView(currentView);
    }
    setCurrentView(view);
  };

  const handleLogin = (session: AuthSession) => {
    setCurrentUser(session);
    setSelectedGoalId(null);
    setHierarchyNavigationFilter(null);
    setPreviousView('dashboard');
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedGoalId(null);
    setHierarchyNavigationFilter(null);
    setCurrentView('dashboard');
    setPreviousView('dashboard');
  };

  const renderNavigation = (mobile = false) => (
    <div className={`space-y-1.5 ${mobile ? '' : ''}`}>
      <div className="space-y-1.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleChangeView(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-blue-200 bg-blue-50/90 text-blue-800 shadow-sm shadow-blue-100/70'
                  : 'border-transparent bg-transparent text-slate-700 hover:border-blue-100 hover:bg-blue-50/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <span className="ml-auto h-2.5 w-2.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (showUnauthorized) {
    return <UnauthorizedView onBack={() => setShowUnauthorized(false)} />;
  }

  if (!currentUser) {
    return (
      <Login onLogin={handleLogin} />
    );
  }

  return (
    <div className={`min-h-screen bg-[#f4f8fc] ${isCompactLayout ? '' : 'flex'}`}>
      <aside
        className={
          isCompactLayout
            ? 'hidden'
            : 'flex w-72 flex-col border-r border-[#d7e3f2] bg-[#f7fafd]'
        }
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex-1">
            {renderNavigation()}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d7e3f2] bg-white px-4 py-3 text-sm font-medium text-[#15345c] transition-colors hover:bg-blue-50"
            >
              <LogOut className="h-4 w-4" />
              {t('Logout')}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <section className="mx-auto min-w-0 max-w-7xl">
            <div
              className={`mb-6 flex flex-wrap items-center gap-3 ${
                isCompactLayout ? 'justify-between' : 'justify-end'
              }`}
            >
              {isCompactLayout && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7e3f2] bg-white text-[#15345c] transition-colors hover:bg-blue-50"
                    >
                      <Menu className="h-4 w-4" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[88vw] max-w-sm border-r border-[#d7e3f2] bg-[#f7fafd] p-0">
                    <SheetHeader className="border-b border-[#d7e3f2] bg-white">
                      <SheetTitle>{t('Navigation')}</SheetTitle>
                      <SheetDescription>
                        {isViewer
                          ? t('Only your personal work areas are visible.')
                          : t('Admin pages and planning tools are available here.')}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex h-full flex-col p-4">
                      <div className="flex-1">{renderNavigation(true)}</div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d7e3f2] bg-white px-4 py-3 text-sm font-medium text-[#15345c] transition-colors hover:bg-blue-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('Logout')}
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                data-i18n-skip="true"
                aria-label={
                  language === 'tr'
                    ? t('Switch language to English')
                    : t('Switch language to Turkish')
                }
                className="inline-flex h-10 min-w-11 items-center justify-center rounded-xl border border-[#d7e3f2] bg-white px-3 text-xs font-semibold tracking-wide text-[#15345c] transition-colors hover:bg-blue-50"
              >
                {language === 'tr' ? 'EN' : 'TR'}
              </button>

              <div className="min-w-[170px]">
                <Select
                  value={selectedAcademicYearRange}
                  onValueChange={setSelectedAcademicYearRange}
                >
                  <SelectTrigger className="h-10 rounded-xl border-[#d7e3f2] bg-white text-sm text-[#15345c] shadow-none">
                    <SelectValue placeholder={t('Academic Year')} />
                  </SelectTrigger>
                  <SelectContent className="border-[#d7e3f2] bg-white shadow-[0_20px_40px_-24px_rgba(0,39,118,0.35)]">
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isReadOnly && (
                <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-medium text-amber-700">
                  {t('View Only')}
                </span>
              )}

              {isCompactLayout && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d7e3f2] px-4 text-sm font-medium text-[#15345c] transition-colors hover:bg-blue-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t('Logout')}
                </button>
              )}

              {/* User badge */}
              <UserBadge name={currentUser.name} onLogout={handleLogout} t={t} />
              </div>
            </div>

            {currentView === 'dashboard' && (
              <Dashboard
                userRole={currentUser.role}
                userName={currentUser.name}
                userUnit={currentUser.unit}
                selectedAcademicYearStart={selectedAcademicYearStart}
                onOpenHierarchy={() => handleOpenHierarchy()}
              />
            )}

            {currentView === 'hierarchy' && !isViewer && (
              <HierarchyView
                userRole={currentUser.role}
                userUnit={currentUser.unit}
                onViewDetail={handleViewGoalDetail}
                selectedAcademicYearStart={selectedAcademicYearStart}
                isReadOnly={isReadOnly}
                navigationFilter={hierarchyNavigationFilter}
              />
            )}

            {currentView === 'unassignedGoals' && !isViewer && (
              <UnassignedGoalsView
                userName={currentUser.name}
                selectedAcademicYearStart={selectedAcademicYearStart}
                isReadOnly={isReadOnly}
              />
            )}

            {currentView === 'myGoals' && (
              <MyAssignedGoals
                userName={currentUser.name}
                onViewDetail={handleViewGoalDetail}
                selectedAcademicYearStart={selectedAcademicYearStart}
              />
            )}

            {currentView === 'detail' && selectedGoalId && (
              <GoalDetail
                goalId={selectedGoalId}
                userRole={currentUser.role}
                userUnit={currentUser.unit}
                onBack={() => setCurrentView(previousView)}
                isReadOnly={isReadOnly}
              />
            )}

            {currentView === 'analytics' && !isViewer && (
              <AnalyticsView
                userRole={currentUser.role}
                userUnit={currentUser.unit}
                selectedAcademicYearRange={selectedAcademicYearRange}
                selectedAcademicYearStart={selectedAcademicYearStart}
                availableAcademicYears={academicYearOptions}
                onOpenHierarchy={handleOpenHierarchy}
              />
            )}

            {currentView === 'assignments' && (
              <AssignmentManagement
                userRole={currentUser.role}
                userUnit={currentUser.unit}
                userName={currentUser.name}
                selectedAcademicYearStart={selectedAcademicYearStart}
                isReadOnly={isReadOnly}
              />
            )}

            {currentView === 'milestones' && (
              <MilestoneManagement
                userRole={currentUser.role}
                userUnit={currentUser.unit}
                userName={currentUser.name}
                selectedAcademicYearStart={selectedAcademicYearStart}
                isReadOnly={isReadOnly}
              />
            )}

            {currentView === 'timeline' && (
              <TimelineView
                userRole={currentUser.role}
                userName={currentUser.name}
                userUnit={currentUser.unit}
                selectedAcademicYearStart={selectedAcademicYearStart}
                onViewDetail={handleViewGoalDetail}
              />
            )}

            {currentView === 'projections' && !isViewer && (
              <KpiProjectionComparisonView
                userRole={currentUser.role}
                userName={currentUser.name}
                userUnit={currentUser.unit}
                selectedAcademicYearStart={selectedAcademicYearStart}
              />
            )}

            {currentView === 'auditLogs' && !isViewer && (
              <AdminAuditLogsView
                userRole={currentUser.role}
                selectedAcademicYearStart={selectedAcademicYearStart}
                academicYearOptions={academicYearOptions}
              />
            )}

            {currentView === 'userManagement' && !isViewer && (
              <UserManagementView currentUserRole={currentUser.role} />
            )}

            {currentView === 'calendarSettings' && !isViewer && (
              <AcademicCalendarEditor
                academicYears={academicYearOptions}
                selectedYearRange={selectedAcademicYearRange}
                currentYearRange={currentYearRange}
                selectedAcademicYearStart={selectedAcademicYearStart}
                onAddYear={handleAddAcademicYear}
                onRemoveYear={handleRemoveAcademicYear}
                onBack={() => setCurrentView(previousView)}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
