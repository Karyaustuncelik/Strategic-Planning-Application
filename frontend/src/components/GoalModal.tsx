import { useState, useEffect } from 'react';
import { Goal, UserRole, GoalStatus, Priority } from '../types';
import { formatAcademicYearRange } from '../utils/academicPeriod';
import { X } from 'lucide-react';

interface GoalModalProps {
  goal: Goal | null;
  userRole: UserRole;
  userUnit?: string;
  onSave: (goal: Goal) => void;
  onClose: () => void;
}

export function GoalModal({ goal, userRole, userUnit, onSave, onClose }: GoalModalProps) {
  const academicYearStarts = [2023, 2024, 2025, 2026, 2027];
  const formatAcademicYearLabel = (yearStart: number) =>
    `${formatAcademicYearRange(yearStart)} Academic Year`;

  const [formData, setFormData] = useState<Partial<Goal>>({
    title: '',
    description: '',
    academicYearStart: 2025,
    status: 'On Track',
    // Goal type requires priority; give a safe default for “create” mode
    priority: 'Medium',
    responsibleUnit: userUnit || 'Research Department',
  });

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    }
  }, [goal]);

  const units = [
    'Research Department',
    'Academic Affairs',
    'IT Department',
    'External Relations',
    'Facilities Management',
    'Finance Department',
    'Human Resources',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    const updatedGoal: Goal = {
      id: goal?.id || `G${String(Date.now()).slice(-3)}`,
      title: formData.title!,
      description: formData.description!,
      academicYearStart: formData.academicYearStart!,
      status: formData.status as GoalStatus,
      priority: (formData.priority as Priority) || 'Medium',
      responsibleUnit: formData.responsibleUnit!,
      parentId: goal?.parentId, // preserve if you’re editing an existing goal
      level: goal?.level ?? 0,   // preserve if you’re editing an existing goal
      startDate: goal?.startDate || '2025-01-01',
      endDate: goal?.endDate || '2025-12-31',
      progress: goal?.progress ?? 0,
      assignedTo: goal?.assignedTo,
      createdAt: goal?.createdAt || now,
      updatedAt: now,
      updatedBy:
        userRole === 'Strategy Office'
          ? 'Strategy Office Admin'
          : `${formData.responsibleUnit} Manager`,
    };

    onSave(updatedGoal);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2>{goal ? 'Edit Goal' : 'Add New Goal'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Goal Title</label>
            <input
              type="text"
              value={formData.title ?? ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Academic Year</label>
              <select
                value={formData.academicYearStart ?? 2025}
                onChange={(e) => setFormData({ ...formData, academicYearStart: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {academicYearStarts.map((yearStart) => (
                  <option key={yearStart} value={yearStart}>
                    {formatAcademicYearLabel(yearStart)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Status</label>
              <select
                value={formData.status ?? 'On Track'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Responsible Unit</label>
            <select
              value={formData.responsibleUnit ?? (userUnit || 'Research Department')}
              onChange={(e) => setFormData({ ...formData, responsibleUnit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={userRole === 'Unit Manager'}
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
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
              {goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
