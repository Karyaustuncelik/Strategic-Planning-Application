import { useEffect, useMemo, useState } from 'react';
import {
  ActionPlan,
  ActionStatus,
  Goal,
  GoalStatus,
  KPI,
  Priority,
  UserRole,
} from '../types';
import { mockActionPlans, mockGoals, mockKPIs } from '../data/mockData';
import {
  ChevronRight,
  ChevronDown,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import {
  formatAcademicYearRange,
  formatDateString,
  getAcademicYearDateRange,
} from '../utils/academicPeriod';

interface HierarchyViewProps {
  userRole: UserRole;
  userUnit?: string;
  onViewDetail: (goalId: string) => void;
  selectedAcademicYearStart: number;
  isReadOnly: boolean;
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
}: HierarchyViewProps) {

  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [kpis, setKpis] = useState<KPI[]>(mockKPIs);
  const [actions, setActions] = useState<ActionPlan[]>(mockActionPlans);

  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(
    new Set(['G001', 'G002', 'G003'])
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [selectedFilterType, setSelectedFilterType] = useState<
    'name' | 'department' | 'goalName' | ''
  >('');
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [goalDraft, setGoalDraft] = useState<GoalDraft | null>(null);
  const [kpiDraft, setKpiDraft] = useState<KpiDraft | null>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft | null>(null);

  const [seededYears, setSeededYears] = useState<number[]>([]);

  const units = [
    'Research Department',
    'Academic Affairs',
    'IT Department',
    'External Relations',
    'Facilities Management',
    'Finance Department',
    'Human Resources',
  ];

  const createSeedData = (yearStart: number) => {
    const mainId = `SG-${yearStart}-M1`;
    const subId = `SG-${yearStart}-S1`;
    const yearDates = getAcademicYearDateRange(yearStart);
    const startDate = formatDateString(yearDates.startDate);
    const endDate = formatDateString(yearDates.endDate);

    const seedGoals: Goal[] = [
      {
        id: mainId,
        title: `Sample Main Goal ${yearStart}`,
        description: 'Demo main goal for quick preview.',
        academicYearStart: yearStart,
        status: 'On Track',
        priority: 'High',
        responsibleUnit: 'Research Department',
        level: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo User',
        startDate,
        endDate,
        progress: 45,
        assignedTo: ['Dr. Sarah Johnson'],
      },
      {
        id: subId,
        title: `Sample Sub Goal ${yearStart}`,
        description: 'Demo sub goal linked to the main goal.',
        academicYearStart: yearStart,
        status: 'On Track',
        priority: 'Medium',
        responsibleUnit: 'Research Department',
        parentId: mainId,
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo User',
        startDate,
        endDate,
        progress: 30,
        assignedTo: ['Dr. Sarah Johnson'],
      },
    ];

    const seedKpis: KPI[] = [
      {
        id: `KPI-${yearStart}-01`,
        goalId: subId,
        name: 'Sample KPI',
        description: 'Demo KPI for the sub goal.',
        targetValue: 100,
        currentValue: 35,
        unit: '%',
        academicYearStart: yearStart,
        responsibleUnit: 'Research Department',
        deadline: endDate,
        status: 'On Track',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo User',
        assignedTo: 'Dr. Sarah Johnson',
      },
    ];

    const seedActions: ActionPlan[] = [
      {
        id: `AP-${yearStart}-01`,
        goalId: subId,
        title: 'Sample Action Plan',
        description: 'Demo action plan item.',
        responsibleUnit: 'Research Department',
        assignedTo: 'Dr. Sarah Johnson',
        deadline: endDate,
        status: 'In Progress',
        progress: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo User',
        notes: '',
        priority: 'Medium',
        academicYearStart: yearStart,
      },
    ];

    return { seedGoals, seedKpis, seedActions };
  };

  useEffect(() => {
    if (seededYears.includes(selectedAcademicYearStart)) return;
    const hasYearGoals = goals.some((goal) => goal.academicYearStart === selectedAcademicYearStart);
    if (!hasYearGoals) {
      const { seedGoals, seedKpis, seedActions } = createSeedData(selectedAcademicYearStart);
      setGoals((prev) => [...prev, ...seedGoals]);
      setKpis((prev) => [...prev, ...seedKpis]);
      setActions((prev) => [...prev, ...seedActions]);
    }
    setSeededYears((prev) => [...prev, selectedAcademicYearStart]);
  }, [goals, seededYears, selectedAcademicYearStart]);

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

  const filteredGoals = goals
    .filter((goal) => {
      if (goal.academicYearStart !== selectedAcademicYearStart) return false;
      if (userUnit && goal.responsibleUnit !== userUnit) return false;
      if (filterStatus !== 'all' && goal.status !== filterStatus) return false;

      for (const filter of activeFilters) {
        if (filter.type === 'name') {
          if (
            !goal.assignedTo ||
            !goal.assignedTo.some((person) =>
              person.toLowerCase().includes(filter.value.toLowerCase())
            )
          ) {
            return false;
          }
        } else if (filter.type === 'department') {
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
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const mainGoals = useMemo(
    () => filteredGoals.filter((goal) => goal.level === 0 && !goal.parentId),
    [filteredGoals]
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

  const getActionYearStart = (action: ActionPlan) => {
    if (action.academicYearStart !== undefined) {
      return action.academicYearStart;
    }
    const goal = goals.find((g) => g.id === action.goalId);
    return goal?.academicYearStart;
  };

  const handleCreateGoal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalDraft) return;

    const yearDates = getAcademicYearDateRange(selectedAcademicYearStart);
    const newGoal: Goal = {
      id: `G${String(Date.now()).slice(-6)}`,
      title: goalDraft.title,
      description: goalDraft.description,
      academicYearStart: selectedAcademicYearStart,
      status: goalDraft.status,
      priority: goalDraft.priority,
      responsibleUnit: goalDraft.responsibleUnit,
      parentId: goalDraft.parentId,
      level: goalDraft.level,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy:
        userRole === 'Strategy Office'
          ? 'Strategy Office Admin'
          : `${goalDraft.responsibleUnit} Manager`,
      startDate: formatDateString(yearDates.startDate),
      endDate: formatDateString(yearDates.endDate),
      progress: 0,
      assignedTo: goalDraft.assignedTo
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    };

    setGoals((prev) => [...prev, newGoal]);
    setGoalDraft(null);
  };

  const handleCreateKpi = (event: React.FormEvent) => {
    event.preventDefault();
    if (!kpiDraft) return;
    const newKpi: KPI = {
      id: `KPI${String(Date.now()).slice(-6)}`,
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
      updatedAt: new Date().toISOString(),
      updatedBy:
        userRole === 'Strategy Office'
          ? 'Strategy Office Admin'
          : `${kpiDraft.responsibleUnit} Manager`,
      assignedTo: kpiDraft.assignedTo,
    };
    setKpis((prev) => [...prev, newKpi]);
    setKpiDraft(null);
  };

  const handleCreateAction = (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionDraft) return;
    const newAction: ActionPlan = {
      id: `AP${String(Date.now()).slice(-6)}`,
      goalId: actionDraft.goalId,
      title: actionDraft.title,
      description: actionDraft.description,
      responsibleUnit: actionDraft.responsibleUnit,
      assignedTo: actionDraft.assignedTo,
      deadline: actionDraft.deadline,
      status: actionDraft.status,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy:
        userRole === 'Strategy Office'
          ? 'Strategy Office Admin'
          : `${actionDraft.responsibleUnit} Manager`,
      notes: '',
      priority: actionDraft.priority,
      academicYearStart: selectedAcademicYearStart,
    };
    setActions((prev) => [...prev, newAction]);
    setActionDraft(null);
  };

  const openMainGoalDraft = () => {
    setGoalDraft({
      level: 0,
      title: '',
      description: '',
      priority: 'Medium',
      status: 'On Track',
      responsibleUnit: userUnit || 'Research Department',
      assignedTo: '',
    });
  };

  const openSubGoalDraft = (parentGoal: Goal) => {
    setGoalDraft({
      parentId: parentGoal.id,
      level: 1,
      title: '',
      description: '',
      priority: 'Medium',
      status: 'On Track',
      responsibleUnit: parentGoal.responsibleUnit,
      assignedTo: '',
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
      status: 'On Track',
      responsibleUnit: subGoal.responsibleUnit,
      assignedTo: '',
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
      assignedTo: '',
    });
  };

  const renderKpiTable = (subGoal: Goal) => {
    const items = kpis.filter(
      (kpi) => kpi.goalId === subGoal.id && kpi.academicYearStart === selectedAcademicYearStart
    );

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm text-gray-700">KPIs</div>
          <button
            onClick={() => openKpiDraft(subGoal)}
            disabled={isReadOnly}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
              isReadOnly
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Plus className="w-3 h-3" />
            Add KPI
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Target</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Owner</th>
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
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="text-sm text-gray-700">Actions</div>
          <button
            onClick={() => openActionDraft(subGoal)}
            disabled={isReadOnly}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
              isReadOnly
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Plus className="w-3 h-3" />
            Add Action
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Title</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs text-gray-700 uppercase">Owner</th>
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
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
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
      <div className="flex items-center justify-between">
        <div>
          <h2>Goal Hierarchy</h2>
          <p className="text-gray-600">Main goals, sub goals, KPIs and actions</p>
        </div>
        <button
          onClick={openMainGoalDraft}
          disabled={isReadOnly}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isReadOnly
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Main Goal
        </button>
      </div>

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
                  placeholder={
                    selectedFilterType ? `Search by ${getFilterLabel(selectedFilterType)}...` : 'Select a filter first...'
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
                    key={index}
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
                <label className="block text-sm text-gray-700 mb-2">Filter by Status</label>
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

          <div className="border-l border-gray-200 pl-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm">Sort By</h3>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-700 mb-2">Timeline</label>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Main Goal</span>
            <span className="text-gray-600">Level 0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Sub Goal</span>
            <span className="text-gray-600">Level 1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">KPI / Action</span>
            <span className="text-gray-600">Level 2 (table format)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {mainGoals.map((goal) => {
          const subGoals = filteredGoals.filter(
            (subGoal) => subGoal.parentId === goal.id && subGoal.level === 1
          );
          const isExpanded = expandedGoals.has(goal.id);

          return (
            <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1">
                    {subGoals.length > 0 ? (
                      <button
                        onClick={() => toggleGoal(goal.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    ) : (
                      <div className="w-7 h-7 flex items-center justify-center">
                        <Target className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                            Main Goal
                          </span>
                          <span className="text-xs text-gray-500">{goal.id}</span>
                          <span className="text-xs text-gray-500">
                            {formatAcademicYearRange(goal.academicYearStart)}
                          </span>
                        </div>
                        <h3 className="mb-2">{goal.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetail(goal.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openSubGoalDraft(goal)}
                          disabled={isReadOnly}
                          className={`p-2 rounded-lg transition-colors ${
                            isReadOnly
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title="Add Sub Goal"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                        {getStatusIcon(goal.status)}
                        {goal.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                      <span className="text-xs text-gray-500">{goal.responsibleUnit}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(goal.startDate).toLocaleDateString()} -{' '}
                        {new Date(goal.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {goal.assignedTo && goal.assignedTo.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Assigned to:</span>
                        <div className="flex flex-wrap gap-1">
                          {goal.assignedTo.map((person, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && subGoals.length > 0 && (
                <div className="border-t border-gray-200">
                  <div className="p-4 space-y-4">
                    {subGoals.map((subGoal) => {
                      const isSubExpanded = expandedGoals.has(subGoal.id);
                      return (
                        <div key={subGoal.id} className="bg-gray-50 rounded-lg border border-gray-200">
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 pt-1">
                                <button
                                  onClick={() => toggleGoal(subGoal.id)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {isSubExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                  )}
                                </button>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                        Sub Goal
                                      </span>
                                      <span className="text-xs text-gray-500">{subGoal.id}</span>
                                    </div>
                                    <h4 className="mb-2">{subGoal.title}</h4>
                                    <p className="text-gray-600 text-sm mb-3">{subGoal.description}</p>
                                  </div>
                                  <button
                                    onClick={() => onViewDetail(subGoal.id)}
                                    className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(subGoal.status)}`}>
                                    {getStatusIcon(subGoal.status)}
                                    {subGoal.status}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(subGoal.priority)}`}>
                                    {subGoal.priority}
                                  </span>
                                  <span className="text-xs text-gray-500">{subGoal.responsibleUnit}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(subGoal.startDate).toLocaleDateString()} -{' '}
                                    {new Date(subGoal.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isSubExpanded && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                {renderKpiTable(subGoal)}
                                {renderActionTable(subGoal)}
                              </div>
                            )}
                          </div>
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
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No goals found matching the selected filters.</p>
        </div>
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
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Responsible Unit</label>
                  <select
                    value={goalDraft.responsibleUnit}
                    onChange={(e) => setGoalDraft({ ...goalDraft, responsibleUnit: e.target.value })}
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Save
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
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Responsible Unit</label>
                  <select
                    value={kpiDraft.responsibleUnit}
                    onChange={(e) => setKpiDraft({ ...kpiDraft, responsibleUnit: e.target.value })}
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Save
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
                  onChange={(e) => setActionDraft({ ...actionDraft, responsibleUnit: e.target.value })}
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
