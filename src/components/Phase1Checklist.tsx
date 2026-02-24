import { CheckCircle } from 'lucide-react';

export function Phase1Checklist() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h3 className="mb-4 text-green-900">✅ Phase 1 Done Checklist</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>All "Year" labels changed to "Academic Year Range"</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Academic Year dropdown uses "YYYY-YY" format everywhere</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>At least 2 example years visible in dropdown (e.g., 2025-26, 2026-27)</span>
        </div>
      </div>
    </div>
  );
}
