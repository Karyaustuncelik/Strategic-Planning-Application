import { useEffect, useMemo, useState } from 'react';
import { Milestone, UserRole } from '../types';
import {
  addMilestoneEvidence,
  addMilestoneProgressUpdate,
  fetchGoals,
  fetchMilestones,
} from '../lib/api';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Link as LinkIcon,
  Calendar,
  User,
  Target,
} from 'lucide-react';
import { isViewerRole } from '../lib/access';

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
  userRole,
  userUnit,
  selectedAcademicYearStart,
  isReadOnly,
  goalId,
}: MilestoneManagementProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goalMeta, setGoalMeta] = useState<
    Record<string, { title: string; unit: string }>
  >({});
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [newUpdate, setNewUpdate] = useState({ note: '', progressPercentage: 0 });
  const [newEvidence, setNewEvidence] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);
  const [isSavingEvidence, setIsSavingEvidence] = useState(false);
  const isViewer = userRole ? isViewerRole(userRole) : false;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [milestoneData, goalData] = await Promise.all([
          fetchMilestones({
            academicYearStart: selectedAcademicYearStart,
            linkedId: goalId,
          }),
          fetchGoals({ academicYearStart: selectedAcademicYearStart }),
        ]);

        if (!isMounted) return;

        const goalMap = Object.fromEntries(
          goalData.map((goal) => [
            goal.id,
            {
              title: goal.title,
              unit: goal.responsibleUnit,
            },
          ])
        );

        setMilestones(milestoneData);
        setGoalMeta(goalMap);
      } catch (loadError) {
        if (!isMounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load milestones'
        );
        setMilestones([]);
        setGoalMeta({});
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [goalId, selectedAcademicYearStart]);

  useEffect(() => {
    if (!selectedMilestone) return;

    const updatedMilestone = milestones.find(
      (milestone) => milestone.id === selectedMilestone.id
    );

    if (updatedMilestone) {
      setSelectedMilestone(updatedMilestone);
    }
  }, [milestones, selectedMilestone]);

  const filteredMilestones = useMemo(
    () =>
      milestones.filter((milestone) => {
        if (goalId && milestone.linkedId !== goalId) return false;
        if (isViewer && milestone.owner !== userName) {
          return false;
        }
        if (userUnit && !isViewer && goalMeta[milestone.linkedId]?.unit !== userUnit) {
          return false;
        }
        if (filterStatus !== 'all' && milestone.status !== filterStatus) return false;
        if (filterOwner !== 'all' && milestone.owner !== filterOwner) return false;

        if (filterDate !== 'all') {
          const today = new Date();
          const dueDate = new Date(milestone.dueDate);
          const daysUntilDue = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (filterDate === 'upcoming' && (daysUntilDue < 0 || daysUntilDue > 7)) {
            return false;
          }

          if (filterDate === 'overdue' && daysUntilDue >= 0) {
            return false;
          }
        }

        return true;
      }),
    [
      filterDate,
      filterOwner,
      filterStatus,
      goalId,
      goalMeta,
      isViewer,
      milestones,
      userName,
      userUnit,
    ]
  );

  const uniqueOwners = useMemo(
    () => Array.from(new Set(filteredMilestones.map((milestone) => milestone.owner))),
    [filteredMilestones]
  );

  const totalMilestones = filteredMilestones.length;
  const completedMilestones = filteredMilestones.filter(
    (milestone) => milestone.status === 'Completed'
  ).length;
  const overdueMilestones = filteredMilestones.filter((milestone) =>
    isOverdue(milestone.dueDate, milestone.status)
  ).length;

  function getStatusIcon(status: string) {
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
  }

  function getStatusColor(status: string) {
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
  }

  function isUpcoming(dueDate: string) {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }

  function isOverdue(dueDate: string, status: string) {
    if (status === 'Completed') return false;
    return new Date(dueDate).getTime() < Date.now();
  }

  const handleAddProgressUpdate = async () => {
    if (isReadOnly || !selectedMilestone || !newUpdate.note.trim()) return;

    setIsSavingUpdate(true);
    setError(null);

    try {
      const updatedMilestone = await addMilestoneProgressUpdate(
        selectedMilestone.id,
        {
          user: userName,
          note: newUpdate.note,
          progressPercentage: newUpdate.progressPercentage,
        }
      );

      setMilestones((prev) =>
        prev.map((milestone) =>
          milestone.id === updatedMilestone.id ? updatedMilestone : milestone
        )
      );
      setSelectedMilestone(updatedMilestone);
      setNewUpdate({ note: '', progressPercentage: 0 });
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to add progress update'
      );
    } finally {
      setIsSavingUpdate(false);
    }
  };

  const handleAddEvidenceLink = async () => {
    if (isReadOnly || !selectedMilestone || !newEvidence.trim()) return;

    setIsSavingEvidence(true);
    setError(null);

    try {
      const updatedMilestone = await addMilestoneEvidence(selectedMilestone.id, {
        link: newEvidence,
        user: userName,
      });

      setMilestones((prev) =>
        prev.map((milestone) =>
          milestone.id === updatedMilestone.id ? updatedMilestone : milestone
        )
      );
      setSelectedMilestone(updatedMilestone);
      setNewEvidence('');
    } catch (evidenceError) {
      setError(
        evidenceError instanceof Error
          ? evidenceError.message
          : 'Failed to add evidence link'
      );
    } finally {
      setIsSavingEvidence(false);
    }
  };

  const getGoalTitle = (linkedGoalId: string) =>
    goalMeta[linkedGoalId]?.title ?? 'Unknown Goal';

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Milestones are loading...</p>
        </div>
      ) : (
        <>
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

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
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
                <label className="block text-sm text-gray-700 mb-2">
                  Filter by Owner
                </label>
                <select
                  value={filterOwner}
                  onChange={(event) => setFilterOwner(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Owners</option>
                  {uniqueOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Filter by Date
                </label>
                <select
                  value={filterDate}
                  onChange={(event) => setFilterDate(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming (Next 7 Days)</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Milestone
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMilestones.map((milestone) => (
                    <tr
                      key={milestone.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm mb-1">{milestone.title}</div>
                          <div className="text-xs text-gray-500">
                            {milestone.description}
                          </div>
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getGoalTitle(milestone.linkedId)}
                      </td>
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
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                            milestone.status
                          )}`}
                        >
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
                                  milestone.status === 'Completed'
                                    ? 'bg-green-500'
                                    : milestone.status === 'In Progress'
                                      ? 'bg-blue-500'
                                      : 'bg-gray-400'
                                }`}
                                style={{ width: `${milestone.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {milestone.progress}%
                          </span>
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

            {filteredMilestones.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No milestones found matching the selected filters.
              </div>
            )}
          </div>
        </>
      )}

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
                      <div className="text-sm">
                        {new Date(selectedMilestone.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                          selectedMilestone.status
                        )}`}
                      >
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
                    <div className="text-xs text-gray-500 mb-1">
                      Definition of Done
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedMilestone.definitionOfDone}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Related Goal</div>
                    <div className="text-sm">
                      {getGoalTitle(selectedMilestone.linkedId)}
                    </div>
                  </div>
                </div>
              </div>

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
                        <span className="text-xs text-gray-500">
                          {new Date(update.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{update.note}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${update.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {update.progressPercentage}%
                        </span>
                      </div>
                    </div>
                  ))}

                  {selectedMilestone.progressUpdates.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No progress updates yet
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h5 className="text-sm">Add Progress Update</h5>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Update Note
                    </label>
                    <textarea
                      value={newUpdate.note}
                      onChange={(event) =>
                        setNewUpdate({
                          ...newUpdate,
                          note: event.target.value,
                        })
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      rows={3}
                      placeholder="Describe the progress made..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Progress Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newUpdate.progressPercentage}
                      onChange={(event) =>
                        setNewUpdate({
                          ...newUpdate,
                          progressPercentage: Number(event.target.value),
                        })
                      }
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <button
                    onClick={handleAddProgressUpdate}
                    disabled={isReadOnly || !newUpdate.note.trim() || isSavingUpdate}
                    className="w-full px-4 py-2 rounded-lg transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSavingUpdate ? 'Saving...' : 'Add Update'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-600 mb-3">
                  Evidence & Documentation
                </h4>
                <div className="space-y-2 mb-4">
                  {selectedMilestone.evidenceLinks.map((link, index) => (
                    <div
                      key={`${link}-${index}`}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex-1 truncate"
                      >
                        {link}
                      </a>
                    </div>
                  ))}

                  {selectedMilestone.evidenceLinks.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No evidence links yet
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h5 className="text-sm">Add Evidence Link</h5>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Link URL
                    </label>
                    <input
                      type="url"
                      value={newEvidence}
                      onChange={(event) => setNewEvidence(event.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="https://example.com/evidence"
                    />
                  </div>
                  <button
                    onClick={handleAddEvidenceLink}
                    disabled={isReadOnly || !newEvidence.trim() || isSavingEvidence}
                    className="w-full px-4 py-2 rounded-lg transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-600 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSavingEvidence ? 'Saving...' : 'Add Link'}
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
