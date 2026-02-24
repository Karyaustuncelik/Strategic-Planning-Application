import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HierarchyView } from './components/HierarchyView';
import { GoalDetail } from './components/GoalDetail';
import { AnalyticsView } from './components/AnalyticsView';
import { AssignmentManagement } from './components/AssignmentManagement';
import { TimelineView } from './components/TimelineView';
import { Login } from './components/Login';
import { MyAssignedGoals } from './components/MyAssignedGoals';
import { MilestoneManagement } from './components/MilestoneManagement';
import { AcademicCalendarEditor } from './components/AcademicCalendarEditor';
import { UserRole } from './types';
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
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: UserRole;
    unit?: string;
  } | null>(null);

  const currentYearStart = getCurrentAcademicYearStart();
  const currentYearRange = formatAcademicYearRange(currentYearStart);

  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([
    currentYearRange,
  ]);
  const [selectedAcademicYearRange, setSelectedAcademicYearRange] =
    useState<string>(currentYearRange);

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [previousView, setPreviousView] = useState<AppView>('dashboard');

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedAcademicYearStart = parseAcademicYearRange(
    selectedAcademicYearRange
  );
  const isReadOnly = selectedAcademicYearStart !== currentYearStart;

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

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const handleViewGoalDetail = (goalId: string) => {
    setSelectedGoalId(goalId);
    setCurrentView('detail');
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1>Strategic Planning Tracking System</h1>
              <p className="text-gray-600">
                {currentUser.name} - {currentUser.role}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  Academic Year
                </span>
                <select
                  value={selectedAcademicYearRange}
                  onChange={(e) => setSelectedAcademicYearRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleOpenCalendarEditor}
                className="px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                Edit
              </button>
              {isReadOnly && (
                <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                  View Only
                </span>
              )}
              <button
                onClick={() => setCurrentUser(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 py-4 overflow-x-auto">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Target className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setCurrentView('hierarchy')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'hierarchy'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ListTree className="w-4 h-4" />
              Goal Hierarchy
            </button>

            <button
              onClick={() => setCurrentView('myGoals')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'myGoals'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              My Assigned Goals
            </button>


            <button
              onClick={() => setCurrentView('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>

            <button
              onClick={() => setCurrentView('assignments')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'assignments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Assignments
            </button>

            <button
              onClick={() => setCurrentView('milestones')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'milestones'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Flag className="w-4 h-4" />
              Milestones
            </button>

            <button
              onClick={() => setCurrentView('timeline')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard
            userRole={currentUser.role}
            userUnit={currentUser.unit}
            selectedAcademicYearStart={selectedAcademicYearStart}
          />
        )}

        {currentView === 'hierarchy' && (
          <HierarchyView
            userRole={currentUser.role}
            userUnit={currentUser.unit}
            onViewDetail={handleViewGoalDetail}
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
            userUnit={currentUser.unit}
            selectedAcademicYearStart={selectedAcademicYearStart}
          />
        )}

        {currentView === 'calendarSettings' && (
          <AcademicCalendarEditor
            academicYears={academicYearOptions}
            selectedYearRange={selectedAcademicYearRange}
            currentYearRange={currentYearRange}
            onAddYear={handleAddAcademicYear}
            onRemoveYear={handleRemoveAcademicYear}
            onBack={() => setCurrentView(previousView)}
          />
        )}
      </main>
    </div>
  );
}
