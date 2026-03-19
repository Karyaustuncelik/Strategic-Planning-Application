import { useEffect, useMemo, useState } from 'react';
import {
  ActionPlan,
  ActionStatus,
  Goal,
  GoalStatus,
  HierarchyNavigationFilter,
  KPI,
  Priority,
  UserRole,
} from '../types';
import {
  ChevronRight,
  ChevronDown,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Filter,
  ArrowUpDown,
  Plus,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  formatAcademicYearRange,
  formatDateString,
  getAcademicYearDateRange,
} from '../utils/academicPeriod';
import {
  copyAcademicYearGoals,
  createActionPlan,
  createGoal,
  createKPI,
  fetchActionPlans,
  fetchGoals,
  fetchKPIs,
  fetchUnitOwners,
  deleteGoal,
  deleteKPI,
  deleteActionPlan,
} from '../lib/api';

interface HierarchyViewProps {
  userRole: UserRole;
  userUnit?: string;
  onViewDetail: (goalId: string) => void;
  selectedAcademicYearStart: number;
  isReadOnly: boolean;
  navigationFilter?: HierarchyNavigationFilter | null;
}

interface ActiveFilter {
  type: 'name' | 'department' | 'goalName';
  value: string;
}

interface GoalDraft {
  parentId?: string;
  level: number;
  title: string;
  description: string;
  priority: Priority;
  status: GoalStatus;
  responsibleUnit: string;
  assignedTo: string;
}

interface KpiDraft {
  goalId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: GoalStatus;
  responsibleUnit: string;
  assignedTo: string;
}

interface ActionDraft {
  goalId: string;
  title: string;
  description: string;
  deadline: string;
  status: ActionStatus;
  priority: Priority;
  responsibleUnit: string;
  assignedTo: string;
}

