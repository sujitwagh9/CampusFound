import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Trash2, Download, Search, Users, ShieldCheck } from 'lucide-react';
import { fetchAllUsers, deleteUser, updateUserRole } from '../api/userApi.js';
import { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import Select from '../components/ui/Select.jsx';
import { RowSkeleton } from '../components/ui/Skeleton.jsx';
import { confirmAction } from '../lib/dialogs.js';
import { formatDate } from '../lib/format.js';
import { ease, fadeUp, stagger } from '../lib/motion.js';

const csvCell = (value) => {
  const s = String(value ?? '');
  // Quote everything and neutralise formulas so the file is safe to open in Excel
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

const row = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease } },
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchAllUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(errorMessage(err, 'Failed to load users')))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!roleFilter || u.role === roleFilter) &&
        (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, roleFilter]);

  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleRoleChange = async (user, role) => {
    const ok = await confirmAction({
      title: role === 'admin' ? `Make ${user.username} an admin?` : `Remove admin rights from ${user.username}?`,
      text: role === 'admin' ? 'Admins can approve claims and manage all users and items.' : 'They will become a regular user.',
      confirmText: role === 'admin' ? 'Make admin' : 'Remove admin',
      danger: role === 'admin',
    });
    if (!ok) return;
    setBusyId(user._id);
    try {
      const res = await updateUserRole(user._id, role);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role } : u)));
      toast.success(res.message);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to change role'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const ok = await confirmAction({
      title: `Delete ${user.username}?`,
      text: `Their account and ${user.itemCount} reported item${user.itemCount === 1 ? '' : 's'} will be permanently deleted.`,
      confirmText: 'Delete user',
      danger: true,
    });
    if (!ok) return;
    setBusyId(user._id);
    try {
      await deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success(`${user.username} was deleted`);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete user'));
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Username', 'Email', 'Role', 'Items reported', 'Registered on'],
      ...visible.map((u) => [u.username, u.email, u.role, u.itemCount, formatDate(u.createdAt)]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
    // BOM so Excel detects UTF-8
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'campusfound_users.csv' });
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${visible.length} user${visible.length === 1 ? '' : 's'}`);
  };

  return (
    <motion.main variants={stagger(0.07)} initial="hidden" animate="show" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-accent-text">Admin</p>
          <h1 className="text-4xl font-bold">Users</h1>
          {!loading && (
            <p className="text-muted mt-1">
              {users.length} registered · {adminCount} admin{adminCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!visible.length}>
          Export CSV
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-60">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or email…"
            aria-label="Search users"
            className="field pl-10"
          />
        </div>
        <Segmented
          id="user-role-filter"
          label="Filter by role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: '', label: 'All' },
            { value: 'user', label: 'Users' },
            { value: 'admin', label: 'Admins' },
          ]}
        />
      </motion.div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Users} title="No users found" message={users.length ? 'Try a different search.' : 'Nobody has signed up yet.'} />
      ) : (
        <motion.div variants={fadeUp} className="card overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-surface-2 text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Items</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <motion.tbody variants={stagger(0.03)} initial="hidden" animate="show" className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {visible.map((u) => {
                    const isSelf = u._id === currentUser?.id;
                    const busy = busyId === u._id;
                    return (
                      <motion.tr key={u._id} layout variants={row} exit="exit" className="hover:bg-surface-2/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.username} size="sm" />
                            <div className="min-w-0">
                              <div className="font-semibold flex items-center gap-1.5">
                                {u.username}
                                {isSelf && <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-accent-soft text-accent-text">You</span>}
                              </div>
                              <div className="text-muted text-xs truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Select
                              aria-label={`Role for ${u.username}`}
                              value={u.role}
                              disabled={isSelf || busy}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="w-28"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </Select>
                            {u.role === 'admin' && <ShieldCheck size={16} className="text-accent-text" aria-label="Admin" />}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">{u.itemCount}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          {!isSelf && (
                            <Button variant="danger-ghost" size="sm" icon={Trash2} disabled={busy} onClick={() => handleDeleteUser(u)}>
                              Delete
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.main>
  );
}
