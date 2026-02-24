import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { normalizeAcademicYearRange, parseAcademicYearRange } from '../utils/academicPeriod';

interface AcademicCalendarEditorProps {
  academicYears: string[];
  selectedYearRange: string;
  currentYearRange: string;
  onAddYear: (yearRange: string) => void;
  onRemoveYear: (yearRange: string) => void;
  onBack: () => void;
}

export function AcademicCalendarEditor({
  academicYears,
  selectedYearRange,
  currentYearRange,
  onAddYear,
  onRemoveYear,
  onBack,
}: AcademicCalendarEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const sortedYears = useMemo(() => {
    return [...academicYears].sort(
      (a, b) => parseAcademicYearRange(a) - parseAcademicYearRange(b)
    );
  }, [academicYears]);

  const canRemove = academicYears.length > 1;

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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2>Academic Calendar</h2>
              <p className="text-gray-600">
                Manage the academic year list shown in the selector.
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

        <div className="p-6 space-y-6">
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
        </div>
      </div>
    </div>
  );
}
