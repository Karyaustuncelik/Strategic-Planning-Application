import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { ActionPlan, Goal, KPI, ViewerAccount } from '../types';
import {
  assignGoalTrees,
  copyAcademicYearGoals,
  fetchActionPlans,
  fetchAuthOptions,
  fetchGoals,
  fetchKPIs,
} from '../lib/api';
import { formatAcademicYearRange } from '../utils/academicPeriod';
import { useI18n } from '../i18n';

interface UnassignedGoalsViewProps {
  userName: string;
  selectedAcademicYearStart: number;
  isReadOnly: boolean;
}

type GoalTreeMap = Map<string, Goal[]>;

function buildGoalTreeMap(goals: Goal[]) {
  const map: GoalTreeMap = new Map();

  for (const goal of goals) {
    const key = goal.parentId ?? '__root__';
    const items = map.get(key) ?? [];
    items.push(goal);
    map.set(key, items);
  }

  for (const items of map.values()) {
    items.sort((left, right) => left.title.localeCompare(right.title));
  }

  return map;
}

function getGoalLevelLabel(goal: Goal, t: (value: string) => string) {
  if (goal.level === 0) return t('Main Goal');
  if (goal.level === 1) return t('Sub Goal');
  return t('Sub Item');
}

export function UnassignedGoalsView({
  userName,
  selectedAcademicYearStart,
  isReadOnly,
}: UnassignedGoalsViewProps) {
  const { t } = useI18n();
  const copySourceYearStart = selectedAcademicYearStart - 1;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [viewerAccounts, setViewerAccounts] = useState<ViewerAccount[]>([]);

  const [sourceGoals, setSourceGoals] = useState<Goal[]>([]);
  const [sourceKpis, setSourceKpis] = useState<KPI[]>([]);
  const [sourceActions, setSourceActions] = useState<ActionPlan[]>([]);

  const [selectedCopyGoalIds, setSelectedCopyGoalIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set());
  const [expandedSourceGoalIds, setExpandedSourceGoalIds] = useState<Set<string>>(
    new Set()
  );
  const [assignee, setAssignee] = useState('');
  const [inlineAssignee, setInlineAssignee] = useState('');
  const [activeAssignGoalId, setActiveAssignGoalId] = useState<string | null>(null);
  const [showSourceItems, setShowSourceItems] = useState(true);

  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSourceGoals, setIsLoadingSourceGoals] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigningGoalId, setAssigningGoalId] = useState<string | null>(null);
  const [hasLoadedSourceGoals, setHasLoadedSourceGoals] = useState(false);

  const loadCurrentYearData = async () => {
    const [goalData, kpiData, actionData, authOptions] = await Promise.all([
      fetchGoals({ academicYearStart: selectedAcademicYearStart }),
      fetchKPIs({ academicYearStart: selectedAcademicYearStart }),
      fetchActionPlans({ academicYearStart: selectedAcademicYearStart }),
      fetchAuthOptions(),
    ]);

    setGoals(goalData);
    setKpis(kpiData);
    setActions(actionData);
    setViewerAccounts(authOptions.viewerAccounts);
    setAssignee((current) =>
      authOptions.viewerAccounts.some((account) => account.name === current)
        ? current
        : ''
    );
    setInlineAssignee((current) =>
      authOptions.viewerAccounts.some((account) => account.name === current)
        ? current
        : ''
    );
  };

  const loadSourceYearData = async () => {
    setIsLoadingSourceGoals(true);

    try {
      const [goalData, kpiData, actionData] = await Promise.all([
        fetchGoals({
          academicYearStart: copySourceYearStart,
        }),
        fetchKPIs({
          academicYearStart: copySourceYearStart,
        }),
        fetchActionPlans({
          academicYearStart: copySourceYearStart,
        }),
      ]);

      setSourceGoals(goalData);
      setSourceKpis(kpiData);
      setSourceActions(actionData);
      setSelectedCopyGoalIds([]);
      setHasLoadedSourceGoals(true);
    } catch (loadError) {
      setErrorMessage(
        loadError instanceof Error ? loadError.message : t('Failed to load goals')
      );
      setSourceGoals([]);
      setSourceKpis([]);
      setSourceActions([]);
      setSelectedCopyGoalIds([]);
      setHasLoadedSourceGoals(true);
    } finally {
      setIsLoadingSourceGoals(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setInfoMessage(null);
      setActiveAssignGoalId(null);
      setSelectedGoalIds([]);
      setShowSourceItems(true);

      try {
        await Promise.all([loadCurrentYearData(), loadSourceYearData()]);
        if (!isMounted) return;
      } catch (loadError) {
        if (!isMounted) return;
        setErrorMessage(
          loadError instanceof Error ? loadError.message : t('Failed to load goals')
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [selectedAcademicYearStart, t]);

  const currentYearGoals = useMemo(
    () => goals.filter((goal) => goal.academicYearStart === selectedAcademicYearStart),
    [goals, selectedAcademicYearStart]
  );
  const sourceYearGoals = useMemo(
    () => sourceGoals.filter((goal) => goal.academicYearStart === copySourceYearStart),
    [copySourceYearStart, sourceGoals]
  );

  const goalsByParentId = useMemo(
    () => buildGoalTreeMap(currentYearGoals),
    [currentYearGoals]
  );
  const sourceGoalsByParentId = useMemo(
    () => buildGoalTreeMap(sourceYearGoals),
    [sourceYearGoals]
  );

  const rootGoals = useMemo(
    () => goalsByParentId.get('__root__') ?? [],
    [goalsByParentId]
  );
  const sourceRootGoals = useMemo(
    () => sourceGoalsByParentId.get('__root__') ?? [],
    [sourceGoalsByParentId]
  );

  useEffect(() => {
    setExpandedGoalIds(new Set(rootGoals.map((goal) => goal.id)));
  }, [rootGoals]);

  useEffect(() => {
    setExpandedSourceGoalIds(new Set(sourceRootGoals.map((goal) => goal.id)));
  }, [sourceRootGoals]);

  const getGoalChildren = (map: GoalTreeMap, goalId: string) => map.get(goalId) ?? [];

  const getGoalTreeSelection = (map: GoalTreeMap, goalId: string): string[] => {
    const ids = [goalId];

    for (const child of getGoalChildren(map, goalId)) {
      ids.push(...getGoalTreeSelection(map, child.id));
    }

    return ids;
  };

  const getGoalKpis = (items: KPI[], goalId: string) =>
    items.filter((kpi) => kpi.goalId === goalId);

  const getGoalActions = (items: ActionPlan[], goalId: string) =>
    items.filter((action) => action.goalId === goalId);

  const hasUnassignedGoalInTree = (goalId: string): boolean => {
    const goal = currentYearGoals.find((item) => item.id === goalId);
    if (!goal) return false;

    if (!goal.assignedTo || goal.assignedTo.length === 0) {
      return true;
    }

    for (const child of getGoalChildren(goalsByParentId, goalId)) {
      if (hasUnassignedGoalInTree(child.id)) {
        return true;
      }
    }

    return false;
  };

  const unassignedRootGoals = useMemo(
    () => rootGoals.filter((goal) => hasUnassignedGoalInTree(goal.id)),
    [rootGoals]
  );

  const toggleExpanded = (goalId: string) => {
    setExpandedGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const toggleSourceExpanded = (goalId: string) => {
    setExpandedSourceGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const toggleGoalSelection = (goalId: string) => {
    const treeIds = getGoalTreeSelection(goalsByParentId, goalId);
    setSelectedGoalIds((prev) => {
      const hasAll = treeIds.every((id) => prev.includes(id));
      if (hasAll) {
        return prev.filter((id) => !treeIds.includes(id));
      }

      return [...new Set([...prev, ...treeIds])];
    });
  };

  const toggleCopyCandidate = (goalId: string) => {
    const treeIds = getGoalTreeSelection(sourceGoalsByParentId, goalId);
    setSelectedCopyGoalIds((prev) => {
      const hasAll = treeIds.every((id) => prev.includes(id));
      if (hasAll) {
        return prev.filter((id) => !treeIds.includes(id));
      }

      return [...new Set([...prev, ...treeIds])];
    });
  };

  const handleCopySelected = async () => {
    if (selectedCopyGoalIds.length === 0) {
      setErrorMessage(t('Select at least one goal to copy.'));
      return;
    }

    setIsCopying(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await copyAcademicYearGoals({
        sourceAcademicYearStart: copySourceYearStart,
        targetAcademicYearStart: selectedAcademicYearStart,
        goalIds: selectedCopyGoalIds,
        requestedBy: userName,
      });

      await loadCurrentYearData();
      setSelectedGoalIds([]);
      setSelectedCopyGoalIds([]);
      setShowSourceItems(false);
      setActiveAssignGoalId(null);
      setInfoMessage(
        `${t('Loaded into current year as unassigned items')}: ${result.copiedGoals} ${t(
          'Goals'
        ).toLowerCase()}, ${result.copiedKPIs} ${t('KPIs')}, ${result.copiedActions} ${t(
          'Action Plans'
        ).toLowerCase()}`
      );
    } catch (copyError) {
      setErrorMessage(
        copyError instanceof Error
          ? copyError.message
          : t('Failed to copy goals from previous academic year')
      );
    } finally {
      setIsCopying(false);
    }
  };

  const handleAssignSelected = async () => {
    if (selectedGoalIds.length === 0) {
      setErrorMessage(t('Select one or more goals first.'));
      return;
    }
    if (!assignee.trim()) {
      setErrorMessage(t('Assigned person is required.'));
      return;
    }

    setIsAssigning(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await assignGoalTrees({
        academicYearStart: selectedAcademicYearStart,
        goalIds: selectedGoalIds,
        assignedTo: assignee.trim(),
        assignedBy: userName,
      });

      await loadCurrentYearData();
      setSelectedGoalIds([]);
      setActiveAssignGoalId(null);
      setInfoMessage(
        `${t('Assignment summary')}: ${result.affectedGoals} ${t('Goals').toLowerCase()}, ${
          result.affectedKPIs
        } ${t('KPIs')}, ${result.affectedActions} ${t('Action Plans').toLowerCase()}`
      );
    } catch (assignError) {
      setErrorMessage(
        assignError instanceof Error
          ? assignError.message
          : t('Failed to create assignment')
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignSingleGoal = async (goalId: string) => {
    if (!inlineAssignee.trim()) {
      setErrorMessage(t('Assigned person is required.'));
      return;
    }

    setAssigningGoalId(goalId);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await assignGoalTrees({
        academicYearStart: selectedAcademicYearStart,
        goalIds: [goalId],
        assignedTo: inlineAssignee.trim(),
        assignedBy: userName,
      });

      await loadCurrentYearData();
      setSelectedGoalIds([]);
      setActiveAssignGoalId(null);
      setInfoMessage(
        `${t('Assigned directly')}: ${result.affectedGoals} ${t('Goals').toLowerCase()}`
      );
    } catch (assignError) {
      setErrorMessage(
        assignError instanceof Error
          ? assignError.message
          : t('Failed to create assignment')
      );
    } finally {
      setAssigningGoalId(null);
    }
  };

  const renderSelectionBox = (selected: boolean) => (
    <span
      className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded border ${
        selected
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-300 bg-white'
      }`}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : null}
    </span>
  );

  const renderRelatedItems = (relatedKpis: KPI[], relatedActions: ActionPlan[]) => {
    if (relatedKpis.length === 0 && relatedActions.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {relatedKpis.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-medium text-slate-600">{t('KPIs')}</div>
            <div className="space-y-2">
              {relatedKpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <div className="font-medium">{kpi.name}</div>
                  <div className="text-xs text-slate-500">
                    {kpi.assignedTo || t('Unassigned')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {relatedActions.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-medium text-slate-600">
              {t('Action Plans')}
            </div>
            <div className="space-y-2">
              {relatedActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-slate-500">
                    {action.assignedTo || t('Unassigned')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSourceTree = (goal: Goal, depth = 0): React.ReactNode => {
    const children = getGoalChildren(sourceGoalsByParentId, goal.id);
    const isExpanded = expandedSourceGoalIds.has(goal.id);
    const isSelected = selectedCopyGoalIds.includes(goal.id);
    const relatedKpis = getGoalKpis(sourceKpis, goal.id);
    const relatedActions = getGoalActions(sourceActions, goal.id);

    return (
      <div key={goal.id} className="space-y-3">
        <div
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCopyCandidate(goal.id)}
                className="shrink-0"
              >
                {renderSelectionBox(isSelected)}
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                    {getGoalLevelLabel(goal, t)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    {goal.responsibleUnit}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    {formatAcademicYearRange(copySourceYearStart)}
                  </span>
                </div>

                <div className="text-base font-semibold text-slate-900">{goal.title}</div>
                <p className="mt-1 text-sm text-slate-600">{goal.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 px-2.5 py-1">
                    {children.length} {t('Sub Goals')}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1">
                    {relatedKpis.length} {t('KPIs')}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1">
                    {relatedActions.length} {t('Action Plans')}
                  </span>
                </div>

                {renderRelatedItems(relatedKpis, relatedActions)}
              </div>
            </div>

            {children.length > 0 && (
              <button
                type="button"
                onClick={() => toggleSourceExpanded(goal.id)}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {isExpanded ? t('Hide Children') : t('Show Children')}
              </button>
            )}
          </div>
        </div>

        {isExpanded && children.map((child) => renderSourceTree(child, depth + 1))}
      </div>
    );
  };

  const renderUnassignedTree = (goal: Goal, depth = 0): React.ReactNode => {
    if (!hasUnassignedGoalInTree(goal.id)) {
      return null;
    }

    const children = getGoalChildren(goalsByParentId, goal.id).filter((child) =>
      hasUnassignedGoalInTree(child.id)
    );
    const isExpanded = expandedGoalIds.has(goal.id);
    const isSelected = selectedGoalIds.includes(goal.id);
    const relatedKpis = getGoalKpis(kpis, goal.id);
    const relatedActions = getGoalActions(actions, goal.id);
    const isActiveAssignCard = activeAssignGoalId === goal.id;

    return (
      <div key={goal.id} className="space-y-3">
        <div
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                onClick={() => toggleGoalSelection(goal.id)}
                className="shrink-0"
              >
                {renderSelectionBox(isSelected)}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAssignGoalId((current) =>
                    current === goal.id ? null : goal.id
                  );
                  setInlineAssignee((current) => current || assignee);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                    {getGoalLevelLabel(goal, t)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    {goal.responsibleUnit}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                    {t('Unassigned')}
                  </span>
                </div>

                <div className="text-base font-semibold text-slate-900">{goal.title}</div>
                <p className="mt-1 text-sm text-slate-600">{goal.description}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 px-2.5 py-1">
                    {children.length} {t('Sub Goals')}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1">
                    {relatedKpis.length} {t('KPIs')}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1">
                    {relatedActions.length} {t('Action Plans')}
                  </span>
                </div>
              </button>
            </div>

            {children.length > 0 && (
              <button
                type="button"
                onClick={() => toggleExpanded(goal.id)}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {isExpanded ? t('Hide Children') : t('Show Children')}
              </button>
            )}
          </div>

          {renderRelatedItems(relatedKpis, relatedActions)}

          {isActiveAssignCard && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-3 text-sm font-medium text-blue-900">
                {t('Assign This Goal')}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  list="unassigned-goal-inline-assignees"
                  value={inlineAssignee}
                  onChange={(event) => setInlineAssignee(event.target.value)}
                  placeholder={t('Assigned To')}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
                <datalist id="unassigned-goal-inline-assignees">
                  {viewerAccounts.map((account) => (
                    <option key={account.id} value={account.name}>
                      {account.unit
                        ? `${account.name} - ${account.unit}`
                        : account.name}
                    </option>
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => handleAssignSingleGoal(goal.id)}
                  disabled={isReadOnly || assigningGoalId === goal.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {assigningGoalId === goal.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {assigningGoalId === goal.id ? t('Saving...') : t('Assign')}
                </button>
              </div>
            </div>
          )}
        </div>

        {isExpanded &&
          children.map((child) => renderUnassignedTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          {infoMessage}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2>{t('Unassigned Goals')}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t('Copied goals stay here until an admin assigns them manually.')}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium">{t('Current Period')} </span>
            {formatAcademicYearRange(selectedAcademicYearStart)}
          </div>
        </div>
      </div>

      {showSourceItems && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                <Copy className="h-4 w-4" />
                <span>{t('Previous Year Items')}</span>
              </div>
              <p className="text-sm text-slate-600">
                {formatAcademicYearRange(copySourceYearStart)}
              </p>
              <p className="text-sm text-slate-600">
                {t('Select the items you want to carry into the new year.')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadSourceYearData()}
              disabled={isReadOnly || isLoadingSourceGoals}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isLoadingSourceGoals && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('Refresh')}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {isLoadingSourceGoals && !hasLoadedSourceGoals ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                {t('Loading goals...')}
              </div>
            ) : sourceRootGoals.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {t('No main goals were found for this source year.')}
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        {selectedCopyGoalIds.length} {t('Items Selected')}
                      </div>
                      <div className="mt-1 text-sm text-blue-800">
                        {t('Select the items you want to carry into the new year.')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySelected}
                      disabled={isCopying || selectedCopyGoalIds.length === 0}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed lg:w-auto"
                      style={{
                        backgroundColor:
                          isCopying || selectedCopyGoalIds.length === 0
                            ? '#9fb4d8'
                            : '#002776',
                      }}
                    >
                      {isCopying && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isCopying ? t('Copying...') : t('Copy Selected Items')}
                    </button>
                  </div>
                </div>

                <div className="max-h-[65vh] space-y-4 overflow-auto pr-2">
                  {sourceRootGoals.map((goal) => renderSourceTree(goal))}
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-700">
                    {selectedCopyGoalIds.length} {t('Items Selected')}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySelected}
                    disabled={isCopying || selectedCopyGoalIds.length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed lg:w-auto"
                    style={{
                      backgroundColor:
                        isCopying || selectedCopyGoalIds.length === 0
                          ? '#9fb4d8'
                          : '#002776',
                    }}
                  >
                    {isCopying && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCopying ? t('Copying...') : t('Copy Selected Items')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedGoalIds.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3>{t('Assign Selected Goals')}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {t('Select one or more copied items and assign the whole tree to one person.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                list="unassigned-goal-assignees"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder={t('Assigned To')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                disabled={isReadOnly}
              />
              <datalist id="unassigned-goal-assignees">
                {viewerAccounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.unit ? `${account.name} - ${account.unit}` : account.name}
                  </option>
                ))}
              </datalist>
              <button
                type="button"
                onClick={handleAssignSelected}
                disabled={isReadOnly || isAssigning}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isAssigning ? t('Saving...') : t('Assign Selected')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          {t('Loading goals...')}
        </div>
      ) : unassignedRootGoals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <p>{t('No unassigned goals exist for this year yet.')}</p>
          <p className="mt-2 text-sm">
            {t('Future years stay empty until you copy items into them here.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {unassignedRootGoals.map((goal) => renderUnassignedTree(goal))}
        </div>
      )}
    </div>
  );
}
