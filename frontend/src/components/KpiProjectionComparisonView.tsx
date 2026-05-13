import { useEffect, useMemo, useState } from 'react';
import { KPI, UserRole } from '../types';
import { fetchKPIs } from '../lib/api';
import { formatAcademicYearRange } from '../utils/academicPeriod';
import { isViewerRole } from '../lib/access';
import { ChevronDown } from 'lucide-react';

/** How many forecast-year rows to keep visible in the matrix (FIFO) */
const FIFO_LIMIT = 3;

interface KpiProjectionComparisonViewProps {
  userRole: UserRole;
  userName: string;
  userUnit?: string;
  selectedAcademicYearStart: number;
}

interface ProjectionGroup {
  lineageKey: string;
  name: string;
  responsibleUnit: string;
  /** All entries for this KPI lineage, sorted ascending by academicYearStart */
  entries: KPI[];
}

function toNumber(value?: string): number | null {
  if (!value) return null;
  const n = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isFinite(n) ? n : null;
}

function fmtVariance(v: number): string {
  const abs = Math.abs(v);
  const str = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return (v > 0 ? '+' : v < 0 ? '-' : '') + str;
}

export function KpiProjectionComparisonView({
  userRole,
  userName,
  userUnit,
  selectedAcademicYearStart,
}: KpiProjectionComparisonViewProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLineageKey, setSelectedLineageKey] = useState('');
  const isViewer = isViewerRole(userRole);

  /* —— fetch —— */
  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError(null);
    fetchKPIs()
      .then((data) => { if (alive) { setKpis(data); setIsLoading(false); } })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Failed to load KPI data');
          setIsLoading(false);
        }
      });
    return () => { alive = false; };
  }, []);

  /* —— scope KPIs by role —— */
  const scopedKpis = useMemo(() => {
    const sorted = [...kpis].sort((a, b) => a.academicYearStart - b.academicYearStart);
    if (isViewer) return sorted.filter((k) => k.assignedTo === userName);
    if (userUnit) return sorted.filter((k) => k.responsibleUnit === userUnit);
    return sorted;
  }, [isViewer, kpis, userName, userUnit]);

  /* —— group by lineageKey —— */
  const groups = useMemo<ProjectionGroup[]>(() => {
    const map = new Map<string, ProjectionGroup>();
    for (const kpi of scopedKpis) {
      const key = kpi.lineageKey || kpi.id;
      const g = map.get(key);
      if (g) {
        g.entries.push(kpi);
        if (kpi.academicYearStart >= selectedAcademicYearStart) {
          g.name = kpi.name;
          g.responsibleUnit = kpi.responsibleUnit;
        }
      } else {
        map.set(key, {
          lineageKey: key,
          name: kpi.name,
          responsibleUnit: kpi.responsibleUnit,
          entries: [kpi],
        });
      }
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        entries: g.entries.sort((a, b) => a.academicYearStart - b.academicYearStart),
      }))
      .filter((g) => g.entries.some((e) => e.projectionValues?.some((v) => v)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scopedKpis, selectedAcademicYearStart]);

  /* —— auto-select first group —— */
  useEffect(() => {
    if (groups.length === 0) { setSelectedLineageKey(''); return; }
    if (!groups.some((g) => g.lineageKey === selectedLineageKey)) {
      setSelectedLineageKey(groups[0].lineageKey);
    }
  }, [groups, selectedLineageKey]);

  const selectedGroup = groups.find((g) => g.lineageKey === selectedLineageKey) ?? null;

  /* —— build matrix —— */
  const matrix = useMemo(() => {
    if (!selectedGroup) return null;

    const allEntries = selectedGroup.entries;

    /* entries that actually have projection data */
    const withProjections = allEntries.filter((e) =>
      e.projectionValues?.some((v) => v),
    );
    const totalForecastYears = withProjections.length;

    /* FIFO: keep only the last FIFO_LIMIT forecast years */
    const forecastRows = withProjections.slice(-FIFO_LIMIT).map((entry) => {
      const cells = new Map<number, string>();
      (entry.projectionValues ?? []).forEach((val, i) => {
        if (val) cells.set(entry.academicYearStart + i, val);
      });
      return { sourceYear: entry.academicYearStart, cells };
    });

    /* all target years covered by active forecast rows */
    const targetYearSet = new Set<number>();
    for (const row of forecastRows) {
      for (const y of row.cells.keys()) targetYearSet.add(y);
    }

    /* also pull in years that have actuals and fall within the forecast range */
    if (targetYearSet.size > 0) {
      const minY = Math.min(...targetYearSet);
      const maxY = Math.max(...targetYearSet);
      for (const e of allEntries) {
        if (e.resultValue && e.academicYearStart >= minY && e.academicYearStart <= maxY) {
          targetYearSet.add(e.academicYearStart);
        }
      }
    }

    const targetYears = [...targetYearSet].sort((a, b) => a - b);

    /* actuals map */
    const actualsMap = new Map<number, string>();
    for (const e of allEntries) {
      if (e.resultValue) actualsMap.set(e.academicYearStart, e.resultValue);
    }

    /* latest forecast for each target year */
    const latestForecastMap = new Map<number, { value: string; sourceYear: number }>();
    for (const row of forecastRows) {
      for (const [ty, val] of row.cells) {
        const ex = latestForecastMap.get(ty);
        if (!ex || row.sourceYear > ex.sourceYear) {
          latestForecastMap.set(ty, { value: val, sourceYear: row.sourceYear });
        }
      }
    }

    const comparableCount = targetYears.filter(
      (y) => actualsMap.has(y) && latestForecastMap.has(y),
    ).length;

    return {
      forecastRows,
      targetYears,
      actualsMap,
      latestForecastMap,
      totalForecastYears,
      comparableCount,
    };
  }, [selectedGroup]);

  /* —— render —— */
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500">Projeksiyon verileri yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Projeksiyon Karşılaştırması</h2>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          KPI Seç
        </label>
        {groups.length === 0 ? (
          <p className="text-sm text-slate-400">
            Henüz projeksiyon verisi girilmiş KPI bulunamadı.
          </p>
        ) : (
          <div className="relative">
            <select
              value={selectedLineageKey}
              onChange={(e) => setSelectedLineageKey(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            >
              {groups.map((g) => (
                <option key={g.lineageKey} value={g.lineageKey}>
                  {g.name} → {g.responsibleUnit}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        )}
      </div>

      {/* Stats + matrix */}
      {matrix && selectedGroup && (
        <>
          {/* Stat chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Toplam Tahmin Yılı', value: matrix.totalForecastYears },
              { label: 'Gösterilen', value: matrix.forecastRows.length },
              { label: 'Gerçekleşen Yıl', value: matrix.actualsMap.size },
              { label: 'Karşılaştırma Yapılabilen', value: matrix.comparableCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] text-slate-500">{label}</div>
                <div className="mt-0.5 text-2xl font-semibold text-slate-900">{value}</div>
              </div>
            ))}

            {matrix.totalForecastYears > FIFO_LIMIT && (
              <div className="flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="text-xs text-amber-700">
                  {matrix.totalForecastYears - FIFO_LIMIT} eski tahmin yılı gizlendi
                </span>
              </div>
            )}
          </div>

          {/* Matrix table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-800">{selectedGroup.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{selectedGroup.responsibleUnit}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-max w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="sticky left-0 z-10 bg-slate-50 min-w-[200px] whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Tahmin Kaynağı
                    </th>
                    {matrix.targetYears.map((y) => (
                      <th
                        key={y}
                        className="min-w-[96px] whitespace-nowrap px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {formatAcademicYearRange(y)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* Forecast rows */}
                  {matrix.forecastRows.map((row, idx) => (
                    <tr key={row.sourceYear} className="group hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 bg-white px-5 py-3.5 text-xs font-semibold text-slate-700 whitespace-nowrap group-hover:bg-slate-50/60">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                            {idx + 1}
                          </span>
                          {formatAcademicYearRange(row.sourceYear)} tahmini
                        </div>
                      </td>
                      {matrix.targetYears.map((targetYear) => {
                        const value = row.cells.get(targetYear);
                        const isDiagonal = targetYear === row.sourceYear;
                        const hasActual = matrix.actualsMap.has(targetYear);
                        return (
                          <td
                            key={targetYear}
                            className={[
                              'px-4 py-3.5 text-center tabular-nums',
                              isDiagonal ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-700',
                              hasActual && value ? 'opacity-60' : '',
                            ].filter(Boolean).join(' ')}
                          >
                            {value ?? <span className="text-slate-200">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Actual results row */}
                  <tr className="border-t-2 border-slate-300 bg-slate-50">
                    <td className="sticky left-0 z-10 bg-slate-50 px-5 py-3.5 text-xs font-semibold text-slate-800 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Gerçekleşen
                      </span>
                    </td>
                    {matrix.targetYears.map((targetYear) => {
                      const actual = matrix.actualsMap.get(targetYear);
                      const latestFc = matrix.latestForecastMap.get(targetYear);
                      let variance: number | null = null;
                      if (actual && latestFc) {
                        const a = toNumber(actual);
                        const f = toNumber(latestFc.value);
                        if (a != null && f != null) variance = a - f;
                      }
                      return (
                        <td key={targetYear} className="px-4 py-3.5 text-center">
                          {actual ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="font-semibold tabular-nums text-slate-900">{actual}</span>
                              {variance != null && (
                                <span
                                  className={[
                                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                    variance > 0
                                      ? 'bg-green-100 text-green-700'
                                      : variance < 0
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-100 text-slate-600',
                                  ].join(' ')}
                                >
                                  {fmtVariance(variance)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-sm text-slate-400">
          Henüz projeksiyon verisi girilmiş KPI yok.
          Goal Hierarchy&apos;den bir KPI için &quot;Projection&quot; ekleyin.
        </div>
      )}
    </div>
  );
}
