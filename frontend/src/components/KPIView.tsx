import { useState } from 'react';
import { UserRole, KPI } from '../types';
import { mockKPIs, mockGoals } from '../data/mockData';
import { Plus, Edit2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIModal } from './KPIModal';

interface KPIViewProps {
  userRole: UserRole;
  userUnit?: string;
}

export function KPIView({ userRole, userUnit }: KPIViewProps) {
  const [kpis, setKpis] = useState(mockKPIs);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterGoal, setFilterGoal] = useState<string>('all');

  const canEdit = userRole === 'Strategy Office' || userRole === 'Unit Manager';

  const filteredKPIs = kpis.filter(kpi => {
    if (userUnit && kpi.responsibleUnit !== userUnit) return false;
    if (filterGoal !== 'all' && kpi.goalId !== filterGoal) return false;
    return true;
  });

  const handleAddKPI = () => {
    setSelectedKPI(null);
    setIsModalOpen(true);
  };

  const handleEditKPI = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setIsModalOpen(true);
  };

  const handleSaveKPI = (kpi: KPI) => {
    if (selectedKPI) {
      setKpis(kpis.map(k => k.id === kpi.id ? kpi : k));
    } else {
      setKpis([...kpis, kpi]);
    }
    setIsModalOpen(false);
  };

  const getGoalTitle = (goalId: string) => {
    return mockGoals.find(g => g.id === goalId)?.title || 'Unknown Goal';
  };

  const getPerformance = (kpi: KPI) => {
    const percentage = (kpi.currentValue / kpi.targetValue) * 100;
    if (percentage >= 80) return { status: 'good', icon: TrendingUp, color: 'text-green-600' };
    if (percentage >= 60) return { status: 'warning', icon: Minus, color: 'text-orange-600' };
    return { status: 'poor', icon: TrendingDown, color: 'text-red-600' };
  };

  const availableGoals = userUnit 
    ? mockGoals.filter(g => g.responsibleUnit === userUnit)
    : mockGoals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Key Performance Indicators</h2>
          <p className="text-gray-600">
            {userUnit ? `${userUnit} KPIs` : 'All KPIs'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleAddKPI}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New KPI
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-sm text-gray-700 mb-2">
            Filter by Goal
          </label>
          <select
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Goals</option>
            {availableGoals.map(goal => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredKPIs.map(kpi => {
          const performance = getPerformance(kpi);
          const percentage = Math.round((kpi.currentValue / kpi.targetValue) * 100);
          const Icon = performance.icon;

          return (
            <div key={kpi.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-1 ${performance.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1">{kpi.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{kpi.description}</p>
                    <div className="text-sm text-gray-500">
                      Goal: {getGoalTitle(kpi.goalId)}
                    </div>
                  </div>
                </div>
                {canEdit && (userRole === 'Strategy Office' || kpi.responsibleUnit === userUnit) && (
                  <button
                    onClick={() => handleEditKPI(kpi)}
                    className="ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm">
                    {kpi.currentValue} / {kpi.targetValue} {kpi.unit} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>ID: {kpi.id}</span>
                  <span>Year: {kpi.year}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Unit: {kpi.responsibleUnit}</span>
                  <span>Deadline: {new Date(kpi.deadline).toLocaleDateString()}</span>
                </div>
                <div className="text-gray-500 text-xs pt-2">
                  Last updated by {kpi.updatedBy} on {new Date(kpi.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredKPIs.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No KPIs found matching the selected filters.</p>
        </div>
      )}

      {isModalOpen && (
        <KPIModal
          kpi={selectedKPI}
          userRole={userRole}
          userUnit={userUnit}
          onSave={handleSaveKPI}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
