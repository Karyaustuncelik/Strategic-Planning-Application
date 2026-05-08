import { useEffect, useMemo, useState } from 'react';
import { BarChart2, ChevronDown, ChevronUp, FileText, Search } from 'lucide-react';
import { SubmissionLog, UserRole } from '../types';
import { fetchAllSubmissionLogs } from '../lib/api';
import { formatAcademicYearRange } from '../utils/academicPeriod';
import { useI18n } from '../i18n';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface AdminAuditLogsViewProps {
  userRole: UserRole;
  selectedAcademicYearStart: number;
  academicYearOptions: string[];
}

export function AdminAuditLogsView({
  userRole,
  selectedAcademicYearStart: _selectedAcademicYearStart,
  academicYearOptions: _academicYearOptions,
}: AdminAuditLogsViewProps) {
  const { t, language } = useI18n();
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  const [logs, setLogs] = useState<SubmissionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'kpi' | 'action_plan'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchAllSubmissionLogs()
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load logs'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (entityTypeFilter !== 'all' && log.entityType !== entityTypeFilter) return false;
      if (yearFilter !== 'all' && String(log.academicYearStart) !== yearFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = log.entityTitle.toLowerCase().includes(q);
        const matchesUser = (log.submittedBy ?? '').toLowerCase().includes(q);
        const matchesExtended = log.extendedBy.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUser && !matchesExtended) return false;
      }
      return true;
    });
  }, [logs, entityTypeFilter, yearFilter, search]);

  const uniqueYears = useMemo(() => {
    const years = new Set(logs.map((l) => String(l.academicYearStart)).filter(Boolean));
    return Array.from(years).sort();
  }, [logs]);

  const toggleExpanded = (id: string) =>
    setExpandedLogId((prev) => (prev === id ? null : id));

  if (userRole !== 'Strategy Office') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{t('Audit Log')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Submission history for all KPIs and Action Plans')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder={t('Search by title or user...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ minWidth: '170px' }}>
          <Select
            value={entityTypeFilter}
            onValueChange={(v: string) => setEntityTypeFilter(v as typeof entityTypeFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Entity Type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Types')}</SelectItem>
              <SelectItem value="kpi">{t('KPIs Only')}</SelectItem>
              <SelectItem value="action_plan">{t('Action Plans Only')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div style={{ minWidth: '150px' }}>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('Academic Year')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Years')}</SelectItem>
              {uniqueYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {formatAcademicYearRange(Number(y))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} {t('entries')}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">{t('Loading...')}</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">{t('No log entries found.')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Entity')}</TableHead>
                <TableHead>{t('Academic Year')}</TableHead>
                <TableHead>{t('Submitted By')}</TableHead>
                <TableHead>{t('Cycle Deadline')}</TableHead>
                <TableHead>{t('Logged At')}</TableHead>
                <TableHead style={{ width: '90px' }}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isResultLog = (log.logType ?? 'result') === 'result';
                const hasResult = !!log.resultData.resultValue;
                const hasProjections = log.projectionData.some(Boolean);

                return (
                  <>
                    <TableRow
                      key={log.id}
                      style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : undefined }}
                      onClick={() => toggleExpanded(log.id)}
                    >
                      {/* Entity */}
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              minWidth: '92px',
                              marginTop: '2px',
                              background: log.entityType === 'kpi' ? '#eff6ff' : '#f0fdf4',
                              color: log.entityType === 'kpi' ? '#1d4ed8' : '#15803d',
                            }}
                          >
                            {log.entityType === 'kpi' ? (
                              <BarChart2 style={{ width: 10, height: 10 }} />
                            ) : (
                              <FileText style={{ width: 10, height: 10 }} />
                            )}
                            {log.entityType === 'kpi' ? 'KPI' : 'Action Plan'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{log.entityTitle}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              {log.goalId && (
                                <span className="text-xs text-slate-400">{log.goalId}</span>
                              )}
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: isResultLog ? '#fef9c3' : '#ede9fe',
                                  color: isResultLog ? '#854d0e' : '#5b21b6',
                                }}
                              >
                                {isResultLog ? t('Result') : t('Projection')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Academic Year */}
                      <TableCell className="text-sm text-slate-600">
                        {log.academicYearStart ? formatAcademicYearRange(log.academicYearStart) : '—'}
                      </TableCell>

                      {/* Submitted By */}
                      <TableCell>
                        <div className="text-sm text-slate-800">{log.submittedBy || '—'}</div>
                        {log.extendedBy && log.extendedBy !== log.submittedBy && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {t('via')} {log.extendedBy}
                          </div>
                        )}
                      </TableCell>

                      {/* Cycle Deadline */}
                      <TableCell className="text-sm text-slate-600">
                        {log.cycleDeadline
                          ? new Date(log.cycleDeadline).toLocaleDateString(locale)
                          : '—'}
                      </TableCell>

                      {/* Logged At */}
                      <TableCell className="text-sm text-slate-500">
                        {new Date(log.loggedAt).toLocaleString(locale)}
                      </TableCell>

                      {/* Expand toggle */}
                      <TableCell>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: isExpanded ? '#f1f5f9' : '#ffffff',
                            color: '#475569',
                          }}
                        >
                          {isExpanded
                            ? <ChevronUp style={{ width: 12, height: 12 }} />
                            : <ChevronDown style={{ width: 12, height: 12 }} />}
                          {t('Details')}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Expanded sub-row */}
                    {isExpanded && (
                      <TableRow key={`${log.id}-detail`} style={{ background: '#f8fafc' }}>
                        <TableCell colSpan={6} style={{ padding: '0 0 16px 0', borderTop: 'none' }}>
                          <div
                            style={{
                              margin: '0 16px',
                              padding: '16px',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              display: 'grid',
                              gridTemplateColumns: '1fr',
                              gap: '16px',
                            }}
                          >
                            {/* Result log */}
                            {isResultLog && (
                              <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                  {t('Result')}
                                </p>
                                {hasResult ? (
                                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <div>
                                        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{t('Type')}</p>
                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', textTransform: 'capitalize' }}>
                                          {log.resultData.resultType ?? '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{t('Value')}</p>
                                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#15803d' }}>
                                          {log.resultData.resultValue}
                                          {log.resultData.resultType === 'percentage' ? '%' : log.resultData.resultType === 'currency' ? ' ₺' : ''}
                                        </p>
                                      </div>
                                      {log.resultData.resultUpdatedBy && (
                                        <div>
                                          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{t('Entered By')}</p>
                                          <p style={{ fontSize: '12px', color: '#334155' }}>{log.resultData.resultUpdatedBy}</p>
                                        </div>
                                      )}
                                      {log.resultData.resultUpdatedAt && (
                                        <div>
                                          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{t('Entered At')}</p>
                                          <p style={{ fontSize: '11px', color: '#475569' }}>
                                            {new Date(log.resultData.resultUpdatedAt).toLocaleString(locale)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                                    {t('No result was entered for this cycle.')}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Projection log */}
                            {!isResultLog && (
                              <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                  {t('Projections')}
                                </p>
                                {hasProjections ? (
                                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {log.projectionData.map((val, i) => (
                                        <div
                                          key={i}
                                          style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            minWidth: '56px', padding: '6px 10px',
                                            background: 'white', borderRadius: '8px',
                                            border: '1px solid #bfdbfe',
                                          }}
                                        >
                                          <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600, marginBottom: 2 }}>
                                            {t('Y')}{i + 1}
                                          </span>
                                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a5f' }}>
                                            {val || '—'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                                    {t('No projections were entered for this cycle.')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
