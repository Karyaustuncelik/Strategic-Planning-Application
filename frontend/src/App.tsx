import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HierarchyView } from './components/HierarchyView';
import { GoalDetail } from './components/GoalDetail';
import { AnalyticsView } from './components/AnalyticsView';
import { AssignmentManagement } from './components/AssignmentManagement';
import { TimelineView } from './components/TimelineView';
import { MyAssignedGoals } from './components/MyAssignedGoals';
import { MilestoneManagement } from './components/MilestoneManagement';
import { AcademicCalendarEditor } from './components/AcademicCalendarEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { HierarchyNavigationFilter, UserRole } from './types';
import { useI18n } from './i18n';
import {
  formatAcademicYearRange,
  getCurrentAcademicYearStart,
  parseAcademicYearRange,
} from './utils/academicPeriod';
import {
  Target,
  ListTree,
  BarChart3,
  Calendar,
  Users,
  UserCheck,
  Flag,
} from 'lucide-react';

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

export default function App() {
  const { language, toggleLanguage } = useI18n();
  const [currentUser] = useState<{
    name: string;
    role: UserRole;
    unit?: string;
  }>({
    name: 'Strategy Office Manager',
    role: 'Strategy Office',
  });

  const currentYearStart = getCurrentAcademicYearStart();
  const currentYearRange = formatAcademicYearRange(currentYearStart);
  const nextYearRange = formatAcademicYearRange(currentYearStart + 1);

  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([
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

  const handleViewGoalDetail = (goalId: string) => {
    setSelectedGoalId(goalId);
    setCurrentView('detail');
  };

  const handleOpenHierarchy = (filters: HierarchyNavigationFilter | null = null) => {
    setHierarchyNavigationFilter(filters);
    setCurrentView('hierarchy');
  };

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

  const handleOpenCalendarEditor = () => {
    setPreviousView(currentView);
    setCurrentView('calendarSettings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={toggleLanguage}
              data-i18n-skip="true"
              aria-label={
                language === 'tr'
                  ? 'Switch language to English'
                  : 'Dili Türkçeye çevir'
              }
              className="inline-flex min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-700 transition-colors hover:bg-slate-100"
            >
              {language === 'tr' ? 'EN' : 'TR'}
            </button>

            <nav className="min-w-0 flex-1 overflow-x-auto py-1 lg:overflow-visible">
              <div className="flex items-center gap-2 pr-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Target className="w-4 h-4" />
                Dashboard
              </button>

                <button
                  onClick={() => handleOpenHierarchy()}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === 'hierarchy'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ListTree className="w-4 h-4" />
                  Goal Hierarchy
                </button>

                <button
                  onClick={() => setCurrentView('myGoals')}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === 'myGoals'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  My Assigned Goals
                </button>

                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === 'analytics'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>

                <button
                  onClick={() => setCurrentView('assignments')}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === 'assignments'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Assignments
                </button>

                <button
                  onClick={() => setCurrentView('milestones')}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === 'milestones'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  Milestones
                </button>

                <button
                  onClick={() => setCurrentView('timeline')}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === 'timeline'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Timeline
                </button>
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-500 lg:inline">
                Academic Year
              </span>
              <div className="min-w-[148px] flex-shrink-0">
                <Select
                  value={selectedAcademicYearRange}
                  onValueChange={setSelectedAcademicYearRange}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-700 shadow-none">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={handleOpenCalendarEditor}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Edit
              </button>
              {isReadOnly && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                  View Only
                </span>
              )}
            </div>
          </div>
        </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'dashboard' && (
              <Dashboard
                userRole={currentUser.role}
                userUnit={currentUser.unit}
                selectedAcademicYearStart={selectedAcademicYearStart}
                onOpenHierarchy={() => handleOpenHierarchy()}
              />
            )}

            {currentView === 'hierarchy' && (
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
                onBack={() => setCurrentView('hierarchy')}
                isReadOnly={isReadOnly}
              />
            )}

            {currentView === 'analytics' && (
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

            {currentView === 'calendarSettings' && (
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
          </main>
      </>
    </div>
  );
}
