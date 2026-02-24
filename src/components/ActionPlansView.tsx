import { useState } from 'react';
import { UserRole, ActionPlan } from '../types';
import { mockActionPlans, mockGoals, mockKPIs } from '../data/mockData';
import { Plus, Edit2, CheckCircle, Clock, PlayCircle, XCircle } from 'lucide-react';
import { ActionPlanModal } from './ActionPlanModal';

interface ActionPlansViewProps {
  userRole: UserRole;
  userUnit?: string;
}

export function ActionPlansView({ userRole, userUnit }: ActionPlansViewProps) {
  const [actionPlans, setActionPlans] = useState(mockActionPlans);
  const [selectedAction, setSelectedAction] = useState<ActionPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');

  const canEdit = userRole === 'Strategy Office' || userRole === 'Unit Manager';

  const filteredActions = actionPlans.filter(action => {
    if (userUnit && action.responsibleUnit !== userUnit) return false;
    if (filterStatus !== 'all' && action.status !== filterStatus) return false;
    if (filterGoal !== 'all' && action.goalId !== filterGoal) return false;
    return true;
  });

  const handleAddAction = () => {
    setSelectedAction(null);
    setIsModalOpen(true);
  };

  const handleEditAction = (action: ActionPlan) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleSaveAction = (action: ActionPlan) => {
    if (selectedAction) {
      setActionPlans(actionPlans.map(a => a.id === action.id ? action : a));
    } else {
      setActionPlans([...actionPlans, action]);
    }
    setIsModalOpen(false);
  };

  const getGoalTitle = (goalId: string) => {
    return mockGoals.find(g => g.id === goalId)?.title || 'Unknown Goal';
  };

  const getKPIName = (kpiId?: string) => {
    if (!kpiId) return null;
    return mockKPIs.find(k => k.id === kpiId)?.name;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      case 'Not Started':
        return <Clock className="w-5 h-5 text-gray-600" />;
      case 'Blocked':
        return <XCircle className="w-5 h-5 text-red-600" />;
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
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
      case 'Blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'Completed') return false;
    return new Date(deadline) < new Date();
  };

  const availableGoals = userUnit 
    ? mockGoals.filter(g => g.responsibleUnit === userUnit)
    : mockGoals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Action Plans</h2>
          <p className="text-gray-600">
            {userUnit ? `${userUnit} Action Plans` : 'All Action Plans'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleAddAction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Action
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
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
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
      </div>

      {/* Action Plans List */}
      <div className="space-y-4">
        {filteredActions.map(action => {
          const overdue = isOverdue(action.deadline, action.status);
          const kpiName = getKPIName(action.kpiId);

          return (
            <div key={action.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(action.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3>{action.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                      {overdue && (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{action.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm">{action.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            action.status === 'Completed' ? 'bg-green-500' :
                            action.status === 'Blocked' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${action.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <div>{action.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Goal:</span>
                        <div>{getGoalTitle(action.goalId)}</div>
                      </div>
                      {kpiName && (
                        <div>
                          <span className="text-gray-500">KPI:</span>
                          <div>{kpiName}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Deadline:</span>
                        <div className={overdue ? 'text-red-600' : ''}>
                          {new Date(action.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <span className="text-gray-500">Responsible Unit:</span>
                        <div>{action.responsibleUnit}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Assigned To:</span>
                        <div>{action.assignedTo}</div>
                      </div>
                    </div>

                    {action.notes && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm text-gray-700">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1">{action.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                {canEdit && (userRole === 'Strategy Office' || action.responsibleUnit === userUnit) && (
                  <button
                    onClick={() => handleEditAction(action)}
                    className="ml-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                Last updated by {action.updatedBy} on {new Date(action.updatedAt).toLocaleString()}
              </div>
            </div>
          );
        })}

        {filteredActions.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">No action plans found matching the selected filters.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ActionPlanModal
          action={selectedAction}
          userRole={userRole}
          userUnit={userUnit}
          onSave={handleSaveAction}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
