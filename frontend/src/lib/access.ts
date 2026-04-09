import type { UserRole } from '../types';

export function isAdminRole(role: UserRole) {
  return role === 'Strategy Office';
}

export function isViewerRole(role: UserRole) {
  return role === 'Viewer';
}
