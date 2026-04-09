import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Flag,
  LayoutDashboard,
  ListChecks,
  ListTree,
  LogOut,
  Menu,
  Settings2,
  Target,
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
import { isAdminRole, isViewerRole } from './lib/access';

type AppView =
  | 'dashboard'
  | 'hierarchy'
  | 'detail'
  | 'analytics'
  | 'assignments'
  | 'timeline'
  | 'myGoals'
  | 'milestones'
  | 'calendarSettings';

interface NavigationItem {
  id: Exclude<AppView, 'detail'>;
  label: string;
  icon: typeof LayoutDashboard;
}

const SESSION_STORAGE_KEY = 'spa-auth-session';

function readStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return rawSession ? (JSON.parse(rawSession) as AuthSession) : null;
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
      { id: 'myGoals', label: t('My Assigned Goals'), icon: Target },
      { id: 'assignments', label: t('Assignments'), icon: ListChecks },
      { id: 'milestones', label: t('Milestones'), icon: Flag },
      { id: 'analytics', label: t('Analytics'), icon: BarChart3 },
      { id: 'timeline', label: t('Timeline'), icon: Calendar },
      { id: 'calendarSettings', label: t('Academic Calendar'), icon: Settings2 },
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
