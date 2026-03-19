import { useEffect, useMemo, useState } from 'react';
import { ActionPlan, Goal, KPI, UserRole } from '../types';
import { fetchActionPlans, fetchGoals, fetchKPIs } from '../lib/api';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ListTodo,
} from 'lucide-react';

import { Phase1Checklist } from './Phase1Checklist';

interface DashboardProps {
  userRole: UserRole;
  userUnit?: string;
  selectedAcademicYearStart: number;
  onOpenHierarchy: () => void;
}

export function Dashboard({
  userRole,
  userUnit,
  selectedAcademicYearStart,
  onOpenHierarchy,
}: DashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [goalData, kpiData, actionData] = await Promise.all([
          fetchGoals({ academicYearStart: selectedAcademicYearStart }),
          fetchKPIs({ academicYearStart: selectedAcademicYearStart }),
          fetchActionPlans({ academicYearStart: selectedAcademicYearStart }),
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
            : 'Failed to load dashboard data'
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
  }, [selectedAcademicYearStart]);

  const filteredGoals = useMemo(
    () =>
      userUnit
        ? goals.filter((goal) => goal.responsibleUnit === userUnit)
        : goals,
    [goals, userUnit]
  );

  const filteredKPIs = useMemo(
    () =>
      userUnit ? kpis.filter((kpi) => kpi.responsibleUnit === userUnit) : kpis,
    [kpis, userUnit]
  );

  const filteredActions = useMemo(
    () =>
      userUnit
        ? actions.filter((action) => action.responsibleUnit === userUnit)
        : actions,
    [actions, userUnit]
  );

  const stats = useMemo(() => {
    const kpisOnTarget = filteredKPIs.filter((kpi) => {
      if (kpi.targetValue === 0) return false;
      return kpi.currentValue / kpi.targetValue >= 0.8;
    }).length;

    const avgProgress =
      filteredGoals.length > 0
        ? Math.round(
            filteredGoals.reduce((sum, goal) => sum + goal.progress, 0) /
              filteredGoals.length
          )
        : 0;

    return {
      totalGoals: filteredGoals.length,
      mainGoals: filteredGoals.filter((goal) => goal.level === 0).length,
      subGoals: filteredGoals.filter((goal) => goal.level === 1).length,
      goalsOnTrack: filteredGoals.filter((goal) => goal.status === 'On Track').length,
      goalsAtRisk: filteredGoals.filter((goal) => goal.status === 'At Risk').length,
      goalsDelayed: filteredGoals.filter((goal) => goal.status === 'Delayed').length,
      totalKPIs: filteredKPIs.length,
      kpisOnTarget,
      totalActions: filteredActions.length,
      actionsCompleted: filteredActions.filter(
        (action) => action.status === 'Completed'
      ).length,
      actionsInProgress: filteredActions.filter(
        (action) => action.status === 'In Progress'
      ).length,
      actionsBlocked: filteredActions.filter(
        (action) => action.status === 'Blocked'
      ).length,
      avgProgress,
    };
  }, [filteredActions, filteredGoals, filteredKPIs]);

  const upcomingDeadlines = useMemo(
    () =>
      [...filteredActions]
        .filter((action) => action.status !== 'Completed')
        .sort(
          (left, right) =>
            new Date(left.deadline).getTime() - new Date(right.deadline).getTime()
        )
        .slice(0, 5),
    [filteredActions]
  );

  const statusBadge = (goal: Goal) => {
    if (goal.status === 'On Track') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <CheckCircle className="w-3 h-3" />
          On Track
        </span>
      );
    }

    if (goal.status === 'At Risk') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
          <AlertTriangle className="w-3 h-3" />
          At Risk
        </span>
      );
    }

    if (goal.status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }

    if (goal.status === 'Not Started') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
          <Clock className="w-3 h-3" />
          Not Started
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
        <Clock className="w-3 h-3" />
        Delayed
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-600">
          {userUnit ? `${userUnit} Performance` : 'Organization-Wide Performance'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Phase1Checklist />

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Dashboard data is loading...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              type="button"
              onClick={onOpenHierarchy}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-gray-500">Goals</span>
              </div>
              <div className="text-3xl mb-2">{stats.totalGoals}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">
                  {stats.goalsOnTrack} <span>On Track</span>
                </span>
                {stats.goalsAtRisk > 0 && (
                  <span className="text-orange-600">
                    {stats.goalsAtRisk} <span>At Risk</span>
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenHierarchy}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-gray-500">KPIs</span>
              </div>
              <div className="text-3xl mb-2">{stats.totalKPIs}</div>
              <div className="text-sm text-gray-600">
                {stats.kpisOnTarget} <span>On Target</span> (
                {stats.totalKPIs > 0
                  ? Math.round((stats.kpisOnTarget / stats.totalKPIs) * 100)
                  : 0}
                %)
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenHierarchy}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <ListTodo className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-gray-500">Action Plans</span>
              </div>
              <div className="text-3xl mb-2">{stats.totalActions}</div>
              <div className="text-sm text-gray-600">
                {stats.actionsCompleted} <span>Completed</span>,{' '}
                {stats.actionsInProgress} <span>In Progress</span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenHierarchy}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-gray-500">Alerts</span>
              </div>
              <div className="text-3xl mb-2">
                {stats.goalsAtRisk + stats.goalsDelayed + stats.actionsBlocked}
              </div>
              <div className="text-sm text-gray-600">Items requiring attention</div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl mb-1">{stats.mainGoals}</div>
              <div className="text-sm text-gray-600">Main Goals</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl mb-1">{stats.subGoals}</div>
              <div className="text-sm text-gray-600">Sub Goals</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl mb-1">{stats.avgProgress}%</div>
              <div className="text-sm text-gray-600">Average Progress</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="mb-4">Goals by Status</h3>
              <div className="space-y-3">
                {filteredGoals.slice(0, 5).map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm mb-1">{goal.title}</div>
                      <div className="text-xs text-gray-500">
                        {goal.responsibleUnit}
                      </div>
                    </div>
                    <div className="ml-4">{statusBadge(goal)}</div>
                  </div>
                ))}

                {filteredGoals.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No goals found for the selected year.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((action) => {
                  const daysUntil = Math.ceil(
                    (new Date(action.deadline).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="text-sm mb-1">{action.title}</div>
                        <div className="text-xs text-gray-500">
                          {action.responsibleUnit}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div
                          className={`text-sm ${
                            daysUntil < 7 ? 'text-red-600' : 'text-gray-700'
                          }`}
                        >
                          {new Date(action.deadline).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {daysUntil >= 0 ? (
                            <>
                              {daysUntil} <span>days</span>
                            </>
                          ) : (
                            'Overdue'
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {upcomingDeadlines.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No upcoming action deadlines.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="mb-4">KPI Performance Overview</h3>
            <div className="space-y-4">
              {filteredKPIs.slice(0, 6).map((kpi) => {
                const percentage =
                  kpi.targetValue > 0
                    ? Math.round((kpi.currentValue / kpi.targetValue) * 100)
                    : 0;

                return (
                  <div key={kpi.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm">{kpi.name}</div>
                        <div className="text-xs text-gray-500">
                          {kpi.responsibleUnit}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        {kpi.currentValue} / {kpi.targetValue} {kpi.unit} (
                        {percentage}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage >= 80
                            ? 'bg-green-500'
                            : percentage >= 60
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {filteredKPIs.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-6">
                  No KPI data found for the selected year.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
