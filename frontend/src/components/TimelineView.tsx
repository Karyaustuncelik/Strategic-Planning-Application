import { useEffect, useMemo, useState } from 'react';
import { ActionPlan, Goal, UserRole } from '../types';
import { fetchActionPlans, fetchGoals } from '../lib/api';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { formatAcademicYearRange } from '../utils/academicPeriod';
import { isViewerRole } from '../lib/access';

interface TimelineViewProps {
  userRole: UserRole;
  userName: string;
  userUnit?: string;
  selectedAcademicYearStart: number;
  onViewDetail: (goalId: string) => void;
}

type TimelineEvent = {
  id: string;
  goalId: string;
  title: string;
  type: 'Goal' | 'Action';
  startDate: string;
  endDate: string;
  status: string;
  unit: string;
  progress: number;
  priority: string;
  assignedTo: string[] | string;
  academicYearStart: number;
};

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getAcademicMonthIndex(dateStr: string, academicYearStart: number) {
  const date = new Date(dateStr);
  return (date.getFullYear() - academicYearStart) * 12 + date.getMonth() - 8;
}

export function TimelineView({
  userRole,
  userName,
  userUnit,
  selectedAcademicYearStart,
  onViewDetail,
}: TimelineViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedAcademicYearStart, 8, 1)
  );
  const [view, setView] = useState<'month' | 'year'>('year');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [showMyTasks, setShowMyTasks] = useState<'all' | 'my'>('all');
  const isViewer = isViewerRole(userRole);

  useEffect(() => {
    setCurrentMonth(new Date(selectedAcademicYearStart, 8, 1));
  }, [selectedAcademicYearStart]);

  useEffect(() => {
    if (isViewer) {
      setShowMyTasks('my');
    }
  }, [isViewer]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [goalData, actionData] = await Promise.all([
          fetchGoals({ academicYearStart: selectedAcademicYearStart }),
          fetchActionPlans({ academicYearStart: selectedAcademicYearStart }),
        ]);

        if (!isMounted) return;

        setGoals(goalData);
        setActions(actionData);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load timeline data'
        );
        setGoals([]);
        setActions([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedAcademicYearStart]);

  const units = useMemo(
    () =>
      Array.from(
        new Set(
          goals
            .map((goal) => goal.responsibleUnit)
            .concat(actions.map((action) => action.responsibleUnit))
        )
      ).sort(),
    [actions, goals]
  );

  const allEvents = useMemo<TimelineEvent[]>(
    () => [
      ...goals.map((goal) => ({
        id: goal.id,
        goalId: goal.id,
        title: goal.title,
        type: 'Goal' as const,
        startDate: goal.startDate,
        endDate: goal.endDate,
        status: goal.status,
        unit: goal.responsibleUnit,
        progress: goal.progress,
        priority: goal.priority,
        assignedTo: goal.assignedTo ?? [],
        academicYearStart: goal.academicYearStart,
      })),
      ...actions.map((action) => ({
        id: action.id,
        goalId: action.goalId,
        title: action.title,
        type: 'Action' as const,
        startDate: action.createdAt.slice(0, 10),
        endDate: action.deadline,
        status: action.status,
        unit: action.responsibleUnit,
        progress: action.progress,
        priority: action.priority,
        assignedTo: action.assignedTo,
        academicYearStart: action.academicYearStart ?? selectedAcademicYearStart,
      })),
    ],
    [actions, goals, selectedAcademicYearStart]
  );

  const filteredEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        if (event.academicYearStart !== selectedAcademicYearStart) return false;
        if (!isViewer && userUnit && event.unit !== userUnit) return false;
        if (filterUnit !== 'all' && event.unit !== filterUnit) return false;

        if (isViewer || showMyTasks === 'my') {
          if (Array.isArray(event.assignedTo)) {
            return event.assignedTo.includes(userName);
          }

          return event.assignedTo === userName;
        }

        return true;
      }),
    [
      allEvents,
      filterUnit,
      isViewer,
      selectedAcademicYearStart,
      showMyTasks,
      userName,
      userUnit,
    ]
  );

  const academicMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const date = new Date(selectedAcademicYearStart, 8 + index, 1);
        return {
          index,
          label: date.toLocaleString('en-US', { month: 'short' }),
        };
      }),
    [selectedAcademicYearStart]
  );

  const monthlyEvents = useMemo(() => {
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= monthEnd && eventEnd >= monthStart;
    });
  }, [currentMonth, filteredEvents]);

  const getEventColor = (event: TimelineEvent) => {
    if (event.type === 'Goal') {
      if (event.status === 'Completed') return 'bg-green-500';
      if (event.status === 'On Track') return 'bg-blue-500';
      if (event.status === 'At Risk') return 'bg-orange-500';
      if (event.status === 'Not Started') return 'bg-gray-500';
      return 'bg-red-500';
    }

    if (event.status === 'Completed') return 'bg-green-600';
    if (event.status === 'In Progress') return 'bg-blue-600';
    if (event.status === 'Not Started') return 'bg-gray-600';
    return 'bg-red-600';
  };

  const navigateMonth = (direction: number) => {
    const nextDate = new Date(currentMonth);
    nextDate.setMonth(nextDate.getMonth() + direction);
    setCurrentMonth(nextDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Calendar & Timeline</h2>
          <p className="text-gray-600">Goals and action plans timeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView('year')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Yearly
          </button>
          <select
            value={showMyTasks}
            onChange={(event) =>
              setShowMyTasks(event.target.value as 'all' | 'my')
            }
            disabled={isViewer}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {!isViewer && <option value="all">All Tasks</option>}
            <option value="my">My Tasks</option>
          </select>
        </div>
      </div>

      {(showMyTasks === 'my' || isViewer) && (
        <span className="text-sm text-purple-600">
          Showing only tasks assigned to {userName}
        </span>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isViewer && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Filter by Unit
              </label>
              <select
                value={filterUnit}
                onChange={(event) => setFilterUnit(event.target.value)}
                disabled={userRole === 'Unit Manager' && Boolean(userUnit)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="all">All Units</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            Goal - On Track
          </span>
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            Goal - At Risk
          </span>
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            Goal - Delayed / Blocked
          </span>
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            Completed
          </span>
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            Not Started
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Timeline data is loading...</p>
        </div>
      ) : (
        <>
          {view === 'year' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <h3 className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatAcademicYearRange(selectedAcademicYearStart)} Yearly View
                  </h3>
                </div>

                <div className="grid grid-cols-12 gap-1 mb-4">
                  {academicMonths.map((month) => (
                    <div
                      key={month.index}
                      className="text-center text-sm py-2 bg-gray-100 rounded"
                    >
                      {month.label}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const rawStart = getAcademicMonthIndex(
                      event.startDate,
                      selectedAcademicYearStart
                    );
                    const rawEnd = getAcademicMonthIndex(
                      event.endDate,
                      selectedAcademicYearStart
                    );
                    const startIndex = Math.max(rawStart, 0);
                    const endIndex = Math.min(rawEnd, 11);

                    if (endIndex < 0 || startIndex > 11 || endIndex < startIndex) {
                      return null;
                    }

                    const width = endIndex - startIndex + 1;

                    return (
                      <div key={event.id} className="relative h-12">
                        <div className="grid grid-cols-12 gap-1 h-full">
                          {academicMonths.map((month) => {
                            if (month.index === startIndex) {
                              return (
                                <button
                                  type="button"
                                  key={month.index}
                                  onClick={() => onViewDetail(event.goalId)}
                                  className={`rounded px-2 py-1 text-left text-white text-xs overflow-hidden transition-opacity hover:opacity-90 ${getEventColor(
                                    event
                                  )}`}
                                  style={{ gridColumn: `span ${width}` }}
                                  title={`${event.title} (${event.progress}%)`}
                                >
                                  <div className="truncate">{event.title}</div>
                                  <div className="text-xs opacity-90">
                                    {event.progress}%
                                  </div>
                                </button>
                              );
                            }

                            if (month.index > startIndex && month.index <= endIndex) {
                              return null;
                            }

                            return <div key={month.index}></div>;
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-6">
                      No timeline events found for the selected filters.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'month' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {MONTH_LABELS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {monthlyEvents.map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => onViewDetail(event.goalId)}
                      className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100"
                    >
                      <div
                        className={`w-2 h-12 rounded ${getEventColor(event)}`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              event.type === 'Goal'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {event.type}
                          </span>
                          <span className="text-xs text-gray-500">{event.id}</span>
                        </div>
                        <h4>{event.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>{event.unit}</span>
                          <span>
                            {new Date(event.startDate).toLocaleDateString()} -{' '}
                            {new Date(event.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl mb-1">{event.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </button>
                  ))}

                  {monthlyEvents.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-6">
                      No events overlap this month.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl mb-1">{filteredEvents.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl mb-1">
                {filteredEvents.filter((event) => event.type === 'Goal').length}
              </div>
              <div className="text-sm text-gray-600">Goals</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl mb-1">
                {filteredEvents.filter((event) => event.type === 'Action').length}
              </div>
              <div className="text-sm text-gray-600">Action Plans</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl mb-1">
                {
                  filteredEvents.filter((event) => event.status === 'Completed')
                    .length
                }
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
