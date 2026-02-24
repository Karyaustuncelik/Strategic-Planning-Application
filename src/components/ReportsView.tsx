import { useState } from 'react';
import { UserRole } from '../types';
import { mockGoals, mockKPIs, mockActionPlans } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText } from 'lucide-react';

interface ReportsViewProps {
  userRole: UserRole;
}

export function ReportsView({ userRole }: ReportsViewProps) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [reportType, setReportType] = useState<'overview' | 'goals' | 'kpis' | 'actions'>('overview');

  // Data for charts
  const goalsByStatus = [
    { name: 'On Track', value: mockGoals.filter(g => g.status === 'On Track').length, color: '#10b981' },
    { name: 'At Risk', value: mockGoals.filter(g => g.status === 'At Risk').length, color: '#f59e0b' },
    { name: 'Delayed', value: mockGoals.filter(g => g.status === 'Delayed').length, color: '#ef4444' },
    { name: 'Completed', value: mockGoals.filter(g => g.status === 'Completed').length, color: '#3b82f6' },
  ];

  const actionsByStatus = [
    { name: 'Not Started', value: mockActionPlans.filter(a => a.status === 'Not Started').length, color: '#6b7280' },
    { name: 'In Progress', value: mockActionPlans.filter(a => a.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Completed', value: mockActionPlans.filter(a => a.status === 'Completed').length, color: '#10b981' },
    { name: 'Blocked', value: mockActionPlans.filter(a => a.status === 'Blocked').length, color: '#ef4444' },
  ];

  const unitPerformance = Array.from(new Set(mockGoals.map(g => g.responsibleUnit))).map(unit => {
    const unitGoals = mockGoals.filter(g => g.responsibleUnit === unit);
    const unitKPIs = mockKPIs.filter(k => k.responsibleUnit === unit);
    const avgKPIProgress = unitKPIs.length > 0
      ? Math.round(unitKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / unitKPIs.length)
      : 0;

    return {
      unit,
      goals: unitGoals.length,
      kpis: unitKPIs.length,
      performance: avgKPIProgress
    };
  });

  const kpiTrends = mockKPIs.slice(0, 5).map(kpi => ({
    name: kpi.name,
    target: kpi.targetValue,
    current: kpi.currentValue,
    percentage: Math.round((kpi.currentValue / kpi.targetValue) * 100)
  }));

  const handleExport = () => {
    alert('Export functionality would generate a PDF or Excel report with all data visualizations and detailed metrics.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="text-gray-600">Multi-year strategic performance analysis</p>
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
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="goals">Goals Analysis</option>
              <option value="kpis">KPI Performance</option>
              <option value="actions">Action Plans Status</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-gray-600">Total Goals</span>
          </div>
          <div className="text-3xl">{mockGoals.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            {mockGoals.filter(g => g.status === 'On Track').length} on track
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="text-gray-600">Total KPIs</span>
          </div>
          <div className="text-3xl">{mockKPIs.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            Avg. {Math.round(mockKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / mockKPIs.length)}% achieved
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-gray-600">Action Plans</span>
          </div>
          <div className="text-3xl">{mockActionPlans.length}</div>
          <div className="text-sm text-gray-500 mt-1">
            {mockActionPlans.filter(a => a.status === 'Completed').length} completed
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="text-gray-600">Active Units</span>
          </div>
          <div className="text-3xl">
            {new Set(mockGoals.map(g => g.responsibleUnit)).size}
          </div>
          <div className="text-sm text-gray-500 mt-1">Departments involved</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals by Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Goals by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={goalsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
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

        {/* Actions by Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="mb-4">Action Plans by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={actionsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {actionsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Unit Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="mb-4">Performance by Unit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={unitPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="unit" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="goals" fill="#3b82f6" name="Goals" />
              <Bar dataKey="kpis" fill="#10b981" name="KPIs" />
              <Bar dataKey="performance" fill="#f59e0b" name="Avg Performance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* KPI Progress */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="mb-4">Top KPI Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpiTrends} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="percentage" fill="#3b82f6" name="Achievement %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="mb-4">Detailed Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Unit</th>
                <th className="text-center py-3 px-4">Goals</th>
                <th className="text-center py-3 px-4">KPIs</th>
                <th className="text-center py-3 px-4">Actions</th>
                <th className="text-center py-3 px-4">Avg. KPI Progress</th>
                <th className="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {unitPerformance.map((unit, idx) => {
                const unitActions = mockActionPlans.filter(a => a.responsibleUnit === unit.unit);
                return (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{unit.unit}</td>
                    <td className="text-center py-3 px-4">{unit.goals}</td>
                    <td className="text-center py-3 px-4">{unit.kpis}</td>
                    <td className="text-center py-3 px-4">{unitActions.length}</td>
                    <td className="text-center py-3 px-4">{unit.performance}%</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        unit.performance >= 80 ? 'bg-green-100 text-green-700' :
                        unit.performance >= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {unit.performance >= 80 ? 'Excellent' : unit.performance >= 60 ? 'Good' : 'Needs Attention'}
                      </span>
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
