import { useState } from 'react';
import { UserRole } from '../types';
import { Building2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { name: string; role: UserRole; unit?: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Strategy Office');
  const [selectedUnit, setSelectedUnit] = useState('Research Department');

  const units = [
    'Research Department',
    'Academic Affairs',
    'IT Department',
    'External Relations',
    'Facilities Management',
    'Finance Department',
    'Human Resources'
  ];

  const handleLogin = () => {
    const name = selectedRole === 'Strategy Office' 
      ? 'Strategy Office Manager'
      : selectedRole === 'Senior Management'
      ? 'General Manager'
      : `${selectedUnit} Manager`;
    
    onLogin({
      name,
      role: selectedRole,
      unit: selectedRole === 'Unit Manager' ? selectedUnit : undefined
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-center">Strategic Planning Tracking System</h1>
          <p className="text-gray-600 text-center">Phase 1 Prototype</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Strategy Office">Strategy Office</option>
              <option value="Unit Manager">Unit Manager</option>
              <option value="Senior Management">Senior Management</option>
            </select>
          </div>

          {selectedRole === 'Unit Manager' && (
            <div>
              <label className="block text-gray-700 mb-2">
                Select Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login to System
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <span>Demo Mode:</span> This Phase 1 prototype uses synthetic data for testing and demonstration purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}