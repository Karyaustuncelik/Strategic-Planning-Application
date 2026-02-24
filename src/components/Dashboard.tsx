import { ActionPlan, UserRole } from '../types';
import { mockGoals, mockKPIs, mockActionPlans } from '../data/mockData';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Clock, ListTodo } from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  userUnit?: string;
  selectedAcademicYearStart: number;
}

export function Dashboard({ userRole, userUnit, selectedAcademicYearStart }: DashboardProps) {
  const getActionPlanYearStart = (action: ActionPlan) =>
    action.academicYearStart ??
    mockGoals.find((g) => g.id === action.goalId)?.academicYearStart;

  const filteredGoals = mockGoals.filter((g) => {
    if (g.academicYearStart !== selectedAcademicYearStart) return false;
    if (userUnit && g.responsibleUnit !== userUnit) return false;
    return true;
  });

  const filteredKPIs = mockKPIs.filter((k) => {
    if (k.academicYearStart !== selectedAcademicYearStart) return false;
    if (userUnit && k.responsibleUnit !== userUnit) return false;
    return true;
  });

  const filteredActions = mockActionPlans.filter((a) => {
    const actionYearStart = getActionPlanYearStart(a);
    if (actionYearStart !== selectedAcademicYearStart) return false;
    if (userUnit && a.responsibleUnit !== userUnit) return false;
    return true;
  });

  const stats = {
    totalGoals: filteredGoals.length,
    mainGoals: filteredGoals.filter(g => g.level === 0).length,
    subGoals: filteredGoals.filter(g => g.level === 1).length,
    goalsOnTrack: filteredGoals.filter(g => g.status === 'On Track').length,
    goalsAtRisk: filteredGoals.filter(g => g.status === 'At Risk').length,
    goalsDelayed: filteredGoals.filter(g => g.status === 'Delayed').length,
    totalKPIs: filteredKPIs.length,
    kpisOnTarget: filteredKPIs.filter(k => (k.currentValue / k.targetValue) >= 0.8).length,
    totalActions: filteredActions.length,
    actionsCompleted: filteredActions.filter(a => a.status === 'Completed').length,
    actionsInProgress: filteredActions.filter(a => a.status === 'In Progress').length,
    actionsBlocked: filteredActions.filter(a => a.status === 'Blocked').length,
    avgProgress: Math.round(filteredGoals.reduce((sum, g) => sum + g.progress, 0) / filteredGoals.length) || 0,
  };

  const upcomingDeadlines = filteredActions
    .filter(a => a.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard Overview</h2>
        <p className="text-gray-600">
          {userUnit ? `${userUnit} Performance` : 'Organization-Wide Performance'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-gray-500">Goals</span>
          </div>
          <div className="text-3xl mb-2">{stats.totalGoals}</div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600">{stats.goalsOnTrack} on track</span>
            {stats.goalsAtRisk > 0 && (
              <span className="text-orange-600">{stats.goalsAtRisk} at risk</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-gray-500">KPIs</span>
          </div>
          <div className="text-3xl mb-2">{stats.totalKPIs}</div>
          <div className="text-sm text-gray-600">
            {stats.kpisOnTarget} on target ({Math.round((stats.kpisOnTarget / stats.totalKPIs) * 100)}%)
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <ListTodo className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-gray-500">Action Plans</span>
          </div>
          <div className="text-3xl mb-2">{stats.totalActions}</div>
          <div className="text-sm text-gray-600">
            {stats.actionsCompleted} completed, {stats.actionsInProgress} in progress
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-gray-500">Alerts</span>
          </div>
          <div className="text-3xl mb-2">
            {stats.goalsAtRisk + stats.goalsDelayed + stats.actionsBlocked}
          </div>
          <div className="text-sm text-gray-600">
            Items requiring attention
          </div>
        </div>
      </div>

      {/* Hierarchy Stats */}
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Goals by Status</h3>
          <div className="space-y-3">
            {filteredGoals.slice(0, 5).map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm mb-1">{goal.title}</div>
                  <div className="text-xs text-gray-500">{goal.responsibleUnit}</div>
                </div>
                <div className="ml-4">
                  {goal.status === 'On Track' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <CheckCircle className="w-3 h-3" />
                      On Track
                    </span>
                  )}
                  {goal.status === 'At Risk' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      At Risk
                    </span>
                  )}
                  {goal.status === 'Delayed' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      <Clock className="w-3 h-3" />
                      Delayed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {upcomingDeadlines.map(action => {
              const daysUntil = Math.ceil((new Date(action.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm mb-1">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.responsibleUnit}</div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className={`text-sm ${daysUntil < 7 ? 'text-red-600' : 'text-gray-700'}`}>
                      {new Date(action.deadline).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {daysUntil > 0 ? `${daysUntil} days` : 'Overdue'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="mb-4">KPI Performance Overview</h3>
        <div className="space-y-4">
          {filteredKPIs.slice(0, 6).map(kpi => {
            const percentage = Math.round((kpi.currentValue / kpi.targetValue) * 100);
            return (
              <div key={kpi.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm">{kpi.name}</div>
                    <div className="text-xs text-gray-500">{kpi.responsibleUnit}</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {kpi.currentValue} / {kpi.targetValue} {kpi.unit} ({percentage}%)
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
