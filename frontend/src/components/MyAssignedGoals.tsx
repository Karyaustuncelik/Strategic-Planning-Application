import { useEffect, useState } from 'react';
import { Goal } from '../types';
import { CheckCircle, AlertTriangle, Clock, Eye, Target, X, Filter, ArrowUpDown } from 'lucide-react';
import { fetchGoals } from '../lib/api';

interface MyAssignedGoalsProps {
  userName: string;
  onViewDetail: (goalId: string) => void;
  selectedAcademicYearStart: number;
}

interface ActiveFilter {
  type: 'department' | 'goalName';
  value: string;
}

export function MyAssignedGoals({ userName, onViewDetail, selectedAcademicYearStart }: MyAssignedGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFilterType, setSelectedFilterType] = useState<'department' | 'goalName' | ''>('');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchGoals({ academicYearStart: selectedAcademicYearStart });
        if (!isMounted) return;
        setGoals(data);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load assigned goals');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGoals();

    return () => {
      isMounted = false;
    };
  }, [selectedAcademicYearStart]);

  const handleAddFilter = () => {
    if (selectedFilterType && searchValue.trim()) {
      setActiveFilters([...activeFilters, { type: selectedFilterType, value: searchValue.trim() }]);
      setSearchValue('');
      setSelectedFilterType('');
    }
  };

  const handleRemoveFilter = (index: number) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'department': return 'Department';
      case 'goalName': return 'Goal Name';
      default: return 'Choose the filter';
    }
  };

  const myGoals = goals.filter(
    (goal) => goal.assignedTo && goal.assignedTo.includes(userName)
  );

  const filteredGoals = myGoals.filter(goal => {
    if (goal.academicYearStart !== selectedAcademicYearStart) return false;
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;

    for (const filter of activeFilters) {
      if (filter.type === 'department') {
        if (!goal.responsibleUnit.toLowerCase().includes(filter.value.toLowerCase())) {
          return false;
        }
      } else if (filter.type === 'goalName') {
        if (!goal.title.toLowerCase().includes(filter.value.toLowerCase())) {
          return false;
        }
      }
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Not Started':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'On Track':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'At Risk':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'Delayed':
        return <Clock className="w-4 h-4 text-red-600" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
      case 'On Track':
        return 'bg-green-100 text-green-700';
      case 'At Risk':
        return 'bg-orange-100 text-orange-700';
      case 'Delayed':
        return 'bg-red-100 text-red-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Medium':
        return 'bg-blue-100 text-blue-700';
      case 'Low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0:
        return 'Main Goal';
      case 1:
        return 'Sub Goal';
      case 2:
        return 'Sub Item';
      default:
        return 'Goal';
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-purple-100 text-purple-700';
      case 1:
        return 'bg-blue-100 text-blue-700';
      case 2:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1 sm:flex-none">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddFilter();
                }
              }}
              placeholder={
                selectedFilterType
                  ? `Search by ${getFilterLabel(selectedFilterType)}...`
                  : 'Select a filter first...'
              }
              disabled={!selectedFilterType}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <select
            value={selectedFilterType}
            onChange={(e) =>
              setSelectedFilterType(e.target.value as 'department' | 'goalName' | '')
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose the filter</option>
            <option value="department">Department</option>
            <option value="goalName">Goal Name</option>
          </select>

          <button
            onClick={handleAddFilter}
            disabled={!selectedFilterType || !searchValue.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Filter className="h-4 w-4" />
            Add
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
            <option value="Not Started">Not Started</option>
          </select>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="bg-transparent text-sm text-slate-700 focus:outline-none"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <div
                key={`${filter.type}-${filter.value}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
              >
                <span>
                  {getFilterLabel(filter.type)}: <span>{filter.value}</span>
                </span>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setActiveFilters([])}
              className="text-sm text-slate-600 hover:text-slate-800 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Assigned</p>
              <div className="text-2xl mt-1">{filteredGoals.length}</div>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Track</p>
              <div className="text-2xl mt-1 text-green-600">
                {filteredGoals.filter(g => g.status === 'On Track').length}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">At Risk</p>
              <div className="text-2xl mt-1 text-orange-600">
                {filteredGoals.filter(g => g.status === 'At Risk').length}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average Progress</p>
              <div className="text-2xl mt-1">
                {filteredGoals.length > 0
                  ? Math.round(filteredGoals.reduce((sum, g) => sum + g.progress, 0) / filteredGoals.length)
                  : 0}%
              </div>
            </div>
            <div className="w-8 h-8 flex items-center justify-center text-blue-600 text-2xl">%</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          Loading assigned goals...
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="space-y-3">
          {filteredGoals.map(goal => (
            <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getLevelColor(goal.level)}`}>
                        {getLevelLabel(goal.level)}
                      </span>
                      <span className="text-xs text-gray-500">{goal.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                        {getStatusIcon(goal.status)}
                        {goal.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </div>
                    <h3 className="mb-2">{goal.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                  </div>
                  <button
                    onClick={() => onViewDetail(goal.id)}
                    className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        goal.status === 'Completed' ? 'bg-green-500' :
                        goal.status === 'Not Started' ? 'bg-gray-400' :
                        goal.status === 'On Track' ? 'bg-blue-500' :
                        goal.status === 'At Risk' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>{goal.responsibleUnit}</span>
                  <span>•</span>
                  <span>
                    {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>Updated by {goal.updatedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="mb-2">No Goals Assigned</h3>
          <p className="text-gray-500">You don&apos;t have any goals assigned to you matching the selected filters.</p>
        </div>
      )}
    </div>
  );
}
