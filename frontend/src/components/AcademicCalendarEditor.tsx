import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import {
  normalizeAcademicYearRange,
  parseAcademicYearRange,
} from '../utils/academicPeriod';
import { fetchUnitOwners, upsertUnitOwner } from '../lib/api';
import { UnitOwner } from '../types';

interface AcademicCalendarEditorProps {
  academicYears: string[];
  selectedYearRange: string;
  currentYearRange: string;
  selectedAcademicYearStart: number;
  onAddYear: (yearRange: string) => void;
  onRemoveYear: (yearRange: string) => void;
  onBack: () => void;
}

const defaultUnits = [
  'Research Department',
  'Academic Affairs',
  'IT Department',
  'External Relations',
  'Facilities Management',
  'Finance Department',
  'Human Resources',
];

export function AcademicCalendarEditor({
  academicYears,
  selectedYearRange,
  currentYearRange,
  selectedAcademicYearStart,
  onAddYear,
  onRemoveYear,
  onBack,
}: AcademicCalendarEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [unitOwners, setUnitOwners] = useState<UnitOwner[]>([]);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [unitOwnerError, setUnitOwnerError] = useState<string | null>(null);
  const [savingUnit, setSavingUnit] = useState<string | null>(null);

  const sortedYears = useMemo(() => {
    return [...academicYears].sort(
      (a, b) => parseAcademicYearRange(a) - parseAcademicYearRange(b)
    );
  }, [academicYears]);

  const canRemove = academicYears.length > 1;

  useEffect(() => {
    let isMounted = true;

    const loadUnitOwners = async () => {
      setUnitOwnerError(null);

      try {
        const data = await fetchUnitOwners({
          academicYearStart: selectedAcademicYearStart,
        });
        if (!isMounted) return;

        setUnitOwners(data);
        setOwnerDrafts(
          data.reduce<Record<string, string>>((acc, item) => {
            acc[item.unitName] = item.ownerName;
            return acc;
          }, {})
        );
      } catch (loadError) {
        if (!isMounted) return;

        setUnitOwners([]);
        setOwnerDrafts({});
        setUnitOwnerError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load unit owners'
        );
      }
    };

    loadUnitOwners();

    return () => {
      isMounted = false;
    };
  }, [selectedAcademicYearStart]);

  const handleAddYear = () => {
    const normalized = normalizeAcademicYearRange(inputValue);
    if (!normalized) {
      setError('Use format 2025-26 (or 25-26).');
      return;
    }
    if (academicYears.includes(normalized)) {
      setError('This academic year is already listed.');
      return;
    }
    onAddYear(normalized);
    setInputValue('');
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleAddYear();
  };

  const mergedUnits = useMemo(() => {
    const unitSet = new Set(defaultUnits);
    for (const unitOwner of unitOwners) {
      unitSet.add(unitOwner.unitName);
    }
    return [...unitSet].sort((left, right) => left.localeCompare(right));
  }, [unitOwners]);

  const handleSaveUnitOwner = async (unitName: string) => {
    const ownerName = (ownerDrafts[unitName] ?? '').trim();
    if (!ownerName) {
      setUnitOwnerError('Unit owner name cannot be empty.');
      return;
    }

    setSavingUnit(unitName);
    setUnitOwnerError(null);

    try {
      const saved = await upsertUnitOwner({
        academicYearStart: selectedAcademicYearStart,
        unitName,
        ownerName,
        updatedBy: 'Strategy Office Admin',
      });

      setUnitOwners((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            item.academicYearStart === saved.academicYearStart &&
            item.unitName === saved.unitName
        );

        if (existingIndex === -1) {
          return [...prev, saved];
        }

        const next = [...prev];
        next[existingIndex] = saved;
        return next;
      });
    } catch (saveError) {
      setUnitOwnerError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save unit owner'
      );
    } finally {
      setSavingUnit(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2>Academic Calendar</h2>
              <p className="text-gray-600">
                Manage the academic year list and define unit owners for each year.
              </p>
            </div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm text-gray-700">
              Add academic year
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="2025-26"
                className="flex-1 min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs text-gray-500">
              Accepted formats: 2025-26, 2025-2026, or 25-26.
            </p>
          </form>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3>Available Years</h3>
              <span className="text-xs text-gray-500">
                {sortedYears.length} total
              </span>
            </div>

            {sortedYears.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                No academic years yet. Add one to get started.
              </div>
            )}

            <div className="space-y-2">
              {sortedYears.map((year) => {
                const isSelected = year === selectedYearRange;
                const isCurrent = year === currentYearRange;
                return (
                  <div
                    key={year}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{year}</span>
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Selected
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Current
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveYear(year)}
                      disabled={!canRemove}
                      className={`p-2 rounded-lg transition-colors ${
                        canRemove
                          ? 'text-red-600 hover:bg-red-100'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        canRemove
                          ? 'Remove academic year'
                          : 'At least one year is required'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h3>Unit Owners</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {selectedYearRange}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Goals and copied work can be assigned automatically to these owners.
              </p>
            </div>

            {unitOwnerError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {unitOwnerError}
              </div>
            )}

            <div className="space-y-3">
              {mergedUnits.map((unitName) => (
                <div
                  key={unitName}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{unitName}</div>
                  </div>
                  <input
                    type="text"
                    value={ownerDrafts[unitName] ?? ''}
                    onChange={(e) =>
                      setOwnerDrafts((prev) => ({
                        ...prev,
                        [unitName]: e.target.value,
                      }))
                    }
                    placeholder="Enter unit owner"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveUnitOwner(unitName)}
                    disabled={savingUnit === unitName}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    <Save className="w-4 h-4" />
                    {savingUnit === unitName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
