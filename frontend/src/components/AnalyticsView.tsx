import { useEffect, useMemo, useState } from 'react';
import {
  ActionPlan,
  Goal,
  HierarchyNavigationFilter,
  KPI,
  UserRole,
} from '../types';
import { fetchActionPlans, fetchGoals, fetchKPIs } from '../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { formatAcademicYearRange } from '../utils/academicPeriod';

interface AnalyticsViewProps {
  userRole: UserRole;
  userUnit?: string;
  selectedAcademicYearRange: string;
  selectedAcademicYearStart: number;
  availableAcademicYears: string[];
  onOpenHierarchy: (filters: HierarchyNavigationFilter | null) => void;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getKpiAchievement(kpi: KPI) {
  if (kpi.targetValue === 0) return 0;
  return Math.round((kpi.currentValue / kpi.targetValue) * 100);
}

function estimateProgressAtDate(
  finalProgress: number,
  startDate: Date,
  endDate: Date,
  pointInTime: Date
) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const pointTime = pointInTime.getTime();

  if (pointTime <= startTime) return 0;
  if (pointTime >= endTime || endTime <= startTime) return finalProgress;

  const ratio = (pointTime - startTime) / (endTime - startTime);
  return Math.round(finalProgress * ratio);
}

function buildAcademicYearMonths(yearStart: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(yearStart, 8 + index, 1);
    return {
      label: date.toLocaleString('en-US', { month: 'short' }),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });
}

