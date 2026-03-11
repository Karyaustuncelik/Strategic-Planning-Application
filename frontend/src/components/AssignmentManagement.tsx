import { useEffect, useMemo, useState } from 'react';
import { Assignment, Goal, UserRole } from '../types';
import {
  Plus,
  CheckCircle,
  X,
  AlertCircle,
  User,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import {
  createAssignment,
  fetchAssignments,
  fetchGoals,
  updateAssignmentStatus,
} from '../lib/api';
import {
  formatAcademicYearRange,
  formatDateString,
  getAcademicYearDateRange,
} from '../utils/academicPeriod';

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

interface AssignmentDraft {
  entityId: string;
  assignedTo: string;
  deadline: string;
  notes: string;
}

function sortAssignments(items: Assignment[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.deadline).getTime();
    const rightTime = new Date(right.deadline).getTime();
    return leftTime - rightTime;
  });
}

function buildDraft(academicYearStart: number, entityId = ''): AssignmentDraft {
  return {
    entityId,
    assignedTo: '',
    deadline: formatDateString(getAcademicYearDateRange(academicYearStart).endDate),
    notes: '',
  };
}

export function AssignmentManagement({
  userRole,
  userUnit,
  userName,
  selectedAcademicYearStart,
  isReadOnly,
}: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState<string | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<Assignment['entityType'] | 'all'>(
    'all'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState<
    'name' | 'department' | 'goalName' | ''
  >('');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [draft, setDraft] = useState<AssignmentDraft>(
    buildDraft(selectedAcademicYearStart)
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const assignmentFilters =
          userRole === 'Unit Manager' && userUnit
            ? {
                academicYearStart: selectedAcademicYearStart,
                unit: userUnit,
              }
            : {
                academicYearStart: selectedAcademicYearStart,
              };

        const [assignmentData, goalData] = await Promise.all([
          fetchAssignments(assignmentFilters),
          fetchGoals({ academicYearStart: selectedAcademicYearStart }),
        ]);

        if (!isMounted) return;

        setAssignments(sortAssignments(assignmentData));
        setGoals(goalData);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load assignments'
        );
        setAssignments([]);
        setGoals([]);
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
  }, [selectedAcademicYearStart, userRole, userUnit]);

  useEffect(() => {
    setShowCreateModal(false);
    setModalError(null);
    setDraft(buildDraft(selectedAcademicYearStart));
  }, [selectedAcademicYearStart]);

  useEffect(() => {
    setDraft((current) => {
      const nextEntityId = goals.some((goal) => goal.id === current.entityId)
        ? current.entityId
        : goals[0]?.id ?? '';

      if (current.entityId === nextEntityId) {
        return current;
      }

      return {
        ...current,
        entityId: nextEntityId,
      };
    });
  }, [goals]);

  const goalsById = useMemo(
    () => new Map(goals.map((goal) => [goal.id, goal])),
    [goals]
  );

  const selectedGoal = useMemo(
    () => (draft.entityId ? goalsById.get(draft.entityId) ?? null : null),
    [draft.entityId, goalsById]
  );

  const handleAddFilter = () => {
    if (selectedFilterType && searchValue.trim()) {
      setActiveFilters((prev) => [
        ...prev,
        {
          type: selectedFilterType,
          value: searchValue.trim(),
        },
      ]);
      setSearchValue('');
      setSelectedFilterType('');
    }
  };

  const handleRemoveFilter = (index: number) => {
    setActiveFilters((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'name':
        return 'Name';
      case 'department':
        return 'Department';
      case 'goalName':
        return 'Goal Name';
      default:
        return 'Choose the filter';
    }
  };

  const getEntityTitle = (assignment: Assignment) => {
    if (assignment.entityType === 'Goal') {
      return goalsById.get(assignment.entityId)?.title ?? 'Unknown Goal';
    }

    if (assignment.entityType === 'KPI') {
      return `KPI ${assignment.entityId}`;
    }

    return `Action ${assignment.entityId}`;
  };

  const filteredAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => {
          if (
            assignment.academicYearStart != null &&
            assignment.academicYearStart !== selectedAcademicYearStart
          ) {
            return false;
          }

          if (filterStatus !== 'all' && assignment.status !== filterStatus) {
            return false;
          }

          if (filterType !== 'all' && assignment.entityType !== filterType) {
            return false;
          }

          for (const activeFilter of activeFilters) {
            const normalizedSearch = activeFilter.value.toLowerCase();

            if (activeFilter.type === 'name') {
              if (!assignment.assignedTo.toLowerCase().includes(normalizedSearch)) {
                return false;
              }
            } else if (activeFilter.type === 'department') {
              if (!assignment.unit.toLowerCase().includes(normalizedSearch)) {
                return false;
              }
            } else if (
              !getEntityTitle(assignment).toLowerCase().includes(normalizedSearch)
            ) {
              return false;
            }
          }

          return true;
        })
        .sort((left, right) => {
          const leftTime = new Date(left.deadline).getTime();
          const rightTime = new Date(right.deadline).getTime();
          return sortOrder === 'asc' ? leftTime - rightTime : rightTime - leftTime;
        }),
    [
      activeFilters,
      assignments,
      filterStatus,
      filterType,
      selectedAcademicYearStart,
      sortOrder,
      goalsById,
    ]
  );

  const stats = useMemo(
    () => ({
      total: filteredAssignments.length,
      pending: filteredAssignments.filter(
        (assignment) => assignment.status === 'Pending'
      ).length,
      active: filteredAssignments.filter(
        (assignment) =>
          assignment.status === 'Accepted' || assignment.status === 'In Progress'
      ).length,
      completed: filteredAssignments.filter(
        (assignment) => assignment.status === 'Completed'
      ).length,
      rejected: filteredAssignments.filter(
        (assignment) => assignment.status === 'Rejected'
      ).length,
    }),
    [filteredAssignments]
  );

  const openCreateModal = () => {
    setModalError(null);
    setDraft(buildDraft(selectedAcademicYearStart, goals[0]?.id ?? ''));
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setModalError(null);
    setDraft(buildDraft(selectedAcademicYearStart, goals[0]?.id ?? ''));
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadOnly) return;

    if (!draft.entityId) {
      setModalError('Select a goal to assign.');
      return;
    }

    const goal = goalsById.get(draft.entityId);
    if (!goal) {
      setModalError('Selected goal could not be found.');
      return;
    }

    if (!draft.assignedTo.trim()) {
      setModalError('Assigned person is required.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    setError(null);

    try {
      const createdAssignment = await createAssignment({
        entityType: 'Goal',
        entityId: draft.entityId,
        academicYearStart: selectedAcademicYearStart,
        assignedTo: draft.assignedTo.trim(),
        assignedBy: userName,
        deadline: draft.deadline,
        notes: draft.notes.trim() || undefined,
        status: 'Pending',
        unit: goal.responsibleUnit,
      });

      setAssignments((prev) => sortAssignments([...prev, createdAssignment]));
      setGoals((prev) =>
        prev.map((item) => {
          if (item.id !== createdAssignment.entityId) {
            return item;
          }

          const assignedTo = item.assignedTo ?? [];
          if (assignedTo.includes(createdAssignment.assignedTo)) {
            return item;
          }

          return {
            ...item,
            assignedTo: [...assignedTo, createdAssignment.assignedTo],
          };
        })
      );
      closeCreateModal();
    } catch (createError) {
      setModalError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create assignment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignmentStatus = async (
    assignmentId: string,
    status: Assignment['status']
  ) => {
    if (isReadOnly) return;

    setUpdatingAssignmentId(assignmentId);
    setError(null);

    try {
      const updatedAssignment = await updateAssignmentStatus(assignmentId, status);
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId ? updatedAssignment : assignment
        )
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update assignment'
      );
    } finally {
      setUpdatingAssignmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2>Assignment Management</h2>
          <p className="text-gray-600">Goal ownership and follow-up assignments</p>
        </div>
        {userRole === 'Strategy Office' && (
          <button
            onClick={openCreateModal}
            disabled={isReadOnly || goals.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isReadOnly || goals.length === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New Assignment
          </button>
        )}
      </div>

      {userRole === 'Strategy Office' && goals.length === 0 && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          No goals exist for {formatAcademicYearRange(selectedAcademicYearStart)}.
          Create a goal first before assigning it.
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm">Filters</h3>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedFilterType}
                onChange={(event) =>
                  setSelectedFilterType(
                    event.target.value as 'name' | 'department' | 'goalName' | ''
                  )
                }
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
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleAddFilter();
                    }
                  }}
                  placeholder={
                    selectedFilterType
                      ? `Search by ${getFilterLabel(selectedFilterType)}...`
                      : 'Select a filter first...'
                  }
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

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {activeFilters.map((filter, index) => (
                  <div
                    key={`${filter.type}-${filter.value}-${index}`}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                  >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
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
                  onChange={(event) =>
                    setFilterType(
                      event.target.value as Assignment['entityType'] | 'all'
                    )
                  }
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

          <div className="border-l border-gray-200 pl-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm">Sort By</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-700 mb-2">Timeline</label>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as 'asc' | 'desc')
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Assignments</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl mb-1">{stats.active}</div>
          <div className="text-sm text-gray-600">Accepted / In Progress</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl mb-1">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl mb-1">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Assignments are loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const isOverdue =
              new Date(assignment.deadline) < new Date() &&
              assignment.status !== 'Completed';
            const canManage =
              assignment.assignedTo === userName || userRole === 'Strategy Office';
            const isUpdating = updatingAssignmentId === assignment.id;

            return (
              <div
                key={assignment.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        {assignment.entityType}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          assignment.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : assignment.status === 'Pending'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
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

                  {canManage && (
                    <div className="ml-4 flex flex-col gap-2">
                      {assignment.status === 'Pending' && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateAssignmentStatus(assignment.id, 'Accepted')
                            }
                            disabled={isReadOnly || isUpdating}
                            className={`px-3 py-1 rounded-lg transition-colors text-sm inline-flex items-center gap-1 ${
                              isReadOnly || isUpdating
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateAssignmentStatus(assignment.id, 'Rejected')
                            }
                            disabled={isReadOnly || isUpdating}
                            className={`px-3 py-1 rounded-lg transition-colors text-sm inline-flex items-center gap-1 ${
                              isReadOnly || isUpdating
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {(assignment.status === 'Accepted' ||
                        assignment.status === 'In Progress') && (
                        <button
                          onClick={() =>
                            handleUpdateAssignmentStatus(assignment.id, 'Completed')
                          }
                          disabled={isReadOnly || isUpdating}
                          className={`px-3 py-1 rounded-lg transition-colors text-sm inline-flex items-center gap-1 ${
                            isReadOnly || isUpdating
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
                  Assignment Date:{' '}
                  {new Date(assignment.assignedDate).toLocaleString()}
                </div>
              </div>
            );
          })}

          {filteredAssignments.length === 0 && (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500">
                No assignments found matching the selected filters.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-900 mb-2">
              <span>About Assignment Management:</span>
            </p>
            <ul className="text-sm text-blue-900 space-y-1">
              <li>• Strategy Office can create and manage all goal assignments</li>
              <li>• Unit Managers only see assignments for their own unit</li>
              <li>• Assignees can accept, reject, or complete their assignments</li>
              <li>• Goal titles now come from the backend for the selected year</li>
            </ul>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3>Create Goal Assignment</h3>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-4 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-700 mb-2">Goal</label>
                <select
                  value={draft.entityId}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      entityId: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.level === 0 ? 'Main Goal' : 'Sub Goal'} - {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGoal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
                  <div>
                    <div className="text-gray-500">Responsible Unit</div>
                    <div className="mt-1 text-gray-900">
                      {selectedGoal.responsibleUnit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Academic Year</div>
                    <div className="mt-1 text-gray-900">
                      {formatAcademicYearRange(selectedGoal.academicYearStart)}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={draft.assignedTo}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        assignedTo: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={draft.deadline}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        deadline: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Notes</label>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
                  placeholder="Optional assignment notes"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