export function HierarchyView({
  userRole,
  userUnit,
  onViewDetail,
  selectedAcademicYearStart,
  isReadOnly,
  navigationFilter,
}: HierarchyViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isCreatingKpi, setIsCreatingKpi] = useState(false);
  const [isCreatingAction, setIsCreatingAction] = useState(false);

  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(
    new Set(['G001', 'G002', 'G003'])
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const [selectedFilterType, setSelectedFilterType] = useState<
    'name' | 'department' | 'goalName' | ''
  >('');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [goalDraft, setGoalDraft] = useState<GoalDraft | null>(null);
  const [kpiDraft, setKpiDraft] = useState<KpiDraft | null>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft | null>(null);
  const [unitOwnerMap, setUnitOwnerMap] = useState<Map<string, string>>(new Map());
  const [copySourceYearStart, setCopySourceYearStart] = useState(
    selectedAcademicYearStart - 1
  );
  const [copyCandidates, setCopyCandidates] = useState<Goal[]>([]);
  const [selectedCopyGoalIds, setSelectedCopyGoalIds] = useState<string[]>([]);
  const [isCopyingGoals, setIsCopyingGoals] = useState(false);

  const units = [
    'Research Department',
    'Academic Affairs',
    'IT Department',
    'External Relations',
    'Facilities Management',
    'Finance Department',
    'Human Resources',
  ];
  const copyYearOptions = [
    selectedAcademicYearStart - 3,
    selectedAcademicYearStart - 2,
    selectedAcademicYearStart - 1,
  ].filter((year, index, list) => year > 0 && list.indexOf(year) === index);

  useEffect(() => {
    setCopySourceYearStart(selectedAcademicYearStart - 1);
  }, [selectedAcademicYearStart]);

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      setIsLoadingGoals(true);
      setGoalError(null);

      try {
        const [goalData, kpiData, actionData] = await Promise.all([
          fetchGoals({
            academicYearStart: selectedAcademicYearStart,
          }),
          fetchKPIs({
            academicYearStart: selectedAcademicYearStart,
          }),
          fetchActionPlans({
            academicYearStart: selectedAcademicYearStart,
          }),
        ]);
        if (!isMounted) return;
        setGoals(goalData);
        setKpis(kpiData);
        setActions(actionData);
      } catch (loadError) {
        if (!isMounted) return;
        setGoalError(
          loadError instanceof Error ? loadError.message : 'Failed to load goals'
        );
        setGoals([]);
        setKpis([]);
        setActions([]);
      } finally {
        if (isMounted) {
          setIsLoadingGoals(false);
        }
      }
    };

    loadGoals();

    return () => {
      isMounted = false;
    };
  }, [selectedAcademicYearStart]);

  useEffect(() => {
    let isMounted = true;

    const loadUnitOwners = async () => {
      try {
        const data = await fetchUnitOwners({
          academicYearStart: selectedAcademicYearStart,
        });
        if (!isMounted) return;
        setUnitOwnerMap(new Map(data.map((item) => [item.unitName, item.ownerName])));
      } catch {
        if (!isMounted) return;
        setUnitOwnerMap(new Map());
      }
    };

    loadUnitOwners();

    return () => {
      isMounted = false;
    };
  }, [selectedAcademicYearStart]);

  useEffect(() => {
    let isMounted = true;

    const loadCopyCandidates = async () => {
      try {
        const data = await fetchGoals({
          academicYearStart: copySourceYearStart,
        });
        if (!isMounted) return;
        const mainGoalCandidates = data.filter(
          (goal) => goal.level === 0 && !goal.parentId
        );
        setCopyCandidates(mainGoalCandidates);
        setSelectedCopyGoalIds(mainGoalCandidates.map((goal) => goal.id));
      } catch {
        if (!isMounted) return;
        setCopyCandidates([]);
        setSelectedCopyGoalIds([]);
      }
    };

    loadCopyCandidates();

    return () => {
      isMounted = false;
    };
  }, [copySourceYearStart]);

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

  useEffect(() => {
    if (!navigationFilter) return;

    setFilterStatus(navigationFilter.status ?? 'all');
    setFilterLevel(
      navigationFilter.level === undefined ? 'all' : String(navigationFilter.level)
    );

    const nextFilters: ActiveFilter[] = [];

    if (navigationFilter.department) {
      nextFilters.push({
        type: 'department',
        value: navigationFilter.department,
      });
    }

    if (navigationFilter.goalName) {
      nextFilters.push({
        type: 'goalName',
        value: navigationFilter.goalName,
      });
    }

    setActiveFilters(nextFilters);
    setSelectedFilterType('');
    setSearchValue('');
    setExpandedGoals(
      new Set(
        goals
          .filter(
            (goal) =>
              goal.academicYearStart === selectedAcademicYearStart && goal.level === 0
          )
          .map((goal) => goal.id)
      )
    );
  }, [goals, navigationFilter, selectedAcademicYearStart]);

  const goalsInScope = useMemo(
    () =>
      goals.filter((goal) => {
        if (goal.academicYearStart !== selectedAcademicYearStart) return false;
        if (userUnit && goal.responsibleUnit !== userUnit) return false;
        return true;
      }),
    [goals, selectedAcademicYearStart, userUnit]
  );

  const hasActiveHierarchyFilters =
    filterStatus !== 'all' || filterLevel !== 'all' || activeFilters.length > 0;

  const matchingGoalIds = useMemo(() => {
    const matching = new Set<string>();

    for (const goal of goalsInScope) {
      if (filterStatus !== 'all' && goal.status !== filterStatus) {
        continue;
      }

      if (filterLevel !== 'all' && goal.level !== Number(filterLevel)) {
        continue;
      }

      let passesActiveFilters = true;

      for (const filter of activeFilters) {
        const normalizedValue = filter.value.toLowerCase();

        if (filter.type === 'name') {
          if (
            !goal.assignedTo ||
            !goal.assignedTo.some((person) =>
              person.toLowerCase().includes(normalizedValue)
            )
          ) {
            passesActiveFilters = false;
            break;
          }
        } else if (filter.type === 'department') {
          if (!goal.responsibleUnit.toLowerCase().includes(normalizedValue)) {
            passesActiveFilters = false;
            break;
          }
        } else if (!goal.title.toLowerCase().includes(normalizedValue)) {
          passesActiveFilters = false;
          break;
        }
      }

      if (passesActiveFilters) {
        matching.add(goal.id);
      }
    }

    return matching;
  }, [activeFilters, filterLevel, filterStatus, goalsInScope]);

  const visibleGoalIds = useMemo(() => {
    if (!hasActiveHierarchyFilters) {
      return new Set(goalsInScope.map((goal) => goal.id));
    }

    const parentMap = new Map(goalsInScope.map((goal) => [goal.id, goal.parentId]));
    const visible = new Set<string>(matchingGoalIds);

    for (const goalId of matchingGoalIds) {
      let currentParentId = parentMap.get(goalId);

      while (currentParentId) {
        visible.add(currentParentId);
        currentParentId = parentMap.get(currentParentId);
      }
    }

    return visible;
  }, [goalsInScope, hasActiveHierarchyFilters, matchingGoalIds]);

  const sortedGoalsInScope = useMemo(
    () =>
      [...goalsInScope].sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }),
    [goalsInScope, sortOrder]
  );

  const mainGoals = useMemo(
    () =>
      sortedGoalsInScope.filter(
        (goal) =>
          goal.level === 0 &&
          !goal.parentId &&
          (!hasActiveHierarchyFilters || visibleGoalIds.has(goal.id))
      ),
    [hasActiveHierarchyFilters, sortedGoalsInScope, visibleGoalIds]
  );

  const toggleGoal = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const getVisibleSubGoals = (mainGoal: Goal) =>
    sortedGoalsInScope.filter((subGoal) => {
      if (subGoal.parentId !== mainGoal.id || subGoal.level !== 1) {
        return false;
      }

      if (!hasActiveHierarchyFilters) {
        return true;
      }

      if (matchingGoalIds.has(mainGoal.id)) {
        return true;
      }

      return visibleGoalIds.has(subGoal.id);
    });

  const getSubGoalCounts = (subGoal: Goal) => {
    const subGoalKpis = kpis.filter(
      (kpi) =>
        kpi.goalId === subGoal.id &&
        kpi.academicYearStart === selectedAcademicYearStart
    ).length;

    const subGoalActions = actions.filter((action) => {
      if (action.goalId !== subGoal.id) return false;
      return getActionYearStart(action) === selectedAcademicYearStart;
    }).length;

    return {
      kpis: subGoalKpis,
      actions: subGoalActions,
    };
  };

  const getMainGoalCounts = (mainGoal: Goal) => {
    const subGoals = sortedGoalsInScope.filter(
      (subGoal) => subGoal.parentId === mainGoal.id && subGoal.level === 1
    );

    return {
      subGoals: subGoals.length,
      kpis: subGoals.reduce(
        (count, subGoal) => count + getSubGoalCounts(subGoal).kpis,
        0
      ),
      actions: subGoals.reduce(
        (count, subGoal) => count + getSubGoalCounts(subGoal).actions,
        0
      ),
    };
  };

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
        return null;
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

  const getActionYearStart = (action: ActionPlan) => {
    if (action.academicYearStart !== undefined) {
      return action.academicYearStart;
    }
    const goal = goals.find((g) => g.id === action.goalId);
    return goal?.academicYearStart;
  };

  const handleCreateGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalDraft) return;

    const yearDates = getAcademicYearDateRange(selectedAcademicYearStart);
    setIsCreatingGoal(true);
    setGoalError(null);

    try {
      const newGoal = await createGoal({
        title: goalDraft.title,
        description: goalDraft.description,
        academicYearStart: selectedAcademicYearStart,
        status: goalDraft.status,
        priority: goalDraft.priority,
        responsibleUnit: goalDraft.responsibleUnit,
        parentId: goalDraft.parentId,
        startDate: formatDateString(yearDates.startDate),
        endDate: formatDateString(yearDates.endDate),
        progress: 0,
        assignedTo: goalDraft.assignedTo
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean),
        updatedBy:
          userRole === 'Strategy Office'
            ? 'Strategy Office Admin'
            : `${goalDraft.responsibleUnit} Manager`,
      });

      setGoals((prev) =>
        [...prev, newGoal].sort((left, right) => {
          if (left.level !== right.level) return left.level - right.level;
          return left.id.localeCompare(right.id);
        })
      );
      if (goalDraft.parentId) {
        setExpandedGoals((prev) => new Set(prev).add(goalDraft.parentId!));
      }
      setGoalDraft(null);
    } catch (createError) {
      setGoalError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create goal'
      );
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleCreateKpi = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!kpiDraft) return;

    setIsCreatingKpi(true);
    setGoalError(null);

    try {
      const newKpi = await createKPI({
        goalId: kpiDraft.goalId,
        name: kpiDraft.name,
        description: kpiDraft.description,
        targetValue: kpiDraft.targetValue,
        currentValue: kpiDraft.currentValue,
        unit: kpiDraft.unit,
        academicYearStart: selectedAcademicYearStart,
        responsibleUnit: kpiDraft.responsibleUnit,
        deadline: kpiDraft.deadline,
        status: kpiDraft.status,
        updatedBy:
          userRole === 'Strategy Office'
            ? 'Strategy Office Admin'
            : `${kpiDraft.responsibleUnit} Manager`,
        assignedTo: kpiDraft.assignedTo,
      });

      setKpis((prev) => [...prev, newKpi]);
      setKpiDraft(null);
    } catch (createError) {
      setGoalError(
        createError instanceof Error ? createError.message : 'Failed to create KPI'
      );
    } finally {
      setIsCreatingKpi(false);
    }
  };

  const handleCreateAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionDraft) return;

    setIsCreatingAction(true);
    setGoalError(null);

    try {
      const newAction = await createActionPlan({
        goalId: actionDraft.goalId,
        title: actionDraft.title,
        description: actionDraft.description,
        responsibleUnit: actionDraft.responsibleUnit,
        assignedTo: actionDraft.assignedTo,
        deadline: actionDraft.deadline,
        status: actionDraft.status,
        priority: actionDraft.priority,
        progress: 0,
        notes: '',
        academicYearStart: selectedAcademicYearStart,
        updatedBy:
          userRole === 'Strategy Office'
            ? 'Strategy Office Admin'
            : `${actionDraft.responsibleUnit} Manager`,
      });

      setActions((prev) => [...prev, newAction]);
      setActionDraft(null);
    } catch (createError) {
      setGoalError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create action plan'
      );
    } finally {
      setIsCreatingAction(false);
    }
  };

  const openMainGoalDraft = () => {
    const defaultUnit = userUnit || 'Research Department';
    setGoalDraft({
      level: 0,
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Not Started',
      responsibleUnit: defaultUnit,
      assignedTo: unitOwnerMap.get(defaultUnit) ?? '',
    });
  };

  const openSubGoalDraft = (parentGoal: Goal) => {
    setGoalDraft({
      parentId: parentGoal.id,
      level: 1,
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Not Started',
      responsibleUnit: parentGoal.responsibleUnit,
      assignedTo: unitOwnerMap.get(parentGoal.responsibleUnit) ?? '',
    });
  };

  const openKpiDraft = (subGoal: Goal) => {
    const yearDates = getAcademicYearDateRange(selectedAcademicYearStart);
    setKpiDraft({
      goalId: subGoal.id,
      name: '',
      description: '',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      deadline: formatDateString(yearDates.endDate),
      status: 'Not Started',
      responsibleUnit: subGoal.responsibleUnit,
      assignedTo: unitOwnerMap.get(subGoal.responsibleUnit) ?? '',
    });
  };

  const openActionDraft = (subGoal: Goal) => {
    const yearDates = getAcademicYearDateRange(selectedAcademicYearStart);
    setActionDraft({
      goalId: subGoal.id,
      title: '',
      description: '',
      deadline: formatDateString(yearDates.endDate),
      status: 'Not Started',
      priority: 'Medium',
      responsibleUnit: subGoal.responsibleUnit,
      assignedTo: unitOwnerMap.get(subGoal.responsibleUnit) ?? '',
    });
  };

  const handleToggleCopyGoal = (goalId: string) => {
    setSelectedCopyGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((item) => item !== goalId)
        : [...prev, goalId]
    );
  };

  const handleCopyGoals = async () => {
    if (selectedCopyGoalIds.length === 0) {
      setGoalError('Select at least one goal to copy.');
      return;
    }

    setIsCopyingGoals(true);
    setGoalError(null);

    try {
      await copyAcademicYearGoals({
        sourceAcademicYearStart: copySourceYearStart,
        targetAcademicYearStart: selectedAcademicYearStart,
        goalIds: selectedCopyGoalIds,
        requestedBy: 'Strategy Office Admin',
      });

      const [goalData, kpiData, actionData] = await Promise.all([
        fetchGoals({ academicYearStart: selectedAcademicYearStart }),
        fetchKPIs({ academicYearStart: selectedAcademicYearStart }),
        fetchActionPlans({ academicYearStart: selectedAcademicYearStart }),
      ]);

      setGoals(goalData);
      setKpis(kpiData);
      setActions(actionData);
    } catch (copyError) {
      setGoalError(
        copyError instanceof Error
          ? copyError.message
          : 'Failed to copy goals from previous academic year'
      );
    } finally {
      setIsCopyingGoals(false);
    }
  };
  const handleDeleteGoal = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the goal: "${title}"? This will also delete all sub-goals, KPIs, and actions.`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteGoal(id);
      const goalData = await fetchGoals({ academicYearStart: selectedAcademicYearStart });
      setGoals(goalData);
      
      // Also refresh KPIs and Actions if needed (cascading deletes on backend)
      const [kpiData, actionData] = await Promise.all([
        fetchKPIs({ academicYearStart: selectedAcademicYearStart }),
        fetchActionPlans({ academicYearStart: selectedAcademicYearStart }),
      ]);
      setKpis(kpiData);
      setActions(actionData);
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteKPI = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the KPI: "${name}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteKPI(id);
      const kpiData = await fetchKPIs({ academicYearStart: selectedAcademicYearStart });
      setKpis(kpiData);
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Failed to delete KPI');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteActionPlan = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the action: "${title}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteActionPlan(id);
      const actionData = await fetchActionPlans({ academicYearStart: selectedAcademicYearStart });
      setActions(actionData);
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : 'Failed to delete action plan');
    } finally {
      setIsDeleting(null);
    }
  };

  const renderKpiTable = (subGoal: Goal) => {
    const items = kpis.filter(
      (kpi) => kpi.goalId === subGoal.id && kpi.academicYearStart === selectedAcademicYearStart
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="text-sm text-gray-700">KPIs</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Target</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Owner</th>
                <th className="px-4 py-2 text-right text-xs text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{kpi.name}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(kpi.status)}`}>
                      {getStatusIcon(kpi.status)}
                      {kpi.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {kpi.currentValue}/{kpi.targetValue} {kpi.unit}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">{kpi.assignedTo || 'Unassigned'}</td>
                  <td className="px-4 py-2 text-right text-xs">
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteKPI(kpi.id, kpi.name)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete KPI"
                        disabled={isDeleting === kpi.id}
                      >
                        <Trash2 className={`h-4 w-4 ${isDeleting === kpi.id ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No KPIs yet. Use "Add KPI" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderActionTable = (subGoal: Goal) => {
    const items = actions.filter((action) => {
      if (action.goalId !== subGoal.id) return false;
      const yearStart = getActionYearStart(action);
      if (!yearStart || yearStart !== selectedAcademicYearStart) return false;
      return true;
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="text-sm text-gray-700">Actions</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Title</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Owner</th>
                <th className="px-4 py-2 text-right text-xs text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{action.title}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(action.status)}`}>
                      {getStatusIcon(action.status)}
                      {action.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">{action.assignedTo || 'Unassigned'}</td>
                  <td className="px-4 py-2 text-right text-xs">
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteActionPlan(action.id, action.title)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Action"
                        disabled={isDeleting === action.id}
                      >
                        <Trash2 className={`h-4 w-4 ${isDeleting === action.id ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No actions yet. Use "Add Action" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {goalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {goalError}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              <Copy className="h-4 w-4" />
              <span>Copy Previous Year Goals</span>
            </div>
            <select
              value={copySourceYearStart}
              onChange={(e) => setCopySourceYearStart(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              disabled={isReadOnly}
            >
              {copyYearOptions.map((year) => (
                <option key={year} value={year}>
                  {formatAcademicYearRange(year)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCopyGoals}
              disabled={isReadOnly || isCopyingGoals || selectedCopyGoalIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Copy className="h-4 w-4" />
              {isCopyingGoals ? 'Copying...' : 'Copy Selected'}
            </button>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
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
                setSelectedFilterType(
                  e.target.value as 'name' | 'department' | 'goalName' | ''
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose the filter</option>
              <option value="name">Name</option>
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
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="0">Main Goal</option>
              <option value="1">Sub Goal</option>
              <option value="2">Sub Item</option>
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
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {copyCandidates.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              No main goals found for {formatAcademicYearRange(copySourceYearStart)}.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {copyCandidates.map((goal) => (
                <label
                  key={goal.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                    selectedCopyGoalIds.includes(goal.id)
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCopyGoalIds.includes(goal.id)}
                    onChange={() => handleToggleCopyGoal(goal.id)}
                    disabled={isReadOnly}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{goal.title}</span>
                </label>
              ))}
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setActiveFilters([])}
                className="text-sm text-slate-600 underline hover:text-slate-800"
              >
                Clear all filters
              </button>
            </div>
          )}

          <div className="flex justify-start">
            <button
              type="button"
              onClick={openMainGoalDraft}
              disabled={isReadOnly}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                isReadOnly
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Main Goal
            </button>
          </div>
        </div>
      </div>

      {isLoadingGoals ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          Loading goals...
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {mainGoals.map((goal) => {
              const subGoals = getVisibleSubGoals(goal);
              const isExpanded = expandedGoals.has(goal.id);
              const mainGoalCounts = getMainGoalCounts(goal);

              return (
                <div
                  key={goal.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div
                    className={`flex items-start gap-4 p-5 ${
                      subGoals.length > 0 ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (subGoals.length > 0) {
                        toggleGoal(goal.id);
                      }
                    }}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                      {subGoals.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )
                      ) : (
                        <Target className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs text-purple-700">
                          Main Goal
                        </span>
                        <span className="text-xs text-slate-500">{goal.id}</span>
                        <span className="text-xs text-slate-500">
                          {formatAcademicYearRange(goal.academicYearStart)}
                        </span>
                      </div>

                      <h3 className="text-lg text-slate-900">{goal.title}</h3>
                      <p className="mt-2 max-w-4xl text-sm text-slate-600">
                        {goal.description}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${getStatusColor(goal.status)}`}
                        >
                          {getStatusIcon(goal.status)}
                          {goal.status}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${getPriorityColor(goal.priority)}`}
                        >
                          {goal.priority}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                          {goal.responsibleUnit}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(goal.startDate).toLocaleDateString()} -{' '}
                          {new Date(goal.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                          {mainGoalCounts.subGoals} Sub Goals
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                          {mainGoalCounts.kpis} KPIs
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                          {mainGoalCounts.actions} Actions
                        </span>
                      </div>

                      {goal.assignedTo && goal.assignedTo.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">Assigned to:</span>
                          {goal.assignedTo.map((person, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className="ml-auto flex flex-shrink-0 items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        onClick={() => onViewDetail(goal.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition-colors hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openSubGoalDraft(goal)}
                        disabled={isReadOnly}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                          isReadOnly
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title="Add Sub Goal"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeleteGoal(goal.id, goal.title)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                          title="Delete Goal"
                          disabled={isDeleting === goal.id}
                        >
                          <Trash2 className={`h-5 w-5 ${isDeleting === goal.id ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && subGoals.length > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50/80 p-4">
                      <div className="space-y-3">
                        {subGoals.map((subGoal) => {
                          const isSubExpanded = expandedGoals.has(subGoal.id);
                          const subGoalCounts = getSubGoalCounts(subGoal);

                          return (
                            <div
                              key={subGoal.id}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                            >
                              <div
                                className="flex items-start gap-4 p-4 cursor-pointer"
                                onClick={() => toggleGoal(subGoal.id)}
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                  {isSubExpanded ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700">
                                      Sub Goal
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {subGoal.id}
                                    </span>
                                  </div>

                                  <h4 className="text-base text-slate-900">
                                    {subGoal.title}
                                  </h4>
                                  <p className="mt-2 text-sm text-slate-600">
                                    {subGoal.description}
                                  </p>

                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${getStatusColor(subGoal.status)}`}
                                    >
                                      {getStatusIcon(subGoal.status)}
                                      {subGoal.status}
                                    </span>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs ${getPriorityColor(subGoal.priority)}`}
                                    >
                                      {subGoal.priority}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                      {subGoal.responsibleUnit}
                                    </span>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                                      {subGoalCounts.kpis} KPIs
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                                      {subGoalCounts.actions} Actions
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className="ml-auto flex flex-shrink-0 flex-wrap items-center justify-end gap-2"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    onClick={() => onViewDetail(subGoal.id)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition-colors hover:bg-blue-50"
                                    title="View Details"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => openKpiDraft(subGoal)}
                                    disabled={isReadOnly}
                                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs transition-colors ${
                                      isReadOnly
                                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                        : 'border-slate-200 bg-transparent text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Add KPI"
                                  >
                                    <Plus className="h-4 w-4" />
                                    KPI
                                  </button>
                                  <button
                                    onClick={() => openActionDraft(subGoal)}
                                    disabled={isReadOnly}
                                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs transition-colors ${
                                      isReadOnly
                                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                        : 'border-slate-200 bg-transparent text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Add Action"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Action
                                  </button>
                                  {!isReadOnly && (
                                    <button
                                      onClick={() => handleDeleteGoal(subGoal.id, subGoal.title)}
                                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                      title="Delete Sub Goal"
                                      disabled={isDeleting === subGoal.id}
                                    >
                                      <Trash2 className={`h-5 w-5 ${isDeleting === subGoal.id ? 'animate-pulse' : ''}`} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isSubExpanded && (
                                <div className="border-t border-slate-200 bg-slate-50/60 p-4">
                                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    {renderKpiTable(subGoal)}
                                    {renderActionTable(subGoal)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {mainGoals.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-slate-500">
                No goals found matching the selected filters.
              </p>
            </div>
          )}
        </>
      )}

      {goalDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3>{goalDraft.level === 0 ? 'Add Main Goal' : 'Add Sub Goal'}</h3>
              <button onClick={() => setGoalDraft(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={goalDraft.title}
                  onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={goalDraft.description}
                  onChange={(e) => setGoalDraft({ ...goalDraft, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Priority</label>
                  <select
                    value={goalDraft.priority}
                    onChange={(e) => setGoalDraft({ ...goalDraft, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Status</label>
                  <select
                    value={goalDraft.status}
                    onChange={(e) => setGoalDraft({ ...goalDraft, status: e.target.value as GoalStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Started">Not Started</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Responsible Unit</label>
                  <select
                    value={goalDraft.responsibleUnit}
                    onChange={(e) =>
                      setGoalDraft({
                        ...goalDraft,
                        responsibleUnit: e.target.value,
                        assignedTo: unitOwnerMap.get(e.target.value) ?? goalDraft.assignedTo,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={userRole === 'Unit Manager'}
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Assigned To (comma separated)</label>
                <input
                  type="text"
                  value={goalDraft.assignedTo}
                  onChange={(e) => setGoalDraft({ ...goalDraft, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setGoalDraft(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGoal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
                >
                  {isCreatingGoal ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {kpiDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3>Add KPI</h3>
              <button onClick={() => setKpiDraft(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateKpi} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={kpiDraft.name}
                  onChange={(e) => setKpiDraft({ ...kpiDraft, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={kpiDraft.description}
                  onChange={(e) => setKpiDraft({ ...kpiDraft, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Target</label>
                  <input
                    type="number"
                    value={kpiDraft.targetValue}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, targetValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Current</label>
                  <input
                    type="number"
                    value={kpiDraft.currentValue}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, currentValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={kpiDraft.unit}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={kpiDraft.deadline}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Status</label>
                  <select
                    value={kpiDraft.status}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, status: e.target.value as GoalStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Started">Not Started</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Responsible Unit</label>
                  <select
                    value={kpiDraft.responsibleUnit}
                    onChange={(e) =>
                      setKpiDraft({
                        ...kpiDraft,
                        responsibleUnit: e.target.value,
                        assignedTo: unitOwnerMap.get(e.target.value) ?? kpiDraft.assignedTo,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={userRole === 'Unit Manager'}
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    value={kpiDraft.assignedTo}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setKpiDraft(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingKpi}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
                >
                  {isCreatingKpi ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3>Add Action</h3>
              <button onClick={() => setActionDraft(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={actionDraft.title}
                  onChange={(e) => setActionDraft({ ...actionDraft, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={actionDraft.description}
                  onChange={(e) => setActionDraft({ ...actionDraft, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Deadline</label>
                  <input
                    type="date"
                    value={actionDraft.deadline}
                    onChange={(e) => setActionDraft({ ...actionDraft, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Status</label>
                  <select
                    value={actionDraft.status}
                    onChange={(e) => setActionDraft({ ...actionDraft, status: e.target.value as ActionStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Priority</label>
                  <select
                    value={actionDraft.priority}
                    onChange={(e) => setActionDraft({ ...actionDraft, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    value={actionDraft.assignedTo}
                    onChange={(e) => setActionDraft({ ...actionDraft, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Responsible Unit</label>
                <select
                  value={actionDraft.responsibleUnit}
                  onChange={(e) =>
                    setActionDraft({
                      ...actionDraft,
                      responsibleUnit: e.target.value,
                      assignedTo: unitOwnerMap.get(e.target.value) ?? actionDraft.assignedTo,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={userRole === 'Unit Manager'}
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActionDraft(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
                >
                  {isCreatingAction ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
