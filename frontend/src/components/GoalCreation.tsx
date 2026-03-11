import { useState } from 'react';
import { Goal, UserRole, GoalStatus, Priority, Milestone, MilestoneStatus, LinkedEntityType } from '../types';
import { mockGoals } from '../data/mockData';
import { Save, X, Plus, AlertCircle, Flag, Trash2, History, Copy, Eye } from 'lucide-react';
import { formatAcademicYearRange, parseAcademicYearRange, getCurrentAcademicYearStart, getAcademicYearDateRange, formatDateString } from '../utils/academicPeriod';

interface GoalCreationProps {
  userRole: UserRole;
  userUnit?: string;
  onComplete: () => void;
  availableAcademicYears: string[];
  selectedAcademicYearRange: string;
  isReadOnly: boolean;
}

export function GoalCreation({
  userRole,
  userUnit,
  onComplete,
  availableAcademicYears,
  selectedAcademicYearRange,
  isReadOnly,
}: GoalCreationProps) {
  const academicYears = availableAcademicYears;
  const selectedYearStart = parseAcademicYearRange(selectedAcademicYearRange);
  const currentYearStart = getCurrentAcademicYearStart();
  const yearDates = getAcademicYearDateRange(selectedYearStart);

  const [formData, setFormData] = useState<Partial<Goal>>({
    title: '',
    description: '',
    academicYearStart: selectedYearStart,
    status: 'On Track',
    priority: 'Medium',
    responsibleUnit: userUnit || 'Research Department',
    parentId: undefined,
    level: 0,
    startDate: formatDateString(yearDates.startDate),
    endDate: formatDateString(yearDates.endDate),
    progress: 0,
    assignedTo: [],
  });

  // Previous period goals viewer
  const [showPreviousGoals, setShowPreviousGoals] = useState(false);
  const previousYearRange = formatAcademicYearRange(selectedYearStart - 1);
  const fallbackYearRange = academicYears[0] || selectedAcademicYearRange;
  const [selectedPreviousPeriod, setSelectedPreviousPeriod] = useState<{ yearRange: string }>({
    yearRange: academicYears.includes(previousYearRange) ? previousYearRange : fallbackYearRange
  });

  const [assignedPerson, setAssignedPerson] = useState('');

  // Milestones state
  const [milestones, setMilestones] = useState<Array<{
    title: string;
    description: string;
    owner: string;
    dueDate: string;
    definitionOfDone: string;
  }>>([]);

  const units = [
    'Research Department',
    'Academic Affairs',
    'IT Department',
    'External Relations',
    'Facilities Management',
    'Finance Department',
    'Human Resources',
  ];

  // Filter goals based on user unit for parent selection
  const availableParentGoals = mockGoals.filter((g) => {
    if (g.level >= 2) return false;
    if (g.academicYearStart !== selectedYearStart) return false;
    if (userUnit && g.responsibleUnit !== userUnit) return false;
    return true;
  });

  if (isReadOnly) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2>Create New Goal</h2>
                <p className="text-gray-600">
                  Editing is disabled for {selectedAcademicYearRange}.
                </p>
              </div>
              <button
                onClick={onComplete}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Switch to the current academic year to add or update tasks.
            </p>
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Goals
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const newGoal: Goal = {
      id: `G${String(Date.now()).slice(-6)}`,
      title: formData.title!,
      description: formData.description!,
      academicYearStart: formData.academicYearStart!,
      status: formData.status as GoalStatus,
      priority: formData.priority as Priority,
      responsibleUnit: formData.responsibleUnit!,
      parentId: formData.parentId,
      level: formData.parentId
        ? (mockGoals.find((g) => g.id === formData.parentId)?.level || 0) + 1
        : 0,
      startDate: formData.startDate!,
      endDate: formData.endDate!,
      progress: formData.progress!,
      assignedTo: formData.assignedTo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy:
        userRole === 'Strategy Office'
          ? 'Strategy Office Admin'
          : `${formData.responsibleUnit} Manager`,
    };

    // Create milestones if any were added
    const createdMilestones: Milestone[] = milestones
      .filter(m => m.title.trim() !== '') // Only create milestones with titles
      .map((milestone, index) => {
        const milestoneId = `M${String(Date.now()).slice(-6)}-${index}`;
        const now = new Date().toISOString();
        return {
          id: milestoneId,
          linkedType: (newGoal.level === 0 ? 'Goal' : 'SubGoal') as LinkedEntityType,
          linkedId: newGoal.id,
          title: milestone.title,
          description: milestone.description,
          owner: milestone.owner || (formData.assignedTo && formData.assignedTo[0] ? formData.assignedTo[0] : ''),
          dueDate: milestone.dueDate,
          status: 'Not Started' as MilestoneStatus,
          definitionOfDone: milestone.definitionOfDone,
          progress: 0,
          createdAt: now,
          updatedAt: now,
          updatedBy: newGoal.updatedBy,
          progressUpdates: [],
          evidenceLinks: [],
        };
      });

    console.log('New goal created:', newGoal);
    if (createdMilestones.length > 0) {
      console.log('Milestones created:', createdMilestones);
    }
    alert(`Goal successfully created!${createdMilestones.length > 0 ? ` ${createdMilestones.length} milestone(s) added.` : ''}`);
    onComplete();
  };

  const handleAddAssignee = () => {
    const person = assignedPerson.trim();
    if (!person) return;

    if (!formData.assignedTo?.includes(person)) {
      setFormData({
        ...formData,
        assignedTo: [...(formData.assignedTo || []), person],
      });
    }
    setAssignedPerson('');
  };

  const handleRemoveAssignee = (person: string) => {
    setFormData({
      ...formData,
      assignedTo: formData.assignedTo?.filter((p) => p !== person),
    });
    // Remove milestones assigned to this person
    setMilestones(milestones.filter(m => m.owner !== person));
  };

  const handleAddMilestone = () => {
    const defaultOwner = formData.assignedTo && formData.assignedTo.length > 0 
      ? formData.assignedTo[0] 
      : '';
    
    setMilestones([
      ...milestones,
      {
        title: '',
        description: '',
        owner: defaultOwner,
        dueDate: formData.endDate || '',
        definitionOfDone: '',
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleUpdateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  // Get previous period goals
  const getPreviousPeriodGoals = () => {
    const yearStart = parseAcademicYearRange(selectedPreviousPeriod.yearRange);
    return mockGoals.filter(goal => 
      goal.academicYearStart === yearStart && 
      (!userUnit || goal.responsibleUnit === userUnit)
    );
  };

  const previousGoals = getPreviousPeriodGoals();

  // Copy goal from previous period
  const handleCopyPreviousGoal = (goal: Goal) => {
    const copyYearStart = formData.academicYearStart || currentYearStart;
    const yearDates = getAcademicYearDateRange(copyYearStart);

    setFormData({
      ...formData,
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      responsibleUnit: goal.responsibleUnit,
      status: 'On Track', // Reset status
      progress: 0, // Reset progress
      startDate: formatDateString(yearDates.startDate),
      endDate: formatDateString(yearDates.endDate),
      assignedTo: goal.assignedTo ? [...goal.assignedTo] : [],
    });

    // Update milestones if goal had any
    const goalMilestones = milestones.filter(m => m.title.trim() !== '');
    if (goalMilestones.length === 0) {
      // Could load milestones from previous goal if needed
    }

    setShowPreviousGoals(false);
    alert(`Goal "${goal.title}" copied from ${formatAcademicYearRange(goal.academicYearStart)}. Please review and adjust dates.`);
  };

  // Handle academic period change
  const handleAcademicPeriodChange = (yearRange: string) => {
    const yearStart = parseAcademicYearRange(yearRange);
    const yearDates = getAcademicYearDateRange(yearStart);
    setFormData({
      ...formData,
      academicYearStart: yearStart,
      startDate: formatDateString(yearDates.startDate),
      endDate: formatDateString(yearDates.endDate),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2>Create New Goal</h2>
              <p className="text-gray-600">Define strategic goals and sub-goals</p>
            </div>
            <button
              onClick={onComplete}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Previous Period Goals Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-blue-900">View & Copy Previous Period Goals</h4>
                  <p className="text-sm text-blue-700">View goals from previous academic periods and copy them to the new period</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviousGoals(!showPreviousGoals)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                {showPreviousGoals ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreviousGoals ? 'Hide' : 'View Previous Goals'}
              </button>
            </div>

            {showPreviousGoals && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Previous Academic Year Range</label>
                    <select
                      value={selectedPreviousPeriod.yearRange}
                      onChange={(e) => setSelectedPreviousPeriod({ ...selectedPreviousPeriod, yearRange: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {previousGoals.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">
                      No goals found for {formatAcademicYearRange(parseAcademicYearRange(selectedPreviousPeriod.yearRange))}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Goals from {formatAcademicYearRange(parseAcademicYearRange(selectedPreviousPeriod.yearRange))} ({previousGoals.length})
                    </h5>
                    <div className="space-y-2">
                      {previousGoals.filter(g => g.level === 0).map((goal) => (
                        <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{goal.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{goal.responsibleUnit} • {goal.status} • {goal.progress}%</div>
                            {goal.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{goal.description}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyPreviousGoal(goal)}
                            className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-blue-600">Basic Information</h3>

            <div>
              <label className="block text-gray-700 mb-2">
                Goal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title ?? ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="e.g., Improve Research Quality"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Detailed description of the goal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Parent Goal (Optional)</label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, parentId: e.target.value || undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Main Goal (No parent)</option>
                  {availableParentGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.level === 0 ? '📌 ' : '  ↳ '}
                      {goal.title}
                    </option>
                  ))}
                </select>

                {formData.parentId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Level:{' '}
                    {mockGoals.find((g) => g.id === formData.parentId)?.level === 0
                      ? 'Sub Goal'
                      : 'Sub Item'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Responsible Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.responsibleUnit ?? ''}
                  onChange={(e) => setFormData({ ...formData, responsibleUnit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={userRole === 'Unit Manager'}
                  required
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-blue-600">Timeline</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Academic Year Range <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAcademicYearRange}
                  onChange={(e) => {
                    handleAcademicPeriodChange(e.target.value);
                  }}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  required
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate ?? ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate ?? ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-blue-600">Status and Priority</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status ?? 'On Track'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority ?? 'Medium'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Progress: {formData.progress ?? 0}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress ?? 0}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Assigned People */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-blue-600">Assigned People</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={assignedPerson}
                onChange={(e) => setAssignedPerson(e.target.value)}
                placeholder="Enter person name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAssignee();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddAssignee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {formData.assignedTo && formData.assignedTo.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.assignedTo.map((person, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                  >
                    {person}
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(person)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Milestones Section */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-600">Milestones (Optional)</h3>
                <p className="text-sm text-gray-600">Add milestones to track progress for this goal</p>
              </div>
              <button
                type="button"
                onClick={handleAddMilestone}
                disabled={!formData.assignedTo || formData.assignedTo.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title={!formData.assignedTo || formData.assignedTo.length === 0 ? 'Please add assigned people first' : ''}
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </div>

            {milestones.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <Flag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  No milestones added yet. Click "Add Milestone" to create milestones for this goal.
                </p>
              </div>
            )}

            {milestones.map((milestone, index) => (
              <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-purple-600" />
                    <h4 className="text-purple-900">Milestone {index + 1}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(index)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Remove milestone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">
                      Milestone Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => handleUpdateMilestone(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      placeholder="e.g., Complete Phase 1 Review"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Description</label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleUpdateMilestone(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      placeholder="Describe what this milestone represents..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm">
                        Owner <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={milestone.owner}
                        onChange={(e) => handleUpdateMilestone(index, 'owner', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        required
                        disabled={!formData.assignedTo || formData.assignedTo.length === 0}
                      >
                        {formData.assignedTo && formData.assignedTo.length > 0 ? (
                          formData.assignedTo.map((person) => (
                            <option key={person} value={person}>
                              {person}
                            </option>
                          ))
                        ) : (
                          <option value="">No assignees available</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 text-sm">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => handleUpdateMilestone(index, 'dueDate', e.target.value)}
                        min={formData.startDate}
                        max={formData.endDate}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">
                      Definition of Done <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={milestone.definitionOfDone}
                      onChange={(e) => handleUpdateMilestone(index, 'definitionOfDone', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      placeholder="Define the criteria for this milestone to be considered complete..."
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="mb-2">Goal Hierarchy:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span>Main Goal (Level 0):</span> Strategic goals without parent goal
                  </li>
                  <li>
                    <span>Sub Goal (Level 1):</span> Sub-goals linked to main goals
                  </li>
                  <li>
                    <span>Sub Item (Level 2):</span> Detailed items linked to sub-goals
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onComplete}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}










