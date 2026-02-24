import { useState } from 'react';
import { UserRole, Goal } from '../types';
import { mockGoals } from '../data/mockData';
import { Plus, Edit2, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { GoalModal } from './GoalModal';

interface GoalsViewProps {
  userRole: UserRole;
  userUnit?: string;
}

export function GoalsView({ userRole, userUnit }: GoalsViewProps) {
  const [goals, setGoals] = useState(mockGoals);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number>(2025);

  const canEdit = userRole === 'Strategy Office' || userRole === 'Unit Manager';

  const filteredGoals = goals.filter(goal => {
    if (userUnit && goal.responsibleUnit !== userUnit) return false;
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    if (goal.year !== filterYear) return false;
    return true;
  });

  const handleAddGoal = () => {
    setSelectedGoal(null);
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleSaveGoal = (goal: Goal) => {
    if (selectedGoal) {
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
    } else {
      setGoals([...goals, goal]);
    }
    setIsModalOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Track':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'At Risk':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'Delayed':
        return <Clock className="w-5 h-5 text-red-600" />;
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Strategic Goals</h2>
          <p className="text-gray-600">
            {userUnit ? `${userUnit} Goals` : 'All Institutional Goals'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleAddGoal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Goal
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Year
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
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

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map(goal => (
          <div key={goal.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="mt-1">
                  {getStatusIcon(goal.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3>{goal.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{goal.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>ID: {goal.id}</span>
                    <span>Year: {goal.year}</span>
                    <span>Unit: {goal.responsibleUnit}</span>
                  </div>
                </div>
              </div>
              {canEdit && (userRole === 'Strategy Office' || goal.responsibleUnit === userUnit) && (
                <button
                  onClick={() => handleEditGoal(goal)}
                  className="ml-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              Last updated by {goal.updatedBy} on {new Date(goal.updatedAt).toLocaleString()}
            </div>
          </div>
        ))}

        {filteredGoals.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">No goals found matching the selected filters.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <GoalModal
          goal={selectedGoal}
          userRole={userRole}
          userUnit={userUnit}
          onSave={handleSaveGoal}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
