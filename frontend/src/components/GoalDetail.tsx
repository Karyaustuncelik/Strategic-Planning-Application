import { useEffect, useMemo, useState } from 'react';
import { ActionPlan, Goal, KPI, UserRole } from '../types';
import {
  ArrowLeft,
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
} from '../lib/api';

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

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">Goal is loading...</p>
      </div>
    );
  }

  if (!goalData) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">{error ?? 'Hedef bulunamadı.'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </button>
          {(userRole === 'Strategy Office' ||
            goalData.responsibleUnit === userUnit) &&
            !isReadOnly && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                    >
                      {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Vazgec
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Duzenle
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
                  ? 'Ana Hedef'
                  : goalData.level === 1
                    ? 'Alt Hedef'
                    : 'Alt Item'}
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
                {goalData.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(
                  goalData.priority
                )}`}
              >
                {goalData.priority}
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
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'kpis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              KPI'lar ({relatedKPIs.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'actions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Aksiyon Planları ({relatedActions.length})
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'hierarchy'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Hiyerarşi
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
                      <label className="text-sm text-gray-600">Baslik</label>
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
                        Sorumlu Birim
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
                      <label className="text-sm text-gray-600">Aciklama</label>
                      <textarea
                        value={editableGoal?.description ?? ''}
                        onChange={(event) =>
                          handleEditChange('description', event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[96px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Durum</label>
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
                        <option value="On Track">On Track</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Started">Not Started</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Oncelik</label>
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
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Baslangic Tarihi
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
                        Bitis Tarihi
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
                      <label className="text-sm text-gray-600">İlerleme (%)</label>
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
                        Atanan Kisiler (virgul ile)
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
                <h3 className="mb-3">İlerleme Durumu</h3>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Toplam İlerleme</span>
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
                        Sorumlu Birim
                      </div>
                      <div>{goalData.responsibleUnit}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Başlangıç Tarihi
                      </div>
                      <div>
                        {new Date(goalData.startDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Bitiş Tarihi
                      </div>
                      <div>
                        {new Date(goalData.endDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Yıl</div>
                      <div>
                        {formatAcademicYearRange(goalData.academicYearStart)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Son Güncelleme
                      </div>
                      <div className="text-sm">
                        {new Date(goalData.updatedAt).toLocaleString('tr-TR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Güncelleyen: {goalData.updatedBy}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {goalData.assignedTo && goalData.assignedTo.length > 0 && (
                <div>
                  <h3 className="mb-3">Atanan Kişiler</h3>
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
                    <span className="text-sm text-gray-600">KPI Sayısı</span>
                  </div>
                  <div className="text-2xl">{relatedKPIs.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">
                      Aksiyon Planı
                    </span>
                  </div>
                  <div className="text-2xl">{relatedActions.length}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Alt Hedef</span>
                  </div>
                  <div className="text-2xl">{childGoals.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kpis' && (
            <div className="space-y-4">
              {relatedKPIs.length > 0 ? (
                relatedKPIs.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <h4 className="mb-2">{kpi.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {kpi.description}
                    </p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>İlerleme</span>
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
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        Son Tarih:{' '}
                        {new Date(kpi.deadline).toLocaleDateString('tr-TR')}
                      </span>
                      <span>Atanan: {kpi.assignedTo}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Bu hedefe bağlı KPI bulunamadı.
                </p>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              {relatedActions.length > 0 ? (
                relatedActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
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
                        {action.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>İlerleme</span>
                        <span>{action.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${action.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Atanan: {action.assignedTo}</span>
                      <span>
                        Son Tarih:{' '}
                        {new Date(action.deadline).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Bu hedefe bağlı aksiyon planı bulunamadı.
                </p>
              )}
            </div>
          )}

          {activeTab === 'hierarchy' && (
            <div className="space-y-4">
              {parentGoal && (
                <div>
                  <h3 className="mb-3">Üst Hedef</h3>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {parentGoal.level === 0 ? 'Ana Hedef' : 'Alt Hedef'}
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
                  <h3 className="mb-3">Alt Hedefler ({childGoals.length})</h3>
                  <div className="space-y-3">
                    {childGoals.map((child) => (
                      <div
                        key={child.id}
                        className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {child.level === 1 ? 'Alt Hedef' : 'Alt Item'}
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
                            {child.status}
                          </span>
                        </div>
                        <h4>{child.title}</h4>
                        <p className="text-sm text-gray-600 mt-2">
                          {child.description}
                        </p>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>İlerleme</span>
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
                  Bu hedefin hiyerarşik ilişkisi bulunmuyor.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
