import { useState } from 'react';
import { UserRole, Assignment } from '../types';
import { mockAssignments, mockGoals, mockKPIs, mockActionPlans } from '../data/mockData';
import { Plus, CheckCircle, Clock, X, AlertCircle, User, Search, Filter, ArrowUpDown } from 'lucide-react';

interface AssignmentManagementProps {
  userRole: UserRole;
  userUnit?: string;
  userName: string;
  selectedAcademicYearStart: number;
  isReadOnly: boolean;
}

interface ActiveFilter {
  type: 'name' | 'department' | 'goalName';
  value: string;
}

export function AssignmentManagement({
  userRole,
  userUnit,
  userName,
  selectedAcademicYearStart,
  isReadOnly,
}: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New unified filter system
  const [selectedFilterType, setSelectedFilterType] = useState<'name' | 'department' | 'goalName' | ''>('');
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
      case 'name': return 'Name';
      case 'department': return 'Department';
      case 'goalName': return 'Goal Name';
      default: return 'Choose the filter';
    }
  };

  const getEntityTitle = (assignment: Assignment) => {
    if (assignment.entityType === 'Goal') {
      return mockGoals.find(g => g.id === assignment.entityId)?.title || 'Unknown Goal';
    } else if (assignment.entityType === 'KPI') {
      return mockKPIs.find(k => k.id === assignment.entityId)?.name || 'Unknown KPI';
    } else {
      return mockActionPlans.find(a => a.id === assignment.entityId)?.title || 'Unknown Action';
    }
  };

  const getAssignmentYearStart = (assignment: Assignment) => {
    if (assignment.entityType === 'Goal') {
      return mockGoals.find((g) => g.id === assignment.entityId)?.academicYearStart;
    }
    if (assignment.entityType === 'KPI') {
      return mockKPIs.find((k) => k.id === assignment.entityId)?.academicYearStart;
    }
    const action = mockActionPlans.find((a) => a.id === assignment.entityId);
    if (action?.academicYearStart !== undefined) {
      return action.academicYearStart;
    }
    if (action) {
      return mockGoals.find((g) => g.id === action.goalId)?.academicYearStart;
    }
    return undefined;
  };

  const filteredAssignments = assignments.filter(assignment => {
    const entityYearStart = getAssignmentYearStart(assignment);
    if (entityYearStart !== selectedAcademicYearStart) return false;
    if (userRole === 'Unit Manager' && assignment.unit !== userUnit) return false;
    if (filterStatus !== 'all' && assignment.status !== filterStatus) return false;
    if (filterType !== 'all' && assignment.entityType !== filterType) return false;
    
    // Apply active filters
    for (const filter of activeFilters) {
      if (filter.type === 'name') {
        if (!assignment.assignedTo.toLowerCase().includes(filter.value.toLowerCase())) {
          return false;
        }
      } else if (filter.type === 'department') {
        if (!assignment.unit.toLowerCase().includes(filter.value.toLowerCase())) {
          return false;
        }
      } else if (filter.type === 'goalName') {
        const entityTitle = getEntityTitle(assignment);
        if (!entityTitle.toLowerCase().includes(filter.value.toLowerCase())) {
          return false;
        }
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by timeline (deadline)
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const fallbackGoal = mockGoals.find((g) => g.academicYearStart === selectedAcademicYearStart) ?? mockGoals[0];
  const demoAssignments: Assignment[] = [
    {
      id: `DEMO-AS-${selectedAcademicYearStart}-1`,
      entityType: 'Goal',
      entityId: fallbackGoal?.id ?? 'DEMO-GOAL-1',
      assignedTo: userName,
      assignedBy: 'Strategy Office',
      unit: userUnit ?? 'General',
      assignedDate: new Date().toISOString(),
      deadline: `${selectedAcademicYearStart + 1}-01-15`,
      status: 'In Progress',
      notes: 'Follow up on retention initiatives.'
    },
    {
      id: `DEMO-AS-${selectedAcademicYearStart}-2`,
      entityType: 'Goal',
      entityId: fallbackGoal?.id ?? 'DEMO-GOAL-2',
      assignedTo: 'Alex Kim',
      assignedBy: userName,
      unit: userUnit ?? 'General',
      assignedDate: new Date().toISOString(),
      deadline: `${selectedAcademicYearStart + 1}-03-30`,
      status: 'Pending',
      notes: 'Prepare quarterly progress update.'
    }
  ];

  const displayAssignments = filteredAssignments.length > 0 ? filteredAssignments : demoAssignments;
  const isDemoMode = filteredAssignments.length === 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Accepted':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Goal':
        return 'bg-purple-100 text-purple-700';
      case 'KPI':
        return 'bg-green-100 text-green-700';
      case 'Action Plan':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAcceptAssignment = (assignmentId: string) => {
    if (isReadOnly) return;
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, status: 'Accepted' as const } : a
    ));
  };

  const handleRejectAssignment = (assignmentId: string) => {
    if (isReadOnly) return;
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, status: 'Rejected' as const } : a
    ));
  };

  const handleCompleteAssignment = (assignmentId: string) => {
    if (isReadOnly) return;
    setAssignments(assignments.map(a => 
      a.id === assignmentId ? { ...a, status: 'Completed' as const } : a
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Assignment Management</h2>
          <p className="text-gray-600">Goal, KPI, and action plan assignments</p>
        </div>
        {userRole === 'Strategy Office' && (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isReadOnly}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isReadOnly
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New Assignment
          </button>
        )}
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
                <option value="name">Name</option>
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

            {/* Existing Status and Type Filters */}
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
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="Goal">Goal</option>
                  <option value="KPI">KPI</option>
                  <option value="Action Plan">Action Plan</option>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl mb-1">{displayAssignments.length}</div>
          <div className="text-sm text-gray-600">Total Assignments</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl mb-1">{displayAssignments.filter(a => a.status === 'Pending').length}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl mb-1">{displayAssignments.filter(a => a.status === 'In Progress').length}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl mb-1">{displayAssignments.filter(a => a.status === 'Completed').length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl mb-1">{displayAssignments.filter(a => a.status === 'Rejected').length}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
          Showing demo assignments because no items match the current filters.
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {displayAssignments.map(assignment => {
          const isOverdue = new Date(assignment.deadline) < new Date() && assignment.status !== 'Completed';
          const canManage = assignment.assignedTo === userName || userRole === 'Strategy Office';

          return (
            <div key={assignment.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${getTypeColor(assignment.entityType)}`}>
                      {assignment.entityType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                    {isOverdue && (
                      <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">
                        Overdue
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{assignment.id}</span>
                  </div>

                  <h3 className="mb-2">{getEntityTitle(assignment)}</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Assigned To:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{assignment.assignedTo}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned By:</span>
                      <div className="mt-1">{assignment.assignedBy}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Unit:</span>
                      <div className="mt-1">{assignment.unit}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <div className={`mt-1 ${isOverdue ? 'text-red-600' : ''}`}>
                        {new Date(assignment.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {assignment.notes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <p className="text-sm text-gray-700">{assignment.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {canManage && (
                  <div className="ml-4 flex flex-col gap-2">
                    {assignment.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptAssignment(assignment.id)}
                          disabled={isReadOnly}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm inline-flex items-center gap-1 ${
                            isReadOnly
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectAssignment(assignment.id)}
                          disabled={isReadOnly}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm inline-flex items-center gap-1 ${
                            isReadOnly
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {(assignment.status === 'Accepted' || assignment.status === 'In Progress') && (
                      <button
                        onClick={() => handleCompleteAssignment(assignment.id)}
                        disabled={isReadOnly}
                        className={`px-3 py-1 rounded-lg transition-colors text-sm inline-flex items-center gap-1 ${
                          isReadOnly
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
                Assignment Date: {new Date(assignment.assignedDate).toLocaleString()}
              </div>
            </div>
          );
        })}

        {displayAssignments.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">No assignments found matching the selected filters.</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-900 mb-2">
              <span>About Assignment Management:</span>
            </p>
            <ul className="text-sm text-blue-900 space-y-1">
              <li>• Strategy Office can view and manage all assignments</li>
              <li>• Unit Managers can only view assignments for their unit</li>
              <li>• Assigned people can accept, reject, or complete assignments</li>
              <li>• Overdue assignments are automatically flagged</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
