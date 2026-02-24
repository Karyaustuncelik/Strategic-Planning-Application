import { useState } from 'react';
import { Goal } from '../types';
import { mockGoals } from '../data/mockData';
import { CheckCircle, AlertTriangle, Clock, Eye, Target, Search, X, Filter, ArrowUpDown } from 'lucide-react';

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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // New unified filter system
  const [selectedFilterType, setSelectedFilterType] = useState<'department' | 'goalName' | ''>('');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Filter goals assigned to the current user
  const myGoals = mockGoals.filter(goal => 
    goal.assignedTo && goal.assignedTo.includes(userName)
  );

  const filteredGoals = myGoals.filter(goal => {
    if (goal.academicYearStart !== selectedAcademicYearStart) return false;
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    
    // Apply active filters
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
    // Sort by timeline (start date)
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const now = new Date().toISOString();
  const demoGoals: Goal[] = [
    {
      id: `DEMO-MG-${selectedAcademicYearStart}`,
      title: 'Increase Student Retention',
      description: 'Implement mentoring and support programs.',
      academicYearStart: selectedAcademicYearStart,
      status: 'On Track',
      priority: 'High',
      responsibleUnit: 'Student Affairs',
      level: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: userName,
      startDate: `${selectedAcademicYearStart}-09-01`,
      endDate: `${selectedAcademicYearStart + 1}-06-30`,
      progress: 45,
      assignedTo: [userName]
    },
    {
      id: `DEMO-SG-${selectedAcademicYearStart}`,
      title: 'Enhance Advising Services',
      description: 'Expand advisor capacity and training.',
      academicYearStart: selectedAcademicYearStart,
      status: 'At Risk',
      priority: 'Medium',
      responsibleUnit: 'Academic Affairs',
      parentId: `DEMO-MG-${selectedAcademicYearStart}`,
      level: 1,
      createdAt: now,
      updatedAt: now,
      updatedBy: userName,
      startDate: `${selectedAcademicYearStart}-11-15`,
      endDate: `${selectedAcademicYearStart + 1}-05-15`,
      progress: 30,
      assignedTo: [userName, 'Alex Kim']
    }
  ];

  const displayGoals = filteredGoals.length > 0 ? filteredGoals : demoGoals;
  const isDemoMode = filteredGoals.length === 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Track':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'At Risk':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'Delayed':
        return <Clock className="w-4 h-4 text-red-600" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
      <div>
        <h2>My Assigned Goals</h2>
        <p className="text-gray-600">Goals and tasks assigned to you</p>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-6">
          {/* Left Side - Filters */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm">Filters</h3>
            </div>
            
            {/* Unified Filter Controls */}
            <div className="flex gap-2">
              <select
                value={selectedFilterType}
                onChange={(e) => setSelectedFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose the filter</option>
                <option value="department">Department</option>
                <option value="goalName">Goal Name</option>
              </select>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddFilter();
                    }
                  }}
                  placeholder={selectedFilterType ? `Search by ${getFilterLabel(selectedFilterType)}...` : 'Select a filter first...'}
                  disabled={!selectedFilterType}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              
              <button
                onClick={handleAddFilter}
                disabled={!selectedFilterType || !searchValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {activeFilters.map((filter, index) => (
                  <div key={index} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <span className="text-blue-700">
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
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Existing Status and Year Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Side - Sorting */}
          <div className="border-l border-gray-200 pl-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm">Sort By</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-700 mb-2">
                Timeline
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Assigned</p>
              <div className="text-2xl mt-1">{displayGoals.length}</div>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Track</p>
              <div className="text-2xl mt-1 text-green-600">
                {displayGoals.filter(g => g.status === 'On Track').length}
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
                {displayGoals.filter(g => g.status === 'At Risk').length}
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
                {displayGoals.length > 0 
                  ? Math.round(displayGoals.reduce((sum, g) => sum + g.progress, 0) / displayGoals.length)
                  : 0}%
              </div>
            </div>
            <div className="w-8 h-8 flex items-center justify-center text-blue-600 text-2xl">%</div>
          </div>
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
          Showing demo items because no assigned goals match the current filters.
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {displayGoals.map(goal => (
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

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Progress</span>
                  <span className="text-xs">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      goal.status === 'Completed' ? 'bg-green-500' :
                      goal.status === 'On Track' ? 'bg-blue-500' :
                      goal.status === 'At Risk' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
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

      {displayGoals.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="mb-2">No Goals Assigned</h3>
          <p className="text-gray-500">You don&apos;t have any goals assigned to you matching the selected filters.</p>
        </div>
      )}
    </div>
  );
}