export function AnalyticsView({
  userRole,
  userUnit,
  selectedAcademicYearRange,
  selectedAcademicYearStart,
  availableAcademicYears,
  onOpenHierarchy,
}: AnalyticsViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>(userUnit || 'all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previousYearStart = selectedAcademicYearStart - 1;

  useEffect(() => {
    if (userRole === 'Unit Manager' && userUnit) {
      setSelectedUnit(userUnit);
    }
  }, [userRole, userUnit]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [goalData, kpiData, actionData] = await Promise.all([
          fetchGoals(),
          fetchKPIs(),
          fetchActionPlans(),
        ]);

        if (!isMounted) return;

        setGoals(goalData);
        setKpis(kpiData);
        setActions(actionData);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load analytics data'
        );
        setGoals([]);
        setKpis([]);
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
  }, []);

  const goalsForCurrentYear = useMemo(
    () =>
      goals.filter((goal) => goal.academicYearStart === selectedAcademicYearStart),
    [goals, selectedAcademicYearStart]
  );

  const kpisForCurrentYear = useMemo(
    () =>
      kpis.filter((kpi) => kpi.academicYearStart === selectedAcademicYearStart),
    [kpis, selectedAcademicYearStart]
  );

  const actionsForCurrentYear = useMemo(
    () =>
      actions.filter(
        (action) => action.academicYearStart === selectedAcademicYearStart
      ),
    [actions, selectedAcademicYearStart]
  );

  const goalsForPreviousYear = useMemo(
    () => goals.filter((goal) => goal.academicYearStart === previousYearStart),
    [goals, previousYearStart]
  );

  const kpisForPreviousYear = useMemo(
    () => kpis.filter((kpi) => kpi.academicYearStart === previousYearStart),
    [kpis, previousYearStart]
  );

  const actionsForPreviousYear = useMemo(
    () => actions.filter((action) => action.academicYearStart === previousYearStart),
    [actions, previousYearStart]
  );

  const applyUnitFilter = <T extends { responsibleUnit: string }>(items: T[]) => {
    if (selectedUnit === 'all') return items;
    return items.filter((item) => item.responsibleUnit === selectedUnit);
  };

  const filteredGoals = useMemo(
    () => applyUnitFilter(goalsForCurrentYear),
    [goalsForCurrentYear, selectedUnit]
  );
  const filteredKPIs = useMemo(
    () => applyUnitFilter(kpisForCurrentYear),
    [kpisForCurrentYear, selectedUnit]
  );
  const filteredActions = useMemo(
    () => applyUnitFilter(actionsForCurrentYear),
    [actionsForCurrentYear, selectedUnit]
  );

  const previousGoals = useMemo(
    () => applyUnitFilter(goalsForPreviousYear),
    [goalsForPreviousYear, selectedUnit]
  );
  const previousKPIs = useMemo(
    () => applyUnitFilter(kpisForPreviousYear),
    [kpisForPreviousYear, selectedUnit]
  );
  const previousActions = useMemo(
    () => applyUnitFilter(actionsForPreviousYear),
    [actionsForPreviousYear, selectedUnit]
  );

  const units = useMemo(
    () =>
      Array.from(
        new Set(
          goals
            .map((goal) => goal.responsibleUnit)
            .concat(kpis.map((kpi) => kpi.responsibleUnit))
            .concat(actions.map((action) => action.responsibleUnit))
        )
      ).sort(),
    [actions, goals, kpis]
  );

  const goalsByStatus = [
    {
      name: 'On Track',
      value: filteredGoals.filter((goal) => goal.status === 'On Track').length,
      color: '#10b981',
    },
    {
      name: 'At Risk',
      value: filteredGoals.filter((goal) => goal.status === 'At Risk').length,
      color: '#f59e0b',
    },
    {
      name: 'Delayed',
      value: filteredGoals.filter((goal) => goal.status === 'Delayed').length,
      color: '#ef4444',
    },
    {
      name: 'Completed',
      value: filteredGoals.filter((goal) => goal.status === 'Completed').length,
      color: '#3b82f6',
    },
    {
      name: 'Not Started',
      value: filteredGoals.filter((goal) => goal.status === 'Not Started').length,
      color: '#6b7280',
    },
  ];

  const goalsByPriority = [
    {
      name: 'Critical',
      value: filteredGoals.filter((goal) => goal.priority === 'Critical').length,
      color: '#ef4444',
    },
    {
      name: 'High',
      value: filteredGoals.filter((goal) => goal.priority === 'High').length,
      color: '#f59e0b',
    },
    {
      name: 'Medium',
      value: filteredGoals.filter((goal) => goal.priority === 'Medium').length,
      color: '#3b82f6',
    },
    {
      name: 'Low',
      value: filteredGoals.filter((goal) => goal.priority === 'Low').length,
      color: '#6b7280',
    },
  ];

  const goalsByLevel = [
    {
      name: 'Main Goal',
      value: filteredGoals.filter((goal) => goal.level === 0).length,
      color: '#8b5cf6',
    },
    {
      name: 'Sub Goal',
      value: filteredGoals.filter((goal) => goal.level === 1).length,
      color: '#3b82f6',
    },
    {
      name: 'Sub Item',
      value: filteredGoals.filter((goal) => goal.level === 2).length,
      color: '#6b7280',
    },
  ];

  const unitsForComparison = useMemo(() => {
    if (selectedUnit !== 'all') {
      return [selectedUnit];
    }

    return Array.from(
      new Set(
        goalsForCurrentYear
          .map((goal) => goal.responsibleUnit)
          .concat(kpisForCurrentYear.map((kpi) => kpi.responsibleUnit))
          .concat(actionsForCurrentYear.map((action) => action.responsibleUnit))
          .concat(goalsForPreviousYear.map((goal) => goal.responsibleUnit))
          .concat(kpisForPreviousYear.map((kpi) => kpi.responsibleUnit))
          .concat(actionsForPreviousYear.map((action) => action.responsibleUnit))
      )
    ).sort();
  }, [
    actionsForCurrentYear,
    actionsForPreviousYear,
    goalsForCurrentYear,
    goalsForPreviousYear,
    kpisForCurrentYear,
    kpisForPreviousYear,
    selectedUnit,
  ]);

  const unitPerformance = useMemo(
    () =>
      unitsForComparison.map((unit) => {
        const unitGoals = goalsForCurrentYear.filter(
          (goal) => goal.responsibleUnit === unit
        );
        const unitKPIs = kpisForCurrentYear.filter(
          (kpi) => kpi.responsibleUnit === unit
        );
        const unitActions = actionsForCurrentYear.filter(
          (action) => action.responsibleUnit === unit
        );

        const prevUnitGoals = goalsForPreviousYear.filter(
          (goal) => goal.responsibleUnit === unit
        );
        const prevUnitKPIs = kpisForPreviousYear.filter(
          (kpi) => kpi.responsibleUnit === unit
        );
        const prevUnitActions = actionsForPreviousYear.filter(
          (action) => action.responsibleUnit === unit
        );

        const goalProgress = average(unitGoals.map((goal) => goal.progress));
        const kpiProgress = average(unitKPIs.map(getKpiAchievement));
        const actionProgress = average(unitActions.map((action) => action.progress));
        const overall = average([goalProgress, kpiProgress, actionProgress]);

        const prevGoalProgress = average(prevUnitGoals.map((goal) => goal.progress));
        const prevKpiProgress = average(prevUnitKPIs.map(getKpiAchievement));
        const prevActionProgress = average(
          prevUnitActions.map((action) => action.progress)
        );
        const previousOverall = average([
          prevGoalProgress,
          prevKpiProgress,
          prevActionProgress,
        ]);

        return {
          unit: unit.split(' ')[0],
          fullUnit: unit,
          goals: unitGoals.length,
          kpis: unitKPIs.length,
          actions: unitActions.length,
          goalProgress,
          kpiProgress,
          actionProgress,
          overall,
          previousOverall,
          performanceChange: overall - previousOverall,
          goalProgressChange: goalProgress - prevGoalProgress,
          kpiProgressChange: kpiProgress - prevKpiProgress,
          actionProgressChange: actionProgress - prevActionProgress,
        };
      }),
    [
      actionsForCurrentYear,
      actionsForPreviousYear,
      goalsForCurrentYear,
      goalsForPreviousYear,
      kpisForCurrentYear,
      kpisForPreviousYear,
      unitsForComparison,
    ]
  );

  const kpiPerformance = useMemo(
    () =>
      filteredKPIs.map((kpi) => ({
        name: kpi.name.length > 20 ? `${kpi.name.slice(0, 20)}...` : kpi.name,
        fullName: kpi.name,
        progress: getKpiAchievement(kpi),
      })),
    [filteredKPIs]
  );

  const progressTrend = useMemo(() => {
    const months = buildAcademicYearMonths(selectedAcademicYearStart);
    const academicYearStartDate = new Date(selectedAcademicYearStart, 8, 1);

    return months.map((month) => ({
      month: month.label,
      goals: average(
        filteredGoals.map((goal) =>
          estimateProgressAtDate(
            goal.progress,
            new Date(goal.startDate),
            new Date(goal.endDate),
            month.end
          )
        )
      ),
      kpi: average(
        filteredKPIs.map((kpi) =>
          estimateProgressAtDate(
            getKpiAchievement(kpi),
            academicYearStartDate,
            new Date(kpi.deadline),
            month.end
          )
        )
      ),
      actions: average(
        filteredActions.map((action) =>
          estimateProgressAtDate(
            action.progress,
            new Date(action.createdAt),
            new Date(action.deadline),
            month.end
          )
        )
      ),
    }));
  }, [filteredActions, filteredGoals, filteredKPIs, selectedAcademicYearStart]);

  const radarData = unitPerformance.slice(0, 5).map((item) => ({
    unit: item.unit,
    Goals: item.goalProgress,
    KPI: item.kpiProgress,
    Actions: item.actionProgress,
  }));

  const handleExport = () => {
    window.alert(
      'Export report feature is not implemented yet. Current analytics are now backed by live backend data.'
    );
  };

  const openHierarchyWithAnalyticsFilters = (
    filters: HierarchyNavigationFilter = {}
  ) => {
    onOpenHierarchy({
      ...filters,
      department:
        filters.department ?? (selectedUnit !== 'all' ? selectedUnit : undefined),
    });
  };

  const handleStatusClick = (status: string) => {
    if (
      !['On Track', 'At Risk', 'Delayed', 'Completed', 'Not Started'].includes(
        status
      )
    ) {
      return;
    }

    openHierarchyWithAnalyticsFilters({
      status: status as HierarchyNavigationFilter['status'],
    });
  };

  const handleLevelClick = (levelName: string) => {
    const levelMap: Record<string, 0 | 1 | 2> = {
      'Main Goal': 0,
      'Sub Goal': 1,
      'Sub Item': 2,
    };

    const nextLevel = levelMap[levelName];
    if (nextLevel === undefined) return;

    openHierarchyWithAnalyticsFilters({
      level: nextLevel,
    });
  };

  const handleUnitClick = (unitName: string) => {
    if (!unitName) return;

    openHierarchyWithAnalyticsFilters({
      department: unitName,
    });
  };

  const avgGoalProgress = average(filteredGoals.map((goal) => goal.progress));
  const avgKPIProgress = average(filteredKPIs.map(getKpiAchievement));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Analytics & Charts</h2>
          <p className="text-gray-600">
            Detailed performance analysis and visualization
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Analytics data is loading...</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Academic Year Range
                </label>
                <select
                  value={selectedAcademicYearRange}
                  disabled
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {availableAcademicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {userRole !== 'Unit Manager' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Unit</label>
                  <select
                    value={selectedUnit}
                    onChange={(event) => setSelectedUnit(event.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Units</option>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <span>Current Period: </span>
              <span className="font-medium">
                {formatAcademicYearRange(selectedAcademicYearStart)}
              </span>
              <span className="ml-4">Previous Period: </span>
              <span className="font-medium">
                {formatAcademicYearRange(previousYearStart)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl">{avgGoalProgress}%</span>
              </div>
              <div className="text-sm opacity-90">Average Goal Progress</div>
              {previousGoals.length > 0 && (() => {
                const prevAvg = average(previousGoals.map((goal) => goal.progress));
                const change = avgGoalProgress - prevAvg;

                return (
                  <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {change !== 0 &&
                      (change > 0 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      ))}
                    {change > 0 ? '+' : ''}
                    {change}% vs previous
                  </div>
                );
              })()}
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
                <span className="text-3xl">{avgKPIProgress}%</span>
              </div>
              <div className="text-sm opacity-90">Average KPI Achievement</div>
              {previousKPIs.length > 0 && (() => {
                const prevAvg = average(previousKPIs.map(getKpiAchievement));
                const change = avgKPIProgress - prevAvg;

                return (
                  <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {change !== 0 &&
                      (change > 0 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      ))}
                    {change > 0 ? '+' : ''}
                    {change}% vs previous
                  </div>
                );
              })()}
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl">{filteredGoals.length}</span>
              </div>
              <div className="text-sm opacity-90">Total Goals</div>
              {previousGoals.length > 0 && (() => {
                const change = filteredGoals.length - previousGoals.length;

                return (
                  <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {change !== 0 &&
                      (change > 0 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      ))}
                    {change > 0 ? '+' : ''}
                    {change} vs previous
                  </div>
                );
              })()}
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-8 h-8 opacity-80" />
                <span className="text-3xl">
                  {
                    filteredGoals.filter(
                      (goal) =>
                        goal.status === 'At Risk' || goal.status === 'Delayed'
                    ).length
                  }
                </span>
              </div>
              <div className="text-sm opacity-90">At Risk / Delayed</div>
              {previousGoals.length > 0 && (() => {
                const prevCount = previousGoals.filter(
                  (goal) =>
                    goal.status === 'At Risk' || goal.status === 'Delayed'
                ).length;
                const currentCount = filteredGoals.filter(
                  (goal) =>
                    goal.status === 'At Risk' || goal.status === 'Delayed'
                ).length;
                const change = currentCount - prevCount;

                return (
                  <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {change !== 0 &&
                      (change < 0 ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      ))}
                    {change > 0 ? '+' : ''}
                    {change} vs previous
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="mb-4">Goals Distribution by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={goalsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                    outerRadius={100}
                    dataKey="value"
                    onClick={(_, index) => {
                      const item = goalsByStatus[index];
                      if (item && item.value > 0) {
                        handleStatusClick(item.name);
                      }
                    }}
                  >
                    {goalsByStatus.map((entry, index) => (
                      <Cell
                        key={`goals-status-${index}`}
                        fill={entry.color}
                        style={{ cursor: entry.value > 0 ? 'pointer' : 'default' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-2">
                {goalsByStatus.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleStatusClick(item.name)}
                    disabled={item.value === 0}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name} ({item.value})
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="mb-4">Goals Distribution by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={goalsByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {goalsByPriority.map((entry, index) => (
                      <Cell key={`goals-priority-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="mb-4">Goals Distribution by Level</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goalsByLevel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#8b5cf6"
                    onClick={(data) => handleLevelClick(data.name)}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-2">
                {goalsByLevel.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleLevelClick(item.name)}
                    disabled={item.value === 0}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.name} ({item.value})
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="mb-4">Unit Performance Comparison</h3>
              <div className="mb-2 text-sm text-gray-600">
                Current vs Previous Period
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={unitPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unit" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="overall"
                    fill="#3b82f6"
                    name={formatAcademicYearRange(selectedAcademicYearStart)}
                    onClick={(data) => handleUnitClick(data.fullUnit)}
                  />
                  <Bar
                    dataKey="previousOverall"
                    fill="#94a3b8"
                    name={formatAcademicYearRange(previousYearStart)}
                    onClick={(data) => handleUnitClick(data.fullUnit)}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-2">
                {unitPerformance.map((unit) => (
                  <button
                    key={unit.fullUnit}
                    type="button"
                    onClick={() => handleUnitClick(unit.fullUnit)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    {unit.fullUnit}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
              <h3 className="mb-4">Academic Year Progress Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="goals"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Goals"
                  />
                  <Line
                    type="monotone"
                    dataKey="kpi"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="KPIs"
                  />
                  <Line
                    type="monotone"
                    dataKey="actions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Action Plans"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
              <h3 className="mb-4">KPI Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpiPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" fill="#10b981" name="Achievement %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
              <h3 className="mb-4">Unit Performance Radar</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="unit" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Goals"
                    dataKey="Goals"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="KPI"
                    dataKey="KPI"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Actions"
                    dataKey="Actions"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="mb-4">Detailed Unit Statistics</h3>
            <div className="mb-4 text-sm text-gray-600">
              Comparing {formatAcademicYearRange(selectedAcademicYearStart)} with{' '}
              {formatAcademicYearRange(previousYearStart)}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Unit</th>
                    <th className="text-center py-3 px-4">Goals</th>
                    <th className="text-center py-3 px-4">KPIs</th>
                    <th className="text-center py-3 px-4">Actions</th>
                    <th className="text-center py-3 px-4">Goal Progress</th>
                    <th className="text-center py-3 px-4">KPI Achievement</th>
                    <th className="text-center py-3 px-4">Overall Performance</th>
                    <th className="text-center py-3 px-4">Previous Year</th>
                    <th className="text-center py-3 px-4">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {unitPerformance.map((unit) => {
                    const hasChange = unit.performanceChange !== 0;
                    const isImprovement = unit.performanceChange > 0;
                    const changePercent =
                      unit.previousOverall > 0
                        ? Math.round(
                            (unit.performanceChange / unit.previousOverall) * 100
                          )
                        : unit.performanceChange;

                    return (
                      <tr
                        key={unit.fullUnit}
                        className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                        onClick={() => handleUnitClick(unit.fullUnit)}
                      >
                        <td className="py-3 px-4 font-medium">{unit.fullUnit}</td>
                        <td className="text-center py-3 px-4">{unit.goals}</td>
                        <td className="text-center py-3 px-4">{unit.kpis}</td>
                        <td className="text-center py-3 px-4">{unit.actions}</td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <span>{unit.goalProgress}%</span>
                            {hasChange && (
                              <span
                                className={`text-xs ${
                                  isImprovement ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {unit.goalProgressChange > 0 ? '+' : ''}
                                {unit.goalProgressChange}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <span>{unit.kpiProgress}%</span>
                            {hasChange && (
                              <span
                                className={`text-xs ${
                                  isImprovement ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {unit.kpiProgressChange > 0 ? '+' : ''}
                                {unit.kpiProgressChange}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              unit.overall >= 80
                                ? 'bg-green-100 text-green-700'
                                : unit.overall >= 60
                                  ? 'bg-blue-100 text-blue-700'
                                  : unit.overall >= 40
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {unit.overall}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              unit.previousOverall >= 80
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : unit.previousOverall >= 60
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                  : unit.previousOverall >= 40
                                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                    : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            {unit.previousOverall}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {hasChange ? (
                            <div className="flex items-center justify-center gap-1">
                              {isImprovement ? (
                                <ArrowUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowDown className="w-4 h-4 text-red-600" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  isImprovement ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {isImprovement ? '+' : ''}
                                {unit.performanceChange}%
                              </span>
                              {unit.previousOverall > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({changePercent > 0 ? '+' : ''}
                                  {changePercent}%)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-gray-400">
                              <Minus className="w-4 h-4" />
                              <span className="text-sm">0%</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {unitPerformance.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-8 px-4 text-center text-sm text-gray-500"
                      >
                        No analytics data found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
