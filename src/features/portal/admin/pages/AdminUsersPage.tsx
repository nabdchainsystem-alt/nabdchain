import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import {
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  Eye,
  UserCircle,
  ShieldCheck,
  ShieldSlash,
  Key,
  X,
  Check,
  Warning,
  Spinner,
  ArrowLeft,
  ArrowRight,
  Funnel,
} from 'phosphor-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Select from '@radix-ui/react-select';
import { portalAdminService, PortalUser } from '../../services/portalAdminService';

interface AdminUsersPageProps {
  onNavigate?: (page: string) => void;
}

const columnHelper = createColumnHelper<PortalUser>();

type RoleType = 'buyer' | 'seller' | 'admin' | 'staff';
type StatusType = 'active' | 'suspended';

const roleColors: Record<RoleType, string> = {
  buyer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  seller: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  staff: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const statusColors: Record<StatusType, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const AdminUsersPage: React.FC<AdminUsersPageProps> = () => {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([]);

  // Selected user for drawer
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await portalAdminService.listUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: sorting[0]?.id || 'createdAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      });

      setUsers(result.users);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, sorting]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: RoleType) => {
    setActionLoading(true);
    setActionMessage(null);

    try {
      const updatedUser = await portalAdminService.updateUser(userId, { portalRole: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      if (selectedUser?.id === userId) {
        setSelectedUser(updatedUser);
      }
      setActionMessage({ type: 'success', text: 'Role updated successfully' });
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update role' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (userId: string, currentStatus: StatusType) => {
    const newStatus: StatusType = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(true);
    setActionMessage(null);

    try {
      const updatedUser = await portalAdminService.updateUser(userId, { portalStatus: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      if (selectedUser?.id === userId) {
        setSelectedUser(updatedUser);
      }
      setActionMessage({
        type: 'success',
        text: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`,
      });
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (userId: string) => {
    setActionLoading(true);
    setActionMessage(null);
    setTempPassword(null);

    try {
      const result = await portalAdminService.resetUserPassword(userId);
      setTempPassword(result.tempPassword);
      setActionMessage({ type: 'success', text: 'Password reset successfully' });
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reset password' });
    } finally {
      setActionLoading(false);
    }
  };

  // View user details
  const handleViewUser = async (user: PortalUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
    setTempPassword(null);
    setActionMessage(null);
  };

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
              <UserCircle size={20} className="text-zinc-500" />
            </div>
            <div>
              <div className="font-medium text-zinc-900 dark:text-white">{info.getValue() || 'No name'}</div>
              <div className="text-sm text-zinc-500">{info.row.original.email}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'Phone',
        cell: (info) => <span className="text-zinc-600 dark:text-zinc-400">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('portalRole', {
        header: 'Role',
        cell: (info) => {
          const role = info.getValue() as RoleType | null;
          if (!role) return '-';
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[role]}`}>{role}</span>
          );
        },
      }),
      columnHelper.accessor('portalStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as StatusType;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[status]}`}>
              {status}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => {
          const date = new Date(info.getValue());
          return <span className="text-zinc-600 dark:text-zinc-400 text-sm">{date.toLocaleDateString()}</span>;
        },
      }),
      columnHelper.accessor('lastActiveAt', {
        header: 'Last Active',
        cell: (info) => {
          const date = info.getValue();
          if (!date) return <span className="text-zinc-400">Never</span>;
          return (
            <span className="text-zinc-600 dark:text-zinc-400 text-sm">{new Date(date).toLocaleDateString()}</span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Eye size={18} className="text-zinc-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-1 z-50"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
                  onClick={() => handleViewUser(info.row.original)}
                >
                  <Eye size={16} />
                  View Details
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
                  onClick={() => handleStatusToggle(info.row.original.id, info.row.original.portalStatus as StatusType)}
                >
                  {info.row.original.portalStatus === 'active' ? (
                    <>
                      <ShieldSlash size={16} />
                      Suspend
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Activate
                    </>
                  )}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer outline-none"
                  onClick={() => handlePasswordReset(info.row.original.id)}
                >
                  <Key size={16} />
                  Reset Password
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Portal Users</h1>
        <p className="text-zinc-500 mt-1">Manage marketplace portal users and their access</p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {actionMessage.type === 'success' ? <Check size={18} /> : <Warning size={18} />}
          {actionMessage.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Filter */}
        <Select.Root value={roleFilter} onValueChange={setRoleFilter}>
          <Select.Trigger className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white min-w-[140px]">
            <Funnel size={16} className="text-zinc-400" />
            <Select.Value placeholder="All Roles" />
            <CaretDown size={14} className="text-zinc-400 ml-auto" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
              <Select.Viewport>
                <Select.Item
                  value="all"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>All Roles</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="buyer"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>Buyer</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="seller"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>Seller</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="admin"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>Admin</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="staff"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>Staff</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Status Filter */}
        <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
          <Select.Trigger className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white min-w-[140px]">
            <Select.Value placeholder="All Status" />
            <CaretDown size={14} className="text-zinc-400 ml-auto" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
              <Select.Viewport>
                <Select.Item
                  value="all"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>All Status</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="active"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>Active</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="suspended"
                  className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                >
                  <Select.ItemText>Suspended</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={32} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <Warning size={48} className="mb-2" />
            <p>{error}</p>
            <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <UserCircle size={48} className="mb-2" />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-700">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <CaretUp size={14} />,
                              desc: <CaretDown size={14} />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Detail Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">User Details</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <UserCircle size={40} className="text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-zinc-900 dark:text-white">
                    {selectedUser.name || 'No name'}
                  </h3>
                  <p className="text-zinc-500">{selectedUser.email}</p>
                </div>
              </div>

              {/* Action Message */}
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}
                >
                  {actionMessage.type === 'success' ? <Check size={18} /> : <Warning size={18} />}
                  {actionMessage.text}
                </div>
              )}

              {/* Temp Password */}
              {tempPassword && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                    Temporary Password (share securely):
                  </p>
                  <code className="block p-2 bg-white dark:bg-zinc-800 rounded text-amber-800 dark:text-amber-300 font-mono">
                    {tempPassword}
                  </code>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <label className="text-sm text-zinc-500">Phone</label>
                  <p className="text-zinc-900 dark:text-white mt-1">{selectedUser.phoneNumber || 'Not provided'}</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <label className="text-sm text-zinc-500">Company</label>
                  <p className="text-zinc-900 dark:text-white mt-1">
                    {selectedUser.companyName ||
                      selectedUser.buyerProfile?.companyName ||
                      selectedUser.sellerProfile?.displayName ||
                      'Not provided'}
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <label className="text-sm text-zinc-500">Email Verified</label>
                  <p className="text-zinc-900 dark:text-white mt-1">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <label className="text-sm text-zinc-500">Has Password</label>
                  <p className="text-zinc-900 dark:text-white mt-1">{selectedUser.hasPassword ? 'Yes' : 'No'}</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <label className="text-sm text-zinc-500">Created</label>
                  <p className="text-zinc-900 dark:text-white mt-1">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <label className="text-sm text-zinc-500">Last Active</label>
                  <p className="text-zinc-900 dark:text-white mt-1">
                    {selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Role Change */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <label className="text-sm text-zinc-500 block mb-2">Portal Role</label>
                <Select.Root
                  value={selectedUser.portalRole || ''}
                  onValueChange={(value) => handleRoleChange(selectedUser.id, value as RoleType)}
                  disabled={actionLoading}
                >
                  <Select.Trigger className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white">
                    <Select.Value />
                    <CaretDown size={14} className="text-zinc-400" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-[60]">
                      <Select.Viewport>
                        <Select.Item
                          value="buyer"
                          className="px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                        >
                          <Select.ItemText>Buyer</Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          value="seller"
                          className="px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                        >
                          <Select.ItemText>Seller</Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          value="admin"
                          className="px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                        >
                          <Select.ItemText>Admin</Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          value="staff"
                          className="px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer outline-none"
                        >
                          <Select.ItemText>Staff</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleStatusToggle(selectedUser.id, selectedUser.portalStatus as StatusType)}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedUser.portalStatus === 'active'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? (
                    <Spinner size={18} className="animate-spin" />
                  ) : selectedUser.portalStatus === 'active' ? (
                    <>
                      <ShieldSlash size={18} />
                      Suspend User
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Activate User
                    </>
                  )}
                </button>

                <button
                  onClick={() => handlePasswordReset(selectedUser.id)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Spinner size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Key size={18} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
