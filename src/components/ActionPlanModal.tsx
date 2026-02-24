import { useState, useEffect } from 'react';
import { ActionPlan, UserRole, ActionStatus } from '../types';
import { mockGoals, mockKPIs } from '../data/mockData';
import { X } from 'lucide-react';

interface ActionPlanModalProps {
  action: ActionPlan | null;
  userRole: UserRole;
  userUnit?: string;
  onSave: (action: ActionPlan) => void;
  onClose: () => void;
}

export function ActionPlanModal({ action, userRole, userUnit, onSave, onClose }: ActionPlanModalProps) {
  const [formData, setFormData] = useState<Partial<ActionPlan>>({
    title: '',
    description: '',
    goalId: '',
    kpiId: '',
    responsibleUnit: userUnit || 'Research Department',
    assignedTo: '',
    deadline: '2025-12-31',
    status: 'Not Started',
    progress: 0,
    notes: '',
  });

  useEffect(() => {
    if (action) {
      setFormData(action);
    }
  }, [action]);

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

  const availableKPIs = formData.goalId
    ? mockKPIs.filter(k => k.goalId === formData.goalId)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const updatedAction: ActionPlan = {
      id: action?.id || `AP${String(Date.now()).slice(-3)}`,
      goalId: formData.goalId!,
      kpiId: formData.kpiId || undefined,
      title: formData.title!,
      description: formData.description!,
      responsibleUnit: formData.responsibleUnit!,
      assignedTo: formData.assignedTo!,
      deadline: formData.deadline!,
      status: formData.status as ActionStatus,
      progress: formData.progress!,
      notes: formData.notes!,
      createdAt: action?.createdAt || now,
      updatedAt: now,
      updatedBy: userRole === 'Strategy Office' ? 'Strategy Office Admin' : `${formData.responsibleUnit} Manager`
    };
    onSave(updatedAction);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2>{action ? 'Edit Action Plan' : 'Add New Action Plan'}</h2>
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
              onChange={(e) => setFormData({ ...formData, goalId: e.target.value, kpiId: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a goal</option>
              {availableGoals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </div>

          {formData.goalId && availableKPIs.length > 0 && (
            <div>
              <label className="block text-gray-700 mb-2">
                Linked KPI (Optional)
              </label>
              <select
                value={formData.kpiId}
                onChange={(e) => setFormData({ ...formData, kpiId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No specific KPI</option>
                {availableKPIs.map(kpi => (
                  <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">
              Action Plan Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-gray-700 mb-2">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ActionStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Add notes about progress, challenges, or next steps..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              {action ? 'Update Action Plan' : 'Create Action Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
