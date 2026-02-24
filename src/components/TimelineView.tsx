import { useState } from 'react';
import { UserRole } from '../types';
import { mockGoals, mockActionPlans } from '../data/mockData';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { formatAcademicYearRange } from '../utils/academicPeriod';

interface TimelineViewProps {
  userRole: UserRole;
  userUnit?: string;
  selectedAcademicYearStart: number;
}

export function TimelineView({ userRole, userUnit, selectedAcademicYearStart }: TimelineViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('year');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [showMyTasks, setShowMyTasks] = useState<'all' | 'my'>('all'); // Dropdown state

  const units = Array.from(new Set(mockGoals.map(g => g.responsibleUnit)));

  // Combine goals and action plans for timeline
  const allEvents = [
    ...mockGoals.map(g => ({
      id: g.id,
      title: g.title,
      type: 'Goal' as const,
      startDate: g.startDate,
      endDate: g.endDate,
      status: g.status,
      unit: g.responsibleUnit,
      progress: g.progress,
      priority: g.priority,
      assignedTo: g.assignedTo, // Add assignedTo for goals
      academicYearStart: g.academicYearStart
    })),
    ...mockActionPlans.map(a => {
      const goal = mockGoals.find((g) => g.id === a.goalId);
      return {
        id: a.id,
        title: a.title,
        type: 'Action' as const,
        startDate: a.createdAt.split('T')[0],
        endDate: a.deadline,
        status: a.status,
        unit: a.responsibleUnit,
        progress: a.progress,
        priority: a.priority,
        assignedTo: a.assignedTo, // Add assignedTo for action plans
        academicYearStart: a.academicYearStart ?? goal?.academicYearStart
      };
    })
  ];

  const currentUserId = 'Dr. Sarah Johnson'; // Replace with the current user's ID from your auth context

  const filteredEvents = allEvents.filter(event => {
    if (event.academicYearStart !== selectedAcademicYearStart) return false;
    // Unit-based filtering
    if (userUnit && event.unit !== userUnit) return false;
    if (filterUnit !== 'all' && event.unit !== filterUnit) return false;

    // "My Tasks Only" filtering
    if (showMyTasks === 'my') {
      if (event.type === 'Goal') {
        // For goals, check if the user is in the assignedTo array
        if (!event.assignedTo.includes(currentUserId)) {
          return false;
        }
      } else {
        // For action plans, check if the user is the assigned individual
        if (event.assignedTo !== currentUserId) {
          return false;
        }
      }
    }

    return true;
  });

  const demoEvents = [
    {
      id: `DEMO-TL-${selectedAcademicYearStart}-1`,
      title: 'Student Success Initiative',
      type: 'Goal' as const,
      startDate: `${selectedAcademicYearStart}-09-01`,
      endDate: `${selectedAcademicYearStart + 1}-06-30`,
      status: 'On Track',
      unit: userUnit ?? 'Student Affairs',
      progress: 40,
      priority: 'High',
      assignedTo: ['Dr. Sarah Johnson'],
      academicYearStart: selectedAcademicYearStart
    },
    {
      id: `DEMO-TL-${selectedAcademicYearStart}-2`,
      title: 'Advising Workflow Redesign',
      type: 'Action' as const,
      startDate: `${selectedAcademicYearStart}-11-01`,
      endDate: `${selectedAcademicYearStart + 1}-02-15`,
      status: 'In Progress',
      unit: userUnit ?? 'Academic Affairs',
      progress: 55,
      priority: 'Medium',
      assignedTo: 'Dr. Sarah Johnson',
      academicYearStart: selectedAcademicYearStart
    }
  ];

  const displayEvents = filteredEvents.length > 0 ? filteredEvents : demoEvents;
  const isDemoMode = filteredEvents.length === 0;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getEventColor = (type: string, status: string) => {
    if (type === 'Goal') {
      return status === 'Completed' ? 'bg-green-500' :
             status === 'On Track' ? 'bg-blue-500' :
             status === 'At Risk' ? 'bg-orange-500' :
             'bg-red-500';
    } else {
      return status === 'Completed' ? 'bg-green-600' :
             status === 'In Progress' ? 'bg-blue-600' :
             status === 'Blocked' ? 'bg-red-600' :
             'bg-gray-600';
    }
  };

  const getMonthPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getMonth();
  };

  const calculateEventWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const months = endMonth - startMonth + 1;
    return Math.max(months, 1);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
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
              view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView('year')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Yearly
          </button>

          {/* Dropdown to choose between All Tasks and My Tasks */}
          <div className="relative">
            <select
              value={showMyTasks}
              onChange={(e) => setShowMyTasks(e.target.value as 'all' | 'my')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tasks</option>
              <option value="my">My Tasks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Show My Tasks Only Hint */}
      {showMyTasks === 'my' && (
        <span className="text-sm text-purple-600">
          Showing only tasks assigned to you
        </span>
      )}
      {isDemoMode && (
        <span className="text-sm text-blue-700">
          Showing demo timeline items because no events match the current filters.
        </span>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Filter by Unit
            </label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Units</option>
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
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
            Goal - Delayed
          </span>
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            Completed
          </span>
          <span className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            Action - In Progress
          </span>
        </div>
      </div>

      {/* Timeline */}
      {view === 'year' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-12)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {formatAcademicYearRange(selectedAcademicYearStart)} Yearly View
              </h3>
              <button
                onClick={() => navigateMonth(12)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Month Headers */}
            <div className="grid grid-cols-12 gap-1 mb-4">
              {months.map((month, idx) => (
                <div key={idx} className="text-center text-sm py-2 bg-gray-100 rounded">
                  {month.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Timeline Events */}
            <div className="space-y-3">
              {displayEvents.map((event, idx) => {
                const startMonth = getMonthPosition(event.startDate);
                const width = calculateEventWidth(event.startDate, event.endDate);
                
                return (
                  <div key={event.id} className="relative h-12">
                    <div className="grid grid-cols-12 gap-1 h-full">
                      {months.map((_, monthIdx) => {
                        if (monthIdx === startMonth) {
                          return (
                            <div
                              key={monthIdx}
                              className={`rounded px-2 py-1 text-white text-xs overflow-hidden ${getEventColor(event.type, event.status)}`}
                              style={{ gridColumn: `span ${width}` }}
                              title={`${event.title} (${event.progress}%)`}
                            >
                              <div className="truncate">{event.title}</div>
                              <div className="text-xs opacity-90">{event.progress}%</div>
                            </div>
                          );
                        } else if (monthIdx > startMonth && monthIdx < startMonth + width) {
                          return null;
                        }
                        return <div key={monthIdx}></div>;
                      })}
                    </div>
                  </div>
                );
              })}
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
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Events for selected month */}
            <div className="space-y-3">
              {displayEvents
                .filter(event => {
                  const startDate = new Date(event.startDate);
                  const endDate = new Date(event.endDate);
                  return (startDate.getMonth() <= currentMonth.getMonth() && 
                          endDate.getMonth() >= currentMonth.getMonth() &&
                          startDate.getFullYear() === currentMonth.getFullYear());
                })
                .map(event => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className={`w-2 h-12 rounded ${getEventColor(event.type, event.status)}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.type === 'Goal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {event.type === 'Goal' ? 'Goal' : 'Action'}
                        </span>
                        <span className="text-xs text-gray-500">{event.id}</span>
                      </div>
                      <h4>{event.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{event.unit}</span>
                        <span>
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl mb-1">{event.progress}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl mb-1">{displayEvents.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl mb-1">{displayEvents.filter(e => e.type === 'Goal').length}</div>
          <div className="text-sm text-gray-600">Goals</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl mb-1">{displayEvents.filter(e => e.type === 'Action').length}</div>
          <div className="text-sm text-gray-600">Action Plans</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl mb-1">
            {displayEvents.filter(e => e.status === 'Completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>
    </div>
  );
}
