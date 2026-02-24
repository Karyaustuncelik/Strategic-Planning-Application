import { useState } from 'react';
import { ActionPlan, UserRole } from '../types';
import { mockGoals, mockKPIs, mockActionPlans } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Download, TrendingUp, TrendingDown, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatAcademicYearRange } from '../utils/academicPeriod';

interface AnalyticsViewProps {
  userRole: UserRole;
  userUnit?: string;
  selectedAcademicYearRange: string;
  selectedAcademicYearStart: number;
  availableAcademicYears: string[];
}

export function AnalyticsView({
  userRole,
  userUnit,
  selectedAcademicYearRange,
  selectedAcademicYearStart,
  availableAcademicYears,
}: AnalyticsViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>(userUnit || 'all');

  const previousYearStart = selectedAcademicYearStart - 1;

  const getActionPlanYearStart = (action: ActionPlan) => {
    if (action.academicYearStart !== undefined) {
      return action.academicYearStart;
    }
    const goal = mockGoals.find((g) => g.id === action.goalId);
    return goal?.academicYearStart;
  };

  // Filter current period data
  const filteredGoals = mockGoals.filter(g => {
    if (selectedUnit !== 'all' && g.responsibleUnit !== selectedUnit) return false;
    if (g.academicYearStart !== selectedAcademicYearStart) return false;
    return true;
  });

  const filteredKPIs = mockKPIs.filter(k => {
    if (selectedUnit !== 'all' && k.responsibleUnit !== selectedUnit) return false;
    if (k.academicYearStart !== selectedAcademicYearStart) return false;
    return true;
  });

  const filteredActions = mockActionPlans.filter(a => {
    if (selectedUnit !== 'all' && a.responsibleUnit !== selectedUnit) return false;
    const yearStart = getActionPlanYearStart(a);
    if (!yearStart || yearStart !== selectedAcademicYearStart) return false;
    return true;
  });

  // Filter previous period data for comparison
  const previousGoals = mockGoals.filter(g => {
    if (selectedUnit !== 'all' && g.responsibleUnit !== selectedUnit) return false;
    if (g.academicYearStart !== previousYearStart) return false;
    return true;
  });

  const previousKPIs = mockKPIs.filter(k => {
    if (selectedUnit !== 'all' && k.responsibleUnit !== selectedUnit) return false;
    if (k.academicYearStart !== previousYearStart) return false;
    return true;
  });

  const previousActions = mockActionPlans.filter(a => {
    if (selectedUnit !== 'all' && a.responsibleUnit !== selectedUnit) return false;
    const yearStart = getActionPlanYearStart(a);
    if (!yearStart || yearStart !== previousYearStart) return false;
    return true;
  });

  // Data for charts
  const goalsByStatus = [
    { name: 'On Track', value: filteredGoals.filter(g => g.status === 'On Track').length, color: '#10b981' },
    { name: 'At Risk', value: filteredGoals.filter(g => g.status === 'At Risk').length, color: '#f59e0b' },
    { name: 'Delayed', value: filteredGoals.filter(g => g.status === 'Delayed').length, color: '#ef4444' },
    { name: 'Completed', value: filteredGoals.filter(g => g.status === 'Completed').length, color: '#3b82f6' },
  ];

  const goalsByPriority = [
    { name: 'Critical', value: filteredGoals.filter(g => g.priority === 'Critical').length, color: '#ef4444' },
    { name: 'High', value: filteredGoals.filter(g => g.priority === 'High').length, color: '#f59e0b' },
    { name: 'Medium', value: filteredGoals.filter(g => g.priority === 'Medium').length, color: '#3b82f6' },
    { name: 'Low', value: filteredGoals.filter(g => g.priority === 'Low').length, color: '#6b7280' },
  ];

  const goalsByLevel = [
    { name: 'Main Goal', value: filteredGoals.filter(g => g.level === 0).length, color: '#8b5cf6' },
    { name: 'Sub Goal', value: filteredGoals.filter(g => g.level === 1).length, color: '#3b82f6' },
    { name: 'Sub Item', value: filteredGoals.filter(g => g.level === 2).length, color: '#6b7280' },
  ];

  const units = Array.from(new Set(mockGoals.map(g => g.responsibleUnit)));
  
  const unitPerformance = units.map(unit => {
    // Current period data
    const unitGoals = filteredGoals.filter(g => g.responsibleUnit === unit);
    const unitKPIs = filteredKPIs.filter(k => k.responsibleUnit === unit);
    const unitActions = filteredActions.filter(a => a.responsibleUnit === unit);
    
    const avgGoalProgress = unitGoals.length > 0
      ? Math.round(unitGoals.reduce((sum, g) => sum + g.progress, 0) / unitGoals.length)
      : 0;
    
    const avgKPIProgress = unitKPIs.length > 0
      ? Math.round(unitKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / unitKPIs.length)
      : 0;
    
    const avgActionProgress = unitActions.length > 0
      ? Math.round(unitActions.reduce((sum, a) => sum + a.progress, 0) / unitActions.length)
      : 0;

    const overall = Math.round((avgGoalProgress + avgKPIProgress + avgActionProgress) / 3);

    // Previous period data for comparison
    const prevUnitGoals = previousGoals.filter(g => g.responsibleUnit === unit);
    const prevUnitKPIs = previousKPIs.filter(k => k.responsibleUnit === unit);
    const prevUnitActions = previousActions.filter(a => a.responsibleUnit === unit);
    
    const prevAvgGoalProgress = prevUnitGoals.length > 0
      ? Math.round(prevUnitGoals.reduce((sum, g) => sum + g.progress, 0) / prevUnitGoals.length)
      : 0;
    
    const prevAvgKPIProgress = prevUnitKPIs.length > 0
      ? Math.round(prevUnitKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / prevUnitKPIs.length)
      : 0;
    
    const prevAvgActionProgress = prevUnitActions.length > 0
      ? Math.round(prevUnitActions.reduce((sum, a) => sum + a.progress, 0) / prevUnitActions.length)
      : 0;

    const prevOverall = Math.round((prevAvgGoalProgress + prevAvgKPIProgress + prevAvgActionProgress) / 3);
    const performanceChange = overall - prevOverall;

    return {
      unit: unit.split(' ')[0], // Shorten name for chart
      fullUnit: unit,
      goals: unitGoals.length,
      kpis: unitKPIs.length,
      actions: unitActions.length,
      goalProgress: avgGoalProgress,
      kpiProgress: avgKPIProgress,
      actionProgress: avgActionProgress,
      overall,
      previousOverall: prevOverall,
      performanceChange,
      goalProgressChange: avgGoalProgress - prevAvgGoalProgress,
      kpiProgressChange: avgKPIProgress - prevAvgKPIProgress,
      actionProgressChange: avgActionProgress - prevAvgActionProgress,
    };
  });

  const kpiPerformance = filteredKPIs.map(kpi => ({
    name: kpi.name.length > 20 ? kpi.name.slice(0, 20) + '...' : kpi.name,
    fullName: kpi.name,
    progress: Math.round((kpi.currentValue / kpi.targetValue) * 100),
    target: 100
  }));

  const progressTrend = [
    { month: 'Jan', goals: 45, kpi: 42, actions: 40 },
    { month: 'Feb', goals: 52, kpi: 48, actions: 47 },
    { month: 'Mar', goals: 58, kpi: 55, actions: 53 },
    { month: 'Apr', goals: 63, kpi: 60, actions: 58 },
    { month: 'May', goals: 68, kpi: 65, actions: 64 },
    { month: 'Jun', goals: 71, kpi: 68, actions: 67 },
    { month: 'Jul', goals: 74, kpi: 71, actions: 70 },
    { month: 'Aug', goals: 77, kpi: 74, actions: 73 },
    { month: 'Sep', goals: 80, kpi: 77, actions: 76 },
    { month: 'Oct', goals: 82, kpi: 79, actions: 78 },
    { month: 'Nov', goals: 84, kpi: 81, actions: 80 },
    { month: 'Dec', goals: 85, kpi: 82, actions: 81 },
  ];

  const radarData = unitPerformance.slice(0, 5).map(up => ({
    unit: up.unit,
    Goals: up.goalProgress,
    KPI: up.kpiProgress,
    Actions: up.actionProgress
  }));

  const handleExport = () => {
    alert('Export report feature: An analytics report will be generated in PDF or Excel format.');
  };

  const avgGoalProgress = filteredGoals.length > 0
    ? Math.round(filteredGoals.reduce((sum, g) => sum + g.progress, 0) / filteredGoals.length)
    : 0;

  const avgKPIProgress = filteredKPIs.length > 0
    ? Math.round(filteredKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / filteredKPIs.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Analytics & Charts</h2>
          <p className="text-gray-600">Detailed performance analysis and visualization</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Filters */}
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
              {availableAcademicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {userRole !== 'Unit Manager' && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Units</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <span>Current Period: </span>
          <span className="font-medium">{formatAcademicYearRange(selectedAcademicYearStart)}</span>
          <span className="ml-4">Previous Period: </span>
          <span className="font-medium">{formatAcademicYearRange(previousYearStart)}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl">{avgGoalProgress}%</span>
          </div>
          <div className="text-sm opacity-90">Average Goal Progress</div>
          {previousGoals.length > 0 && (() => {
            const prevAvg = Math.round(previousGoals.reduce((sum, g) => sum + g.progress, 0) / previousGoals.length);
            const change = avgGoalProgress - prevAvg;
            return (
              <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                {change !== 0 && (change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                {change > 0 ? '+' : ''}{change}% vs previous
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
            const prevAvg = Math.round(previousKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / previousKPIs.length);
            const change = avgKPIProgress - prevAvg;
            return (
              <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                {change !== 0 && (change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                {change > 0 ? '+' : ''}{change}% vs previous
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
                {change !== 0 && (change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                {change > 0 ? '+' : ''}{change} vs previous
              </div>
            );
          })()}
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 opacity-80" />
            <span className="text-3xl">
              {filteredGoals.filter(g => g.status === 'At Risk' || g.status === 'Delayed').length}
            </span>
          </div>
          <div className="text-sm opacity-90">At Risk / Delayed</div>
          {previousGoals.length > 0 && (() => {
            const prevCount = previousGoals.filter(g => g.status === 'At Risk' || g.status === 'Delayed').length;
            const currentCount = filteredGoals.filter(g => g.status === 'At Risk' || g.status === 'Delayed').length;
            const change = currentCount - prevCount;
            return (
              <div className="text-xs mt-1 opacity-75 flex items-center gap-1">
                {change !== 0 && (change < 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
                {change > 0 ? '+' : ''}{change} vs previous
              </div>
            );
          })()}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals by Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Goals Distribution by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={goalsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {goalsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Goals by Priority */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Goals Distribution by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={goalsByPriority}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {goalsByPriority.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Goals by Level */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Goals Distribution by Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalsByLevel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Unit Performance Comparison */}
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
              <Bar dataKey="overall" fill="#3b82f6" name={`${formatAcademicYearRange(selectedAcademicYearStart)}`} />
              <Bar dataKey="previousOverall" fill="#94a3b8" name={`${formatAcademicYearRange(previousYearStart)}`} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="mb-4">Monthly Progress Trend (2025)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="goals" stroke="#8b5cf6" strokeWidth={2} name="Goals" />
              <Line type="monotone" dataKey="kpi" stroke="#10b981" strokeWidth={2} name="KPIs" />
              <Line type="monotone" dataKey="actions" stroke="#3b82f6" strokeWidth={2} name="Action Plans" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* KPI Performance */}
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

        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="mb-4">Unit Performance Radar</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="unit" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Goals" dataKey="Goals" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Radar name="KPI" dataKey="KPI" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Radar name="Actions" dataKey="Actions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="mb-4">Detailed Unit Statistics</h3>
        <div className="mb-4 text-sm text-gray-600">
          Comparing {formatAcademicYearRange(selectedAcademicYearStart)} with {formatAcademicYearRange(previousYearStart)}
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
              {unitPerformance.map((unit, idx) => {
                const hasChange = unit.performanceChange !== 0;
                const isImprovement = unit.performanceChange > 0;
                const changePercent = unit.previousOverall > 0 
                  ? Math.round((unit.performanceChange / unit.previousOverall) * 100)
                  : unit.performanceChange;

                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{unit.fullUnit}</td>
                    <td className="text-center py-3 px-4">{unit.goals}</td>
                    <td className="text-center py-3 px-4">{unit.kpis}</td>
                    <td className="text-center py-3 px-4">{unit.actions}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <span>{unit.goalProgress}%</span>
                        {hasChange && (
                          <span className={`text-xs ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                            {unit.goalProgressChange > 0 ? '+' : ''}{unit.goalProgressChange}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <span>{unit.kpiProgress}%</span>
                        {hasChange && (
                          <span className={`text-xs ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                            {unit.kpiProgressChange > 0 ? '+' : ''}{unit.kpiProgressChange}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        unit.overall >= 80 ? 'bg-green-100 text-green-700' :
                        unit.overall >= 60 ? 'bg-blue-100 text-blue-700' :
                        unit.overall >= 40 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {unit.overall}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        unit.previousOverall >= 80 ? 'bg-green-50 text-green-600 border border-green-200' :
                        unit.previousOverall >= 60 ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        unit.previousOverall >= 40 ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                        'bg-red-50 text-red-600 border border-red-200'
                      }`}>
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
                          <span className={`text-sm font-medium ${
                            isImprovement ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isImprovement ? '+' : ''}{unit.performanceChange}%
                          </span>
                          {unit.previousOverall > 0 && (
                            <span className="text-xs text-gray-500">
                              ({changePercent > 0 ? '+' : ''}{changePercent}%)
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

