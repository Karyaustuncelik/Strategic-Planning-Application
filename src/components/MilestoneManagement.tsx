import { useState } from 'react';
import { Milestone, ProgressUpdate, UserRole } from '../types';
import { mockMilestones, mockGoals, mockAssignments } from '../data/mockData';
import { CheckCircle, Clock, AlertCircle, ChevronDown, X, Plus, Link as LinkIcon, FileText, Calendar, User, Target } from 'lucide-react';

interface MilestoneManagementProps {
  userName: string;
  userRole?: UserRole;
  userUnit?: string;
  selectedAcademicYearStart: number;
  isReadOnly: boolean;
  goalId?: string;
  assignmentId?: string;
}

export function MilestoneManagement({
  userName,
  selectedAcademicYearStart,
  isReadOnly,
  goalId,
  assignmentId,
}: MilestoneManagementProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  // Form states
  const [newUpdate, setNewUpdate] = useState({ note: '', progressPercentage: 0 });
  const [newEvidence, setNewEvidence] = useState('');

  // Filter milestones
  const filteredMilestones = milestones.filter(milestone => {
    if (goalId && milestone.linkedId !== goalId) return false;
    const linkedGoal = mockGoals.find((g) => g.id === milestone.linkedId);
    if (!linkedGoal || linkedGoal.academicYearStart !== selectedAcademicYearStart) return false;
    if (filterStatus !== 'all' && milestone.status !== filterStatus) return false;
    if (filterOwner !== 'all' && milestone.owner !== filterOwner) return false;
    
    if (filterDate !== 'all') {
      const today = new Date();
      const dueDate = new Date(milestone.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filterDate === 'upcoming' && daysUntilDue < 0) return false;
      if (filterDate === 'overdue' && daysUntilDue >= 0) return false;
    }
    
    return true;
  });

  const fallbackGoal = mockGoals.find((g) => g.academicYearStart === selectedAcademicYearStart) ?? mockGoals[0];
  const now = new Date().toISOString();
  const demoMilestones: Milestone[] = [
    {
      id: `DEMO-MS-${selectedAcademicYearStart}-1`,
      linkedType: 'Goal',
      linkedId: fallbackGoal?.id ?? 'DEMO-GOAL-1',
      title: 'Launch mentoring program',
      description: 'Finalize mentor recruitment and onboarding.',
      owner: userName,
      dueDate: `${selectedAcademicYearStart + 1}-02-15`,
      status: 'In Progress',
      definitionOfDone: 'Mentors recruited, onboarded, and matched to students.',
      progress: 55,
      createdAt: now,
      updatedAt: now,
      updatedBy: userName,
      progressUpdates: [],
      evidenceLinks: []
    },
    {
      id: `DEMO-MS-${selectedAcademicYearStart}-2`,
      linkedType: 'Goal',
      linkedId: fallbackGoal?.id ?? 'DEMO-GOAL-2',
      title: 'Advising satisfaction survey',
      description: 'Collect and analyze end-of-period survey data.',
      owner: 'Alex Kim',
      dueDate: `${selectedAcademicYearStart + 1}-05-01`,
      status: 'Not Started',
      definitionOfDone: 'Survey sent, response rate above 60%, report delivered.',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'Alex Kim',
      progressUpdates: [],
      evidenceLinks: []
    }
  ];

  const displayMilestones = filteredMilestones.length > 0 ? filteredMilestones : demoMilestones;
  const isDemoMode = filteredMilestones.length === 0;

  // Get unique owners for filter
  const uniqueOwners = Array.from(new Set(displayMilestones.map(m => m.owner)));

  // Calculate summary statistics
  const totalMilestones = displayMilestones.length;
  const completedMilestones = displayMilestones.filter(m => m.status === 'Completed').length;
  const overdueMilestones = displayMilestones.filter(m => {
    const today = new Date();
    const dueDate = new Date(m.dueDate);
    return dueDate < today && m.status !== 'Completed';
  }).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Not Started':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isUpcoming = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'Completed') return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const handleAddProgressUpdate = () => {
    if (isReadOnly) return;
    if (!selectedMilestone || !newUpdate.note.trim()) return;

    const progressUpdate: ProgressUpdate = {
      id: `PU${Date.now()}`,
      milestoneId: selectedMilestone.id,
      timestamp: new Date().toISOString(),
      user: userName,
      note: newUpdate.note,
      progressPercentage: newUpdate.progressPercentage
    };

    const updatedMilestones = milestones.map(m => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          progressUpdates: [...m.progressUpdates, progressUpdate],
          progress: newUpdate.progressPercentage,
          updatedAt: new Date().toISOString(),
          updatedBy: userName
        };
      }
      return m;
    });

    setMilestones(updatedMilestones);
    setSelectedMilestone({
      ...selectedMilestone,
      progressUpdates: [...selectedMilestone.progressUpdates, progressUpdate],
      progress: newUpdate.progressPercentage
    });
    setNewUpdate({ note: '', progressPercentage: 0 });
  };

  const handleAddEvidenceLink = () => {
    if (isReadOnly) return;
    if (!selectedMilestone || !newEvidence.trim()) return;

    const updatedMilestones = milestones.map(m => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          evidenceLinks: [...m.evidenceLinks, newEvidence],
          updatedAt: new Date().toISOString(),
          updatedBy: userName
        };
      }
      return m;
    });

    setMilestones(updatedMilestones);
    setSelectedMilestone({
      ...selectedMilestone,
      evidenceLinks: [...selectedMilestone.evidenceLinks, newEvidence]
    });
    setNewEvidence('');
  };

  const getGoalTitle = (goalId: string) => {
    return mockGoals.find(g => g.id === goalId)?.title || 'Unknown Goal';
  };

  return (
    <div className="space-y-6">


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl mb-1">{totalMilestones}</div>
              <div className="text-sm text-gray-600">Total Milestones</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl mb-1">{completedMilestones}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl mb-1">{overdueMilestones}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Filter by Owner</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Owners</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Filter by Date</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming (Next 7 Days)</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
          Showing demo milestones because no items match the current filters.
        </div>
      )}

      {/* Milestones List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Milestone</th>
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Goal</th>
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayMilestones.map((milestone) => (
                <tr key={milestone.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm mb-1">{milestone.title}</div>
                      <div className="text-xs text-gray-500">{milestone.description}</div>
                      {isUpcoming(milestone.dueDate) && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                          <Clock className="w-3 h-3" />
                          Due Soon
                        </div>
                      )}
                      {isOverdue(milestone.dueDate, milestone.status) && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getGoalTitle(milestone.linkedId)}</td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-sm">
                      <User className="w-3 h-3" />
                      {milestone.owner}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(milestone.status)}`}>
                      {getStatusIcon(milestone.status)}
                      {milestone.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              milestone.status === 'Completed' ? 'bg-green-500' :
                              milestone.status === 'In Progress' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{milestone.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowDetailDrawer(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayMilestones.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No milestones found matching the selected filters.
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {showDetailDrawer && selectedMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3>{selectedMilestone.title}</h3>
              <button
                onClick={() => {
                  setShowDetailDrawer(false);
                  setSelectedMilestone(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Milestone Overview */}
              <div>
                <h4 className="text-sm text-gray-600 mb-3">Milestone Overview</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Description</div>
                    <div className="text-sm">{selectedMilestone.description}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Owner</div>
                      <div className="text-sm">{selectedMilestone.owner}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Due Date</div>
                      <div className="text-sm">{new Date(selectedMilestone.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedMilestone.status)}`}>
                        {getStatusIcon(selectedMilestone.status)}
                        {selectedMilestone.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Progress</div>
                      <div className="text-sm">{selectedMilestone.progress}%</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Definition of Done</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">{selectedMilestone.definitionOfDone}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Related Goal</div>
                    <div className="text-sm">{getGoalTitle(selectedMilestone.linkedId)}</div>
                  </div>
                </div>
              </div>

              {/* Progress Updates */}
              <div>
                <h4 className="text-sm text-gray-600 mb-3">Progress Updates</h4>
                <div className="space-y-3 mb-4">
                  {selectedMilestone.progressUpdates.map((update) => (
                    <div key={update.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{update.user}</span>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{update.note}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${update.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{update.progressPercentage}%</span>
                      </div>
                    </div>
                  ))}

                  {selectedMilestone.progressUpdates.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">No progress updates yet</div>
                  )}
                </div>

                {/* Add Progress Update Form */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h5 className="text-sm">Add Progress Update</h5>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Update Note</label>
                    <textarea
                      value={newUpdate.note}
                      onChange={(e) => setNewUpdate({ ...newUpdate, note: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      rows={3}
                      placeholder="Describe the progress made..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Progress Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newUpdate.progressPercentage}
                      onChange={(e) => setNewUpdate({ ...newUpdate, progressPercentage: Number(e.target.value) })}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <button
                    onClick={handleAddProgressUpdate}
                    disabled={isReadOnly || !newUpdate.note.trim()}
                    className="w-full px-4 py-2 rounded-lg transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Update
                  </button>
                </div>
              </div>

              {/* Evidence Links */}
              <div>
                <h4 className="text-sm text-gray-600 mb-3">Evidence & Documentation</h4>
                <div className="space-y-2 mb-4">
                  {selectedMilestone.evidenceLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 truncate">
                        {link}
                      </a>
                    </div>
                  ))}

                  {selectedMilestone.evidenceLinks.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">No evidence links yet</div>
                  )}
                </div>

                {/* Add Evidence Link Form */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h5 className="text-sm">Add Evidence Link</h5>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Link URL</label>
                    <input
                      type="url"
                      value={newEvidence}
                      onChange={(e) => setNewEvidence(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="https://example.com/evidence"
                    />
                  </div>
                  <button
                    onClick={handleAddEvidenceLink}
                    disabled={isReadOnly || !newEvidence.trim()}
                    className="w-full px-4 py-2 rounded-lg transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
