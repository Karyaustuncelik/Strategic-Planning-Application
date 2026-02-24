import { useState } from 'react';
import { mockAuditLogs } from '../data/mockData';
import { AuditLog } from '../types';
import { FileEdit, Filter, Search } from 'lucide-react';

export function AuditTrailView() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    if (filterEntityType !== 'all' && log.entityType !== filterEntityType) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (searchTerm && !log.user.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.changes.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Updated':
        return 'bg-blue-100 text-blue-700';
      case 'Created':
        return 'bg-green-100 text-green-700';
      case 'Deleted':
        return 'bg-red-100 text-red-700';
      case 'Requested Revision':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'Goal':
        return 'bg-purple-100 text-purple-700';
      case 'KPI':
        return 'bg-green-100 text-green-700';
      case 'Action Plan':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Audit Trail</h2>
        <p className="text-gray-600">Complete history of all changes and updates</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user or changes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Entity Type
            </label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Goal">Goal</option>
              <option value="KPI">KPI</option>
              <option value="Action Plan">Action Plan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="Updated">Updated</option>
              <option value="Created">Created</option>
              <option value="Deleted">Deleted</option>
              <option value="Requested Revision">Requested Revision</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileEdit className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-900">
              <span>Audit Trail Benefits:</span> This log maintains a complete history of all changes made to goals, KPIs, and action plans. 
              It helps track who made changes, when they were made, and what was modified, ensuring transparency and accountability.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <div key={log.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${getEntityColor(log.entityType)}`}>
                  {log.entityType}
                </span>
                <span className="text-sm text-gray-600">ID: {log.entityId}</span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">User:</span>
                <div className="mt-1">{log.user}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Changes:</span>
                <div className="mt-1 text-gray-700">{log.changes}</div>
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">No audit log entries found matching the selected filters.</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="mb-4">Audit Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl mb-1">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Changes</div>
          </div>
          <div>
            <div className="text-2xl mb-1">
              {new Set(logs.map(l => l.user)).size}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div>
            <div className="text-2xl mb-1">
              {logs.filter(l => l.action === 'Updated').length}
            </div>
            <div className="text-sm text-gray-600">Updates</div>
          </div>
          <div>
            <div className="text-2xl mb-1">
              {logs.filter(l => {
                const date = new Date(l.timestamp);
                const today = new Date();
                return date.toDateString() === today.toDateString();
              }).length}
            </div>
            <div className="text-sm text-gray-600">Changes Today</div>
          </div>
        </div>
      </div>
    </div>
  );
}
