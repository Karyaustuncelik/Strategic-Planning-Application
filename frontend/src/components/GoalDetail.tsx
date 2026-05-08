import { useEffect, useMemo, useState } from 'react';
import { ActionPlan, Goal, KPI, KpiResultType, SubmissionLog, UserRole } from '../types';
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Target,
  TrendingUp,
  ListTodo,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatAcademicYearRange } from '../utils/academicPeriod';
import {
  fetchActionPlans,
  fetchGoalById,
  fetchGoals,
  fetchKPIs,
  updateGoal,
  updateKpiResult,
  updateKpiProjections,
  updateActionPlanResult,
  updateActionPlanProjections,
  extendKPIDeadline,
  fetchKPIHistory,
  extendActionPlanDeadline,
  fetchActionPlanHistory,
} from '../lib/api';
import { useI18n } from '../i18n';
import { isAdminRole } from '../lib/access';

interface GoalDetailProps {
  goalId: string;
  userRole: UserRole;
  userUnit?: string;
  onBack: () => void;
  isReadOnly: boolean;
}

export function GoalDetail({
  goalId,
  userRole,
  userUnit,
  onBack,
  isReadOnly,
}: GoalDetailProps) {
  const { language, t } = useI18n();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [relatedKPIs, setRelatedKPIs] = useState<KPI[]>([]);
  const [relatedActions, setRelatedActions] = useState<ActionPlan[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'kpis' | 'actions' | 'hierarchy'
  >('overview');
  const [editableGoal, setEditableGoal] = useState<Goal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  // Result / Projection inline form state
  const [activeResultKpiId, setActiveResultKpiId] = useState<string | null>(null);
  const [activeProjectionKpiId, setActiveProjectionKpiId] = useState<string | null>(null);
  const [resultFormType, setResultFormType] = useState<KpiResultType>('number');
  const [resultFormValue, setResultFormValue] = useState('');
  const [projectionFormValues, setProjectionFormValues] = useState<string[]>(Array(6).fill(''));
  const [kpiFormSaving, setKpiFormSaving] = useState(false);
  const [kpiFormError, setKpiFormError] = useState<string | null>(null);

  // Result / Projection inline form state — Action Plans
  const [activeResultActionId, setActiveResultActionId] = useState<string | null>(null);
  const [activeProjectionActionId, setActiveProjectionActionId] = useState<string | null>(null);
  const [actionResultFormType, setActionResultFormType] = useState<KpiResultType>('number');
  const [actionResultFormValue, setActionResultFormValue] = useState('');
  const [actionProjectionFormValues, setActionProjectionFormValues] = useState<string[]>(Array(6).fill(''));
  const [actionFormSaving, setActionFormSaving] = useState(false);
  const [actionFormError, setActionFormError] = useState<string | null>(null);

  // Submission history panels
  const [historyKpiId, setHistoryKpiId] = useState<string | null>(null);
  const [historyActionId, setHistoryActionId] = useState<string | null>(null);
  const [kpiHistoryMap, setKpiHistoryMap] = useState<Record<string, SubmissionLog[]>>({});
  const [actionHistoryMap, setActionHistoryMap] = useState<Record<string, SubmissionLog[]>>({});

  useEffect(() => {
    let isMounted = true;

    const loadGoal = async () => {
      setIsLoading(true);
      setError(null);
      setIsEditing(false);

      try {
        const goalData = await fetchGoalById(goalId);
        if (!isMounted) return;

        setGoal(goalData);
        setEditableGoal(goalData);

        const [yearGoals, goalKpis, goalActions] = await Promise.all([
          fetchGoals({
            academicYearStart: goalData.academicYearStart,
          }),
          fetchKPIs({
            academicYearStart: goalData.academicYearStart,
            goalId,
          }),
          fetchActionPlans({
            academicYearStart: goalData.academicYearStart,
            goalId,
          }),
        ]);

        if (!isMounted) return;
        setAllGoals(yearGoals);
        setRelatedKPIs(goalKpis);
        setRelatedActions(goalActions);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error ? loadError.message : 'Failed to load goal'
        );
        setGoal(null);
        setEditableGoal(null);
        setAllGoals([]);
        setRelatedKPIs([]);
        setRelatedActions([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGoal();

    return () => {
      isMounted = false;
    };
  }, [goalId]);

  const goalData = editableGoal ?? goal;
  const canEditGoal =
    userRole === 'Unit Manager'
      ? goalData?.responsibleUnit === userUnit
      : isAdminRole(userRole);

  const parentGoal = useMemo(
    () =>
      goalData?.parentId
        ? allGoals.find((item) => item.id === goalData.parentId) ?? null
        : null,
    [allGoals, goalData?.parentId]
  );

  const childGoals = useMemo(
    () => allGoals.filter((item) => item.parentId === goalId),
    [allGoals, goalId]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-700';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Medium':
        return 'bg-blue-100 text-blue-700';
      case 'Low':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSaveEdit = async () => {
    if (!editableGoal) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedGoal = await updateGoal(editableGoal.id, {
        title: editableGoal.title,
        description: editableGoal.description,
        academicYearStart: editableGoal.academicYearStart,
        status: editableGoal.status,
        priority: editableGoal.priority,
        responsibleUnit: editableGoal.responsibleUnit,
        parentId: editableGoal.parentId,
        startDate: editableGoal.startDate,
        endDate: editableGoal.endDate,
        progress: editableGoal.progress,
        assignedTo: editableGoal.assignedTo ?? [],
        updatedBy:
          userRole === 'Strategy Office'
            ? 'Strategy Office Admin'
            : `${editableGoal.responsibleUnit} Manager`,
      });

      setGoal(updatedGoal);
      setEditableGoal(updatedGoal);
      setAllGoals((prev) =>
        prev.map((item) => (item.id === updatedGoal.id ? updatedGoal : item))
      );
      setIsEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to update goal'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditableGoal(goal);
    setIsEditing(false);
    setError(null);
  };

  const handleEditChange = <K extends keyof Goal>(field: K, value: Goal[K]) => {
    if (!editableGoal) return;
    setEditableGoal({
      ...editableGoal,
      [field]: value,
    });
  };

  const openResultForm = (kpi: KPI) => {
    setActiveProjectionKpiId(null);
    setKpiFormError(null);
    setResultFormType((kpi.resultType as KpiResultType) ?? 'number');
    setResultFormValue(kpi.resultValue ?? '');
    setActiveResultKpiId(activeResultKpiId === kpi.id ? null : kpi.id);
  };

  const openProjectionForm = (kpi: KPI) => {
    setActiveResultKpiId(null);
    setKpiFormError(null);
    const vals = Array(6).fill('');
    (kpi.projectionValues ?? []).forEach((v, i) => { if (i < 6) vals[i] = v; });
    setProjectionFormValues(vals);
    setActiveProjectionKpiId(activeProjectionKpiId === kpi.id ? null : kpi.id);
  };

  const handleSaveResult = async (kpi: KPI) => {
    if (!resultFormValue.trim()) {
      setKpiFormError(t('Result value is required'));
      return;
    }
    setKpiFormSaving(true);
    setKpiFormError(null);
    try {
      const updatedBy = userRole === 'Strategy Office' ? 'Strategy Office Admin' : `${kpi.responsibleUnit} Manager`;
      const updated = await updateKpiResult(kpi.id, {
        resultType: resultFormType,
        resultValue: resultFormValue.trim(),
        updatedBy,
      });
      setRelatedKPIs((prev) => prev.map((k) => k.id === updated.id ? updated : k));
      setActiveResultKpiId(null);
    } catch (err) {
      setKpiFormError(err instanceof Error ? err.message : 'Failed to save result');
    } finally {
      setKpiFormSaving(false);
    }
  };

  const handleSaveProjection = async (kpi: KPI) => {
    setKpiFormSaving(true);
    setKpiFormError(null);
    try {
      const updatedBy = userRole === 'Strategy Office' ? 'Strategy Office Admin' : `${kpi.responsibleUnit} Manager`;
      const updated = await updateKpiProjections(kpi.id, {
        projectionValues: projectionFormValues,
        updatedBy,
      });
      setRelatedKPIs((prev) => prev.map((k) => k.id === updated.id ? updated : k));
      setActiveProjectionKpiId(null);
    } catch (err) {
      setKpiFormError(err instanceof Error ? err.message : 'Failed to save projection');
    } finally {
      setKpiFormSaving(false);
    }
  };

  const toggleKpiHistory = async (kpiId: string) => {
    if (historyKpiId === kpiId) { setHistoryKpiId(null); return; }
    setHistoryKpiId(kpiId);
    if (!kpiHistoryMap[kpiId]) {
      try {
        const history = await fetchKPIHistory(kpiId);
        setKpiHistoryMap((prev) => ({ ...prev, [kpiId]: history }));
      } catch { /* ignore */ }
    }
  };

  const toggleActionHistory = async (actionId: string) => {
    if (historyActionId === actionId) { setHistoryActionId(null); return; }
    setHistoryActionId(actionId);
    if (!actionHistoryMap[actionId]) {
      try {
        const history = await fetchActionPlanHistory(actionId);
        setActionHistoryMap((prev) => ({ ...prev, [actionId]: history }));
      } catch { /* ignore */ }
    }
  };

  const openActionResultForm = (action: ActionPlan) => {
    setActiveProjectionActionId(null);
    setActionFormError(null);
    setActionResultFormType((action.resultType as KpiResultType) ?? 'number');
    setActionResultFormValue(action.resultValue ?? '');
    setActiveResultActionId(activeResultActionId === action.id ? null : action.id);
  };

  const openActionProjectionForm = (action: ActionPlan) => {
    setActiveResultActionId(null);
    setActionFormError(null);
    const vals = Array(6).fill('');
    (action.projectionValues ?? []).forEach((v, i) => { if (i < 6) vals[i] = v; });
    setActionProjectionFormValues(vals);
    setActiveProjectionActionId(activeProjectionActionId === action.id ? null : action.id);
  };

  const handleSaveActionResult = async (action: ActionPlan) => {
    if (!actionResultFormValue.trim()) {
      setActionFormError(t('Result value is required'));
      return;
    }
    setActionFormSaving(true);
    setActionFormError(null);
    try {
      const updatedBy = userRole === 'Strategy Office' ? 'Strategy Office Admin' : `${action.responsibleUnit} Manager`;
      const updated = await updateActionPlanResult(action.id, {
        resultType: actionResultFormType,
        resultValue: actionResultFormValue.trim(),
        updatedBy,
      });
      setRelatedActions((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      setActiveResultActionId(null);
    } catch (err) {
      setActionFormError(err instanceof Error ? err.message : 'Failed to save result');
    } finally {
      setActionFormSaving(false);
    }
  };

  const handleSaveActionProjection = async (action: ActionPlan) => {
    setActionFormSaving(true);
    setActionFormError(null);
    try {
      const updatedBy = userRole === 'Strategy Office' ? 'Strategy Office Admin' : `${action.responsibleUnit} Manager`;
      const updated = await updateActionPlanProjections(action.id, {
        projectionValues: actionProjectionFormValues,
        updatedBy,
      });
      setRelatedActions((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      setActiveProjectionActionId(null);
    } catch (err) {
      setActionFormError(err instanceof Error ? err.message : 'Failed to save projection');
    } finally {
      setActionFormSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">{t('Goal is loading...')}</p>
      </div>
    );
  }

  if (!goalData) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">{t(error ?? 'Goal not found.')}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('Back')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {t(error)}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Back')}
          </button>
          {canEditGoal && !isReadOnly && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                    >
                      {isSaving ? t('Saving...') : t('Save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('Cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('Edit')}
                  </button>
                )}
              </div>
            )}
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  goalData.level === 0
                    ? 'bg-purple-100 text-purple-700'
                    : goalData.level === 1
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {goalData.level === 0
                  ? t('Main Goal')
                  : goalData.level === 1
                    ? t('Sub Goal')
                    : t('Sub Item')}
              </span>
              <span className="text-sm text-gray-500">{goalData.id}</span>
            </div>
            <h1 className="mb-3">{goalData.title}</h1>
            <p className="text-gray-600 mb-4">{goalData.description}</p>

            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                  goalData.status
                )}`}
              >
                {t(goalData.status)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(
                  goalData.priority
                )}`}
              >
                {t(goalData.priority)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Overview')}
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'kpis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('KPIs')} ({relatedKPIs.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'actions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Action Plans')} ({relatedActions.length})
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'hierarchy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Hierarchy')}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isEditing && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">{t('Title')}</label>
                      <input
                        value={editableGoal?.title ?? ''}
                        onChange={(event) =>
                          handleEditChange('title', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        {t('Responsible Unit')}
                      </label>
                      <input
                        value={editableGoal?.responsibleUnit ?? ''}
                        onChange={(event) =>
                          handleEditChange('responsibleUnit', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600">{t('Description')}</label>
                      <textarea
                        value={editableGoal?.description ?? ''}
                        onChange={(event) =>
                          handleEditChange('description', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[96px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">{t('Status')}</label>
                      <select
                        value={editableGoal?.status ?? 'On Track'}
                        onChange={(event) =>
                          handleEditChange(
                            'status',
                            event.target.value as Goal['status']
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="On Track">{t('On Track')}</option>
                        <option value="At Risk">{t('At Risk')}</option>
                        <option value="Delayed">{t('Delayed')}</option>
                        <option value="Completed">{t('Completed')}</option>
                        <option value="Not Started">{t('Not Started')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">{t('Priority')}</label>
                      <select
                        value={editableGoal?.priority ?? 'Medium'}
                        onChange={(event) =>
                          handleEditChange(
                            'priority',
                            event.target.value as Goal['priority']
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="Critical">{t('Critical')}</option>
                        <option value="High">{t('High')}</option>
                        <option value="Medium">{t('Medium')}</option>
                        <option value="Low">{t('Low')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        {t('Start Date')}
                      </label>
                      <input
                        type="date"
                        value={(editableGoal?.startDate ?? '').slice(0, 10)}
                        onChange={(event) =>
                          handleEditChange('startDate', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        {t('End Date')}
                      </label>
                      <input
                        type="date"
                        value={(editableGoal?.endDate ?? '').slice(0, 10)}
                        onChange={(event) =>
                          handleEditChange('endDate', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">{t('Progress (%)')}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editableGoal?.progress ?? 0}
                        onChange={(event) =>
                          handleEditChange('progress', Number(event.target.value))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600">
                        {t('Assigned People (comma separated)')}
                      </label>
                      <input
                        value={(editableGoal?.assignedTo ?? []).join(', ')}
                        onChange={(event) =>
                          handleEditChange(
                            'assignedTo',
                            event.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean)
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3">{t('Progress Status')}</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('Total Progress')}</span>
                    <span>{goalData.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        goalData.status === 'Completed'
                          ? 'bg-green-500'
                          : goalData.status === 'Not Started'
                            ? 'bg-gray-400'
                          : goalData.status === 'On Track'
                            ? 'bg-blue-500'
                            : goalData.status === 'At Risk'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${goalData.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {t('Responsible Unit')}
                      </div>
                      <div>{goalData.responsibleUnit}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {t('Start Date')}
                      </div>
                      <div>
                        {new Date(goalData.startDate).toLocaleDateString(locale)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {t('End Date')}
                      </div>
                      <div>
                        {new Date(goalData.endDate).toLocaleDateString(locale)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{t('Academic Year')}</div>
                      <div>
                        {formatAcademicYearRange(goalData.academicYearStart)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {t('Last Updated')}
                      </div>
                      <div className="text-sm">
                        {new Date(goalData.updatedAt).toLocaleString(locale)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('Updated By')}: {t(goalData.updatedBy)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {goalData.assignedTo && goalData.assignedTo.length > 0 && (
                <div>
                  <h3 className="mb-3">{t('Assigned People')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {goalData.assignedTo.map((person, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">{t('KPI Count')}</span>
                  </div>
                  <div className="text-2xl">{relatedKPIs.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {t('Action Plans')}
                    </span>
                  </div>
                  <div className="text-2xl">{relatedActions.length}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">{t('Sub Goals')}</span>
                  </div>
                  <div className="text-2xl">{childGoals.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kpis' && (
            <div className="space-y-4">
              {relatedKPIs.length > 0 ? (
                relatedKPIs.map((kpi) => {
                  const canEditKpi =
                    !isReadOnly &&
                    (userRole === 'Strategy Office' ||
                      (userRole === 'Unit Manager' && kpi.responsibleUnit === userUnit));
                  const isResultOpen = activeResultKpiId === kpi.id;
                  const isProjectionOpen = activeProjectionKpiId === kpi.id;
                  const isHistoryOpen = historyKpiId === kpi.id;
                  const yearStart = kpi.academicYearStart ?? goal?.academicYearStart ?? new Date().getFullYear();
                  const history = kpiHistoryMap[kpi.id] ?? [];

                  return (
                    <div
                      key={kpi.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4">
                        <h4 className="mb-2">{kpi.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t('Progress')}</span>
                            <span>
                              {kpi.currentValue} / {kpi.targetValue} {kpi.unit} (
                              {kpi.targetValue > 0
                                ? Math.round((kpi.currentValue / kpi.targetValue) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  kpi.targetValue > 0
                                    ? (kpi.currentValue / kpi.targetValue) * 100
                                    : 0,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-3">
                          <span>{t('Assigned To')}: {kpi.assignedTo}</span>
                        </div>

                        {/* Result & Projection summary badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {kpi.resultValue && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('Result')}: {kpi.resultValue}
                              {kpi.resultType === 'percentage' ? '%' : kpi.resultType === 'currency' ? ' ₺' : ''}
                            </span>
                          )}
                          {kpi.projectionValues && kpi.projectionValues.some(Boolean) && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              <BarChart2 className="w-3 h-3" />
                              {t('Projection')}: {formatAcademicYearRange(yearStart)} → {formatAcademicYearRange(yearStart + 5)}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {canEditKpi && (
                            <>
                              <button
                                onClick={() => openResultForm(kpi)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isResultOpen
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('Add Result')}
                                {isResultOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => openProjectionForm(kpi)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isProjectionOpen
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                                {t('Add Projection')}
                                {isProjectionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </>
                          )}
                          {history.length > 0 && (
                            <button
                              onClick={() => toggleKpiHistory(kpi.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                isHistoryOpen
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              {t('History')} ({history.length})
                              {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Result Form */}
                      {isResultOpen && (
                        <div className="border-t border-gray-200 bg-green-50 p-4">
                          <h5 className="text-sm font-semibold text-green-800 mb-3">{t('Enter Result')}</h5>
                          {kpiFormError && activeResultKpiId === kpi.id && (
                            <p className="text-xs text-red-600 mb-2">{kpiFormError}</p>
                          )}
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-3 flex-wrap">
                              <div className="w-40">
                                <label className="block text-xs text-gray-600 mb-1">{t('Result Type')}</label>
                                <select
                                  value={resultFormType}
                                  onChange={(e) => setResultFormType(e.target.value as KpiResultType)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="number">{t('Number')}</option>
                                  <option value="percentage">{t('Percentage')}</option>
                                  <option value="currency">{t('Currency')}</option>
                                  <option value="text">{t('Text')}</option>
                                  <option value="boolean">{t('Boolean')}</option>
                                </select>
                              </div>
                              <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs text-gray-600 mb-1">{t('Result Value')}</label>
                                {resultFormType === 'boolean' ? (
                                  <select
                                    value={resultFormValue}
                                    onChange={(e) => setResultFormValue(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  >
                                    <option value="">{t('Select...')}</option>
                                    <option value="true">{t('Yes / Achieved')}</option>
                                    <option value="false">{t('No / Not Achieved')}</option>
                                  </select>
                                ) : resultFormType === 'text' ? (
                                  <textarea
                                    value={resultFormValue}
                                    onChange={(e) => setResultFormValue(e.target.value)}
                                    rows={2}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder={t('Enter result description...')}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    value={resultFormValue}
                                    onChange={(e) => setResultFormValue(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder={resultFormType === 'percentage' ? '0-100' : resultFormType === 'currency' ? '0.00' : '0'}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setActiveResultKpiId(null); setKpiFormError(null); }}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={kpiFormSaving}
                              >
                                {t('Cancel')}
                              </button>
                              <button
                                onClick={() => handleSaveResult(kpi)}
                                disabled={kpiFormSaving}
                                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                              >
                                {kpiFormSaving ? t('Saving...') : t('Save Result')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Inline Projection Form */}
                      {isProjectionOpen && (
                        <div className="border-t border-gray-200 bg-blue-50 p-4">
                          <h5 className="text-sm font-semibold text-blue-800 mb-1">{t('Enter Projections')}</h5>
                          <p className="text-xs text-blue-600 mb-3">{t('Enter projected values for current and upcoming 5 years.')}</p>
                          {kpiFormError && activeProjectionKpiId === kpi.id && (
                            <p className="text-xs text-red-600 mb-2">{kpiFormError}</p>
                          )}
                          <div className="overflow-x-auto pb-1">
                            <div className="flex gap-2 min-w-max mb-3">
                              {Array.from({ length: 6 }, (_, i) => (
                                <div key={i} className="flex flex-col w-28">
                                  <label className="block text-xs font-medium text-blue-700 mb-1 text-center whitespace-nowrap">
                                    {i === 0
                                      ? `${t('Current Year')} (${formatAcademicYearRange(yearStart)})`
                                      : formatAcademicYearRange(yearStart + i)}
                                  </label>
                                  <input
                                    type="text"
                                    value={projectionFormValues[i]}
                                    onChange={(e) => {
                                      const next = [...projectionFormValues];
                                      next[i] = e.target.value;
                                      setProjectionFormValues(next);
                                    }}
                                    className="w-full px-2 py-1.5 text-sm text-center border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="—"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setActiveProjectionKpiId(null); setKpiFormError(null); }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              disabled={kpiFormSaving}
                            >
                              {t('Cancel')}
                            </button>
                            <button
                              onClick={() => handleSaveProjection(kpi)}
                              disabled={kpiFormSaving}
                              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                            >
                              {kpiFormSaving ? t('Saving...') : t('Save Projections')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* History Panel */}
                      {isHistoryOpen && (
                        <div className="border-t border-gray-200 bg-purple-50 p-4">
                          <h5 className="text-sm font-semibold text-purple-800 mb-3">{t('Submission History')}</h5>
                          <div className="space-y-3">
                            {history.map((entry) => (
                              <div key={entry.id} className="bg-white rounded-lg border border-purple-200 p-3 text-xs">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-purple-800">
                                    {t('Cycle deadline')}: {entry.cycleDeadline ? new Date(entry.cycleDeadline).toLocaleDateString(locale) : '—'}
                                  </span>
                                  <span className="text-gray-400">
                                    {t('Archived')}: {new Date(entry.loggedAt).toLocaleString(locale)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-3 text-gray-700">
                                  <span>
                                    <span className="text-gray-500">{t('Result')}: </span>
                                    {entry.resultData.resultValue
                                      ? `${entry.resultData.resultValue}${entry.resultData.resultType === 'percentage' ? '%' : entry.resultData.resultType === 'currency' ? ' ₺' : ''}`
                                      : <em className="text-gray-400">{t('None')}</em>}
                                  </span>
                                  {entry.projectionData.some(Boolean) && (
                                    <span>
                                      <span className="text-gray-500">{t('Projections')}: </span>
                                      {entry.projectionData.filter(Boolean).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-gray-400">{t('Archived by')}: {entry.extendedBy}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {t('No KPIs were found for this goal.')}
                </p>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              {relatedActions.length > 0 ? (
                relatedActions.map((action) => {
                  const canEditAction =
                    !isReadOnly &&
                    (isAdminRole(userRole) ||
                      (userRole === 'Unit Manager' && action.responsibleUnit === userUnit));
                  const isResultOpen = activeResultActionId === action.id;
                  const isProjectionOpen = activeProjectionActionId === action.id;
                  const isHistoryOpen = historyActionId === action.id;
                  const yearStart = action.academicYearStart ?? goal?.academicYearStart ?? new Date().getFullYear();
                  const history = actionHistoryMap[action.id] ?? [];

                  return (
                    <div
                      key={action.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4>{action.title}</h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              action.status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : action.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : action.status === 'Blocked'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {t(action.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {action.description}
                        </p>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t('Progress')}</span>
                            <span>{action.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${action.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex text-sm text-gray-600 mb-3">
                          <span>{t('Assigned To')}: {action.assignedTo}</span>
                        </div>

                        {/* Result & Projection summary badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {action.resultValue && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('Result')}: {action.resultValue}
                              {action.resultType === 'percentage' ? '%' : action.resultType === 'currency' ? ' ₺' : ''}
                            </span>
                          )}
                          {action.projectionValues && action.projectionValues.some(Boolean) && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              <BarChart2 className="w-3 h-3" />
                              {t('Projection')}: {formatAcademicYearRange(yearStart)} → {formatAcademicYearRange(yearStart + 5)}
                            </span>
                          )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {canEditAction && (
                            <>
                              <button
                                onClick={() => openActionResultForm(action)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isResultOpen
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t('Add Result')}
                                {isResultOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => openActionProjectionForm(action)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                  isProjectionOpen
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                                {t('Add Projection')}
                                {isProjectionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </>
                          )}
                          {history.length > 0 && (
                            <button
                              onClick={() => toggleActionHistory(action.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                isHistoryOpen
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              {t('History')} ({history.length})
                              {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Result Form */}
                      {isResultOpen && (
                        <div className="border-t border-gray-200 bg-green-50 p-4">
                          <h5 className="text-sm font-semibold text-green-800 mb-3">{t('Enter Result')}</h5>
                          {actionFormError && activeResultActionId === action.id && (
                            <p className="text-xs text-red-600 mb-2">{actionFormError}</p>
                          )}
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-3 flex-wrap">
                              <div className="w-40">
                                <label className="block text-xs text-gray-600 mb-1">{t('Result Type')}</label>
                                <select
                                  value={actionResultFormType}
                                  onChange={(e) => setActionResultFormType(e.target.value as KpiResultType)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                  <option value="number">{t('Number')}</option>
                                  <option value="percentage">{t('Percentage')}</option>
                                  <option value="currency">{t('Currency')}</option>
                                  <option value="text">{t('Text')}</option>
                                  <option value="boolean">{t('Boolean')}</option>
                                </select>
                              </div>
                              <div className="flex-1 min-w-[160px]">
                                <label className="block text-xs text-gray-600 mb-1">{t('Result Value')}</label>
                                {actionResultFormType === 'boolean' ? (
                                  <select
                                    value={actionResultFormValue}
                                    onChange={(e) => setActionResultFormValue(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  >
                                    <option value="">{t('Select...')}</option>
                                    <option value="true">{t('Yes / Achieved')}</option>
                                    <option value="false">{t('No / Not Achieved')}</option>
                                  </select>
                                ) : actionResultFormType === 'text' ? (
                                  <textarea
                                    value={actionResultFormValue}
                                    onChange={(e) => setActionResultFormValue(e.target.value)}
                                    rows={2}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder={t('Enter result description...')}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    value={actionResultFormValue}
                                    onChange={(e) => setActionResultFormValue(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder={actionResultFormType === 'percentage' ? '0-100' : actionResultFormType === 'currency' ? '0.00' : '0'}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setActiveResultActionId(null); setActionFormError(null); }}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={actionFormSaving}
                              >
                                {t('Cancel')}
                              </button>
                              <button
                                onClick={() => handleSaveActionResult(action)}
                                disabled={actionFormSaving}
                                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                              >
                                {actionFormSaving ? t('Saving...') : t('Save Result')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Inline Projection Form */}
                      {isProjectionOpen && (
                        <div className="border-t border-gray-200 bg-blue-50 p-4">
                          <h5 className="text-sm font-semibold text-blue-800 mb-1">{t('Enter Projections')}</h5>
                          <p className="text-xs text-blue-600 mb-3">{t('Enter projected values for current and upcoming 5 years.')}</p>
                          {actionFormError && activeProjectionActionId === action.id && (
                            <p className="text-xs text-red-600 mb-2">{actionFormError}</p>
                          )}
                          <div className="overflow-x-auto pb-1">
                            <div className="flex gap-2 min-w-max mb-3">
                              {Array.from({ length: 6 }, (_, i) => (
                                <div key={i} className="flex flex-col w-28">
                                  <label className="block text-xs font-medium text-blue-700 mb-1 text-center whitespace-nowrap">
                                    {i === 0
                                      ? `${t('Current Year')} (${formatAcademicYearRange(yearStart)})`
                                      : formatAcademicYearRange(yearStart + i)}
                                  </label>
                                  <input
                                    type="text"
                                    value={actionProjectionFormValues[i]}
                                    onChange={(e) => {
                                      const next = [...actionProjectionFormValues];
                                      next[i] = e.target.value;
                                      setActionProjectionFormValues(next);
                                    }}
                                    className="w-full px-2 py-1.5 text-sm text-center border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="—"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setActiveProjectionActionId(null); setActionFormError(null); }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              disabled={actionFormSaving}
                            >
                              {t('Cancel')}
                            </button>
                            <button
                              onClick={() => handleSaveActionProjection(action)}
                              disabled={actionFormSaving}
                              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                            >
                              {actionFormSaving ? t('Saving...') : t('Save Projections')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* History Panel */}
                      {isHistoryOpen && (
                        <div className="border-t border-gray-200 bg-purple-50 p-4">
                          <h5 className="text-sm font-semibold text-purple-800 mb-3">{t('Submission History')}</h5>
                          <div className="space-y-3">
                            {history.map((entry) => (
                              <div key={entry.id} className="bg-white rounded-lg border border-purple-200 p-3 text-xs">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-purple-800">
                                    {t('Cycle deadline')}: {entry.cycleDeadline ? new Date(entry.cycleDeadline).toLocaleDateString(locale) : '—'}
                                  </span>
                                  <span className="text-gray-400">
                                    {t('Archived')}: {new Date(entry.loggedAt).toLocaleString(locale)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-3 text-gray-700">
                                  <span>
                                    <span className="text-gray-500">{t('Result')}: </span>
                                    {entry.resultData.resultValue
                                      ? `${entry.resultData.resultValue}${entry.resultData.resultType === 'percentage' ? '%' : entry.resultData.resultType === 'currency' ? ' ₺' : ''}`
                                      : <em className="text-gray-400">{t('None')}</em>}
                                  </span>
                                  {entry.projectionData.some(Boolean) && (
                                    <span>
                                      <span className="text-gray-500">{t('Projections')}: </span>
                                      {entry.projectionData.filter(Boolean).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-gray-400">{t('Archived by')}: {entry.extendedBy}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {t('No action plans were found for this goal.')}
                </p>
              )}
            </div>
          )}

          {activeTab === 'hierarchy' && (
            <div className="space-y-4">
              {parentGoal && (
                <div>
                  <h3 className="mb-3">{t('Parent Goal')}</h3>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {parentGoal.level === 0 ? t('Main Goal') : t('Sub Goal')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {parentGoal.id}
                      </span>
                    </div>
                    <h4>{parentGoal.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      {parentGoal.description}
                    </p>
                  </div>
                </div>
              )}

              {childGoals.length > 0 && (
                <div>
                  <h3 className="mb-3">{t('Sub Goals')} ({childGoals.length})</h3>
                  <div className="space-y-3">
                    {childGoals.map((child) => (
                      <div
                        key={child.id}
                        className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {child.level === 1 ? t('Sub Goal') : t('Sub Item')}
                            </span>
                            <span className="text-sm text-gray-500">
                              {child.id}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              child.status
                            )}`}
                          >
                            {t(child.status)}
                          </span>
                        </div>
                        <h4>{child.title}</h4>
                        <p className="text-sm text-gray-600 mt-2">
                          {child.description}
                        </p>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{t('Progress')}</span>
                            <span>{child.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${child.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!parentGoal && childGoals.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  {t('This goal has no hierarchy relationship yet.')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
