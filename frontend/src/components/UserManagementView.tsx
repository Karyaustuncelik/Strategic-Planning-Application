import { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import type { AuthorizedUser, UserRole } from '../types';
import { fetchUsers, createUser, updateUser, deleteUser } from '../lib/api';
import { useI18n } from '../i18n';
import { Input } from './ui/input';

const ALL_ROLES: UserRole[] = ['Strategy Office', 'Unit Manager', 'Senior Management', 'Viewer'];

const ROLE_COLORS: Record<UserRole, { bg: string; color: string }> = {
  'Strategy Office':  { bg: '#eff6ff', color: '#1d4ed8' },
  'Unit Manager':     { bg: '#f0fdf4', color: '#15803d' },
  'Senior Management':{ bg: '#fdf4ff', color: '#7e22ce' },
  'Viewer':           { bg: '#f1f5f9', color: '#475569' },
};

interface FormState {
  email: string;
  fullName: string;
  role: UserRole;
}

const emptyForm = (): FormState => ({ email: '', fullName: '', role: 'Viewer' });

interface UserManagementViewProps {
  currentUserRole: UserRole;
}

export function UserManagementView({ currentUserRole }: UserManagementViewProps) {
  const { t, language } = useI18n();
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';

  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AuthorizedUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AuthorizedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError(null);
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (user: AuthorizedUser) => {
    setEditTarget(user);
    setForm({ email: user.email, fullName: user.fullName, role: user.role });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  const handleSave = async () => {
    setFormError(null);
    if (!form.fullName.trim()) { setFormError(t('Full name is required')); return; }
    if (!editTarget && !form.email.trim()) { setFormError(t('Email is required')); return; }
    setIsSaving(true);
    try {
      if (editTarget) {
        await updateUser(editTarget.id, { fullName: form.fullName, role: form.role });
      } else {
        await createUser({ email: form.email, fullName: form.fullName, role: form.role });
      }
      closeForm();
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (currentUserRole !== 'Strategy Office') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <p className="text-gray-500">{t('You do not have permission to view this page.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('User Management')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('Manage who can access this application via SSO')}</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: '#15345c', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          {t('Add User')}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder={t('Search by name or email...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">{t('Loading...')}</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Users style={{ width: 32, height: 32, margin: '0 auto 12px', color: '#cbd5e1' }} />
            <p>{search ? t('No users match your search.') : t('No authorized users yet. Add one to get started.')}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {[t('Full Name'), t('Email'), t('Role'), t('Added'), ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS['Viewer'];
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                      {user.fullName}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: roleStyle.bg, color: roleStyle.color }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(user.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEdit(user)}
                          title={t('Edit')}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#475569' }}
                        >
                          <Pencil style={{ width: 13, height: 13 }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          title={t('Delete')}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 20px 48px -8px rgba(0,0,0,0.2)', width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editTarget ? t('Edit User') : t('Add New User')}
              </h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email — readonly when editing */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>{t('Email')}</label>
                {editTarget ? (
                  <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                    {editTarget.email}
                  </div>
                ) : (
                  <Input
                    type="email"
                    placeholder="user@sabanciuniv.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                )}
              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>{t('Full Name')}</label>
                <Input
                  placeholder={t('e.g. Dr. Sarah Johnson')}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              {/* Role */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>{t('Role')}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none' }}
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{formError}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={closeForm} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>
                {t('Cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', background: isSaving ? '#94a3b8' : '#15345c', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isSaving ? t('Saving...') : editTarget ? t('Save Changes') : t('Add User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 20px 48px -8px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{t('Remove User')}</h3>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '4px' }}>
              {t('Are you sure you want to remove')} <strong style={{ color: '#1e293b' }}>{deleteTarget.fullName}</strong>?
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              {deleteTarget.email}
            </p>
            <p style={{ fontSize: '13px', color: '#f97316', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px', marginBottom: '24px' }}>
              {t('They will lose access to the application immediately.')}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>
                {t('Cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', background: isDeleting ? '#94a3b8' : '#dc2626', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer' }}
              >
                {isDeleting ? t('Removing...') : t('Remove User')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
