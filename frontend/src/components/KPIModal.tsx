import { useState, useEffect } from 'react';
import { KPI, UserRole, GoalStatus } from '../types';
import { mockGoals } from '../data/mockData';
import { X } from 'lucide-react';

interface KPIModalProps {
  kpi: KPI | null;
  userRole: UserRole;
  userUnit?: string;
  onSave: (kpi: KPI) => void;
  onClose: () => void;
}

export function KPIModal({ kpi, userRole, userUnit, onSave, onClose }: KPIModalProps) {
  const [formData, setFormData] = useState<Partial<KPI>>({
    name: '',
    description: '',
    targetValue: 0,
    currentValue: 0,
    unit: '',
    year: 2025,
    responsibleUnit: userUnit || 'Research Department',
    deadline: '2025-12-31',
    status: 'On Track',
    goalId: '',
  });

  useEffect(() => {
    if (kpi) {
      setFormData(kpi);
    }
  }, [kpi]);

  const units = [
    'Research Department',
    'Academic Affairs',
    'IT Department',
    'External Relations',
    'Facilities Management',
    'Finance Department',
    'Human Resources'
  ];

  const availableGoals = userUnit 
    ? mockGoals.filter(g => g.responsibleUnit === userUnit)
    : mockGoals;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const updatedKPI: KPI = {
      id: kpi?.id || `KPI${String(Date.now()).slice(-3)}`,
      goalId: formData.goalId!,
      name: formData.name!,
      description: formData.description!,
      targetValue: formData.targetValue!,
      currentValue: formData.currentValue!,
      unit: formData.unit!,
      year: formData.year!,
      responsibleUnit: formData.responsibleUnit!,
      deadline: formData.deadline!,
      status: formData.status as GoalStatus,
      updatedAt: now,
      updatedBy: userRole === 'Strategy Office' ? 'Strategy Office Admin' : `${formData.responsibleUnit} Manager`
    };
    onSave(updatedKPI);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2>{kpi ? 'Edit KPI' : 'Add New KPI'}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">
              Linked Goal
            </label>
            <select
              value={formData.goalId}
              onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a goal</option>
              {availableGoals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              KPI Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Target Value
              </label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Current Value
              </label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., %, count"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Responsible Unit
              </label>
              <select
                value={formData.responsibleUnit}
                onChange={(e) => setFormData({ ...formData, responsibleUnit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={userRole === 'Unit Manager'}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {kpi ? 'Update KPI' : 'Create KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
