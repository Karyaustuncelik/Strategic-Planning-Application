import { useState } from 'react';
import { Copy, CheckCircle, X, ChevronRight, AlertCircle } from 'lucide-react';
import { generateAcademicYearRanges, formatAcademicYearRange, parseAcademicYearRange } from '../utils/academicPeriod';
import { Goal, KPI, ActionPlan, Milestone } from '../types';
import { mockGoals, mockKPIs, mockActionPlans, mockMilestones } from '../data/mockData';

interface CopyPeriodWizardProps {
  onClose: () => void;
  onComplete: (targetYear: number) => void;
}

export function CopyPeriodWizard({ onClose, onComplete }: CopyPeriodWizardProps) {
  const [step, setStep] = useState(1);
  const [sourceYearRange, setSourceYearRange] = useState('2025-26');
  const [targetYearRange, setTargetYearRange] = useState('2025-26');
  
  const [copyGoals, setCopyGoals] = useState(true);
  const [copySubGoals, setCopySubGoals] = useState(true);
  const [copyKPIs, setCopyKPIs] = useState(true);
  const [copyActionPlans, setCopyActionPlans] = useState(true);
  const [copyMilestones, setCopyMilestones] = useState(true);
  
  const [resetProgress, setResetProgress] = useState(true);
  const [resetStatuses, setResetStatuses] = useState(true);
  
  const [copying, setCopying] = useState(false);
  const [copyResult, setCopyResult] = useState<{ goals: number; subGoals: number; kpis: number; actions: number; milestones: number } | null>(null);

  const academicYears = generateAcademicYearRanges();

  const handleCopy = () => {
    setCopying(true);
    
    // Simulate copy process
    setTimeout(() => {
      const sourceYear = parseAcademicYearRange(sourceYearRange);
      const targetYear = parseAcademicYearRange(targetYearRange);
      
      // Filter source items
      const sourceGoals = mockGoals.filter(g => g.academicYearStart === sourceYear);
      
      const sourceKPIs = mockKPIs.filter(k => k.academicYearStart === sourceYear);
      
      const sourceActions = mockActionPlans.filter(a => a.academicYearStart === sourceYear);
      
      const sourceMilestones = mockMilestones.filter(m => {
        const goal = mockGoals.find(g => g.id === m.linkedId);
        return goal && goal.academicYearStart === sourceYear;
      });
      
      // Count what would be copied
      const result = {
        goals: copyGoals ? sourceGoals.filter(g => g.level === 0).length : 0,
        subGoals: copySubGoals ? sourceGoals.filter(g => g.level > 0).length : 0,
        kpis: copyKPIs ? sourceKPIs.length : 0,
        actions: copyActionPlans ? sourceActions.length : 0,
        milestones: copyMilestones ? sourceMilestones.length : 0
      };
      
      setCopyResult(result);
      setCopying(false);
      setStep(5);
    }, 1500);
  };

  const handleFinish = () => {
    const targetYear = parseAcademicYearRange(targetYearRange);
    onComplete(targetYear);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Copy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl">Copy from Previous Academic Period</h2>
              <p className="text-sm text-gray-600">Step {step} of 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Select Source Academic Period</h3>
                <p className="text-sm text-gray-600 mb-4">Choose the academic period you want to copy from</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Academic Year Range</label>
                    <select
                      value={sourceYearRange}
                      onChange={(e) => setSourceYearRange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {academicYears.slice(0, 10).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Selected Source:</span> {formatAcademicYearRange(parseAcademicYearRange(sourceYearRange))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Select Target Academic Period</h3>
                <p className="text-sm text-gray-600 mb-4">Choose the academic period you want to copy to</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Academic Year Range</label>
                    <select
                      value={targetYearRange}
                      onChange={(e) => setTargetYearRange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {academicYears.slice(0, 10).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Copying from:</span> {formatAcademicYearRange(parseAcademicYearRange(sourceYearRange))}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Copying to:</span> {formatAcademicYearRange(parseAcademicYearRange(targetYearRange))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Select Copy Scope</h3>
                <p className="text-sm text-gray-600 mb-4">Choose what to copy from the source period</p>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyGoals}
                      onChange={(e) => setCopyGoals(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Copy Goals</div>
                      <div className="text-xs text-gray-600">All main goals (level 0)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copySubGoals}
                      onChange={(e) => setCopySubGoals(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Copy SubGoals</div>
                      <div className="text-xs text-gray-600">All sub-goals and sub-items</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyKPIs}
                      onChange={(e) => setCopyKPIs(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Copy KPIs</div>
                      <div className="text-xs text-gray-600">Key Performance Indicators</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyActionPlans}
                      onChange={(e) => setCopyActionPlans(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Copy Action Plans</div>
                      <div className="text-xs text-gray-600">All action plans linked to goals</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={copyMilestones}
                      onChange={(e) => setCopyMilestones(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Copy Milestones</div>
                      <div className="text-xs text-gray-600">All milestone checkpoints</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Reset Rules</h3>
                <p className="text-sm text-gray-600 mb-4">Configure how copied items should be initialized</p>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetProgress}
                      onChange={(e) => setResetProgress(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Reset progress to 0%</div>
                      <div className="text-xs text-gray-600">All progress bars will start at 0%</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetStatuses}
                      onChange={(e) => setResetStatuses(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Reset statuses to Not Started</div>
                      <div className="text-xs text-gray-600">All items will have status "Not Started"</div>
                    </div>
                  </label>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Note:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Titles and descriptions will be kept as-is</li>
                        <li>Start and end dates will be adjusted to match the target year boundaries</li>
                        <li>Assignments and ownership will be preserved</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="mb-2">Copy Completed Successfully!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Data has been copied from {formatAcademicYearRange(parseAcademicYearRange(sourceYearRange))} to {formatAcademicYearRange(parseAcademicYearRange(targetYearRange))}
                </p>

                <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
                  <h4 className="text-sm mb-3">Items Copied:</h4>
                  <div className="space-y-2 text-sm">
                    {copyResult && (
                      <>
                        {copyResult.goals > 0 && (
                          <div className="flex justify-between">
                            <span>Goals:</span>
                            <span className="font-medium">{copyResult.goals}</span>
                          </div>
                        )}
                        {copyResult.subGoals > 0 && (
                          <div className="flex justify-between">
                            <span>SubGoals:</span>
                            <span className="font-medium">{copyResult.subGoals}</span>
                          </div>
                        )}
                        {copyResult.kpis > 0 && (
                          <div className="flex justify-between">
                            <span>KPIs:</span>
                            <span className="font-medium">{copyResult.kpis}</span>
                          </div>
                        )}
                        {copyResult.actions > 0 && (
                          <div className="flex justify-between">
                            <span>Action Plans:</span>
                            <span className="font-medium">{copyResult.actions}</span>
                          </div>
                        )}
                        {copyResult.milestones > 0 && (
                          <div className="flex justify-between">
                            <span>Milestones:</span>
                            <span className="font-medium">{copyResult.milestones}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 my-2 pt-2">
                          <div className="flex justify-between font-medium">
                            <span>Total Items:</span>
                            <span>{copyResult.goals + copyResult.subGoals + copyResult.kpis + copyResult.actions + copyResult.milestones}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {step === 5 ? 'Close' : 'Cancel'}
          </button>
          
          <div className="flex gap-3">
            {step > 1 && step < 5 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            
            {step === 4 && (
              <button
                onClick={handleCopy}
                disabled={copying}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {copying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Start Copy
                  </>
                )}
              </button>
            )}
            
            {step === 5 && (
              <button
                onClick={handleFinish}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                View Copied Goals
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

