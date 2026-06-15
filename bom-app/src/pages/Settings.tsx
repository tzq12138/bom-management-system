import { useEffect, useState } from 'react';
import { Topbar } from '../components/Topbar';
import { ROLE_PERMISSIONS } from '../types';
import {
  createUser,
  deleteUser,
  getCurrentUser,
  getUsers,
  logout,
  updateUser,
  type User,
  type UserRole,
} from '../services/storage';

interface SettingsProps {
  onLogout: () => void;
  onBack?: () => void;
}

export function Settings({ onLogout, onBack }: SettingsProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'system'>('profile');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    async function loadUsersData() {
      setCurrentUser(getCurrentUser());
      setUsers(await getUsers());
    }

    void loadUsersData();
  }, []);

  async function reloadUsers() {
    setUsers(await getUsers());
  }

  async function handleUpdateProfile(data: Partial<User>) {
    if (!currentUser) return;
    const updated = await updateUser(currentUser.id, data);
    if (updated) {
      setCurrentUser(updated);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm('确定要删除这个用户吗？')) return;
    if (await deleteUser(id)) {
      await reloadUsers();
    } else {
      alert('不能删除自己');
    }
  }

  async function handleAddUser(data: { username: string; displayName: string; email: string; role: UserRole }) {
    await createUser(data);
    await reloadUsers();
    setShowAddUser(false);
  }

  async function handleEditUser(id: string, data: Partial<User>) {
    await updateUser(id, data);
    await reloadUsers();
    setEditingUser(null);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Topbar
        title="设置"
        onBack={onBack}
        showBack={!!onBack}
      />

      <main className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">设置</h1>
          <button
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                logout();
                onLogout();
              }
            }}
            className="px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            退出登录
          </button>
        </div>

        <div className="flex gap-1 bg-surface-container rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'profile', label: '个人资料', icon: 'person' },
            { id: 'users', label: '用户管理', icon: 'group', adminOnly: true },
            { id: 'system', label: '系统设置', icon: 'settings' },
          ].map(tab => {
            if (tab.adminOnly && currentUser?.role !== 'admin') return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'users' | 'system')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'profile' && currentUser && (
          <div className="bg-surface-container rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
                {currentUser.initials}
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentUser.displayName}</h2>
                <p className="text-on-surface-variant">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
                  {currentUser.role === 'admin' ? '管理员' : currentUser.role === 'editor' ? '编辑者' : '查看者'}
                </span>
              </div>
            </div>

            <ProfileForm
              user={currentUser}
              onSave={(data) => void handleUpdateProfile(data)}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">用户列表</h2>
              <button
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-80 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                添加用户
              </button>
            </div>

            <div className="bg-surface-container rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface text-left">
                  <tr className="text-sm text-on-surface-variant">
                    <th className="px-4 py-3 font-medium">用户</th>
                    <th className="px-4 py-3 font-medium">用户名</th>
                    <th className="px-4 py-3 font-medium">邮箱</th>
                    <th className="px-4 py-3 font-medium">角色</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-outline-variant/20 hover:bg-surface-container-low">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {user.initials}
                          </div>
                          <span className="font-medium">{user.displayName}</span>
                          {user.id === currentUser?.id && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-on-surface-variant">当前</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono text-sm">{user.username}</td>
                      <td className="px-4 py-3 text-on-surface-variant text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'admin' ? 'bg-primary/10 text-primary' :
                          user.role === 'editor' ? 'bg-secondary/10 text-secondary' :
                          'bg-surface text-on-surface-variant border border-outline-variant'
                        }`}>
                          {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑者' : '查看者'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 rounded hover:bg-surface text-on-surface-variant hover:text-primary"
                            title="编辑"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => void handleDeleteUser(user.id)}
                              className="p-1.5 rounded hover:bg-surface text-on-surface-variant hover:text-error"
                              title="删除"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-surface-container rounded-xl p-4">
              <h3 className="font-semibold mb-3">权限说明</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-on-surface-variant">
                      <th className="pb-2 font-medium">权限</th>
                      <th className="pb-2 px-4 font-medium text-primary">管理员</th>
                      <th className="pb-2 px-4 font-medium text-secondary">编辑者</th>
                      <th className="pb-2 px-4 font-medium text-on-surface-variant">查看者</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'canCreate', label: '创建项目/模块' },
                      { key: 'canEdit', label: '编辑内容' },
                      { key: 'canDelete', label: '删除内容' },
                      { key: 'canApprove', label: '批准版本' },
                      { key: 'canExport', label: '导出数据' },
                      { key: 'canManageUsers', label: '管理用户' },
                      { key: 'canManageModules', label: '管理模块库' },
                    ].map(item => (
                      <tr key={item.key} className="border-t border-outline-variant/20">
                        <td className="py-2">{item.label}</td>
                        <td className="px-4 py-2 text-center">
                          {ROLE_PERMISSIONS.admin[item.key as keyof typeof ROLE_PERMISSIONS.admin] ? (
                            <span className="material-symbols-outlined text-primary">check</span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant/30">close</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {ROLE_PERMISSIONS.editor[item.key as keyof typeof ROLE_PERMISSIONS.editor] ? (
                            <span className="material-symbols-outlined text-secondary">check</span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant/30">close</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {ROLE_PERMISSIONS.viewer[item.key as keyof typeof ROLE_PERMISSIONS.viewer] ? (
                            <span className="material-symbols-outlined text-on-surface-variant">check</span>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant/30">close</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="bg-surface-container rounded-xl p-6">
              <h3 className="font-semibold mb-4">数据管理</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (confirm('确定要清除本地登录信息吗？')) {
                      logout();
                      onLogout();
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                  清除本地会话
                </button>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-6">
              <h3 className="font-semibold mb-4">关于</h3>
              <div className="space-y-2 text-sm text-on-surface-variant">
                <p>BOM Catalyst v1.0.0</p>
                <p>基于 React + TypeScript + Tailwind CSS</p>
                <p>当前已接入本地 Node API 服务</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {showAddUser && (
        <UserFormModal
          title="添加用户"
          onSave={(data) => void handleAddUser(data)}
          onClose={() => setShowAddUser(false)}
        />
      )}

      {editingUser && (
        <UserFormModal
          title="编辑用户"
          initialData={editingUser}
          onSave={(data) => void handleEditUser(editingUser.id, data)}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

function ProfileForm({ user, onSave }: { user: User; onSave: (data: Partial<User>) => void }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !email.trim()) return;
    onSave({ displayName: displayName.trim(), email: email.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">显示名称</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
        />
      </div>
      <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-80">
        保存修改
      </button>
    </form>
  );
}

function UserFormModal({ title, initialData, onSave, onClose }: {
  title: string;
  initialData?: User;
  onSave: (data: { username: string; displayName: string; email: string; role: UserRole }) => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(initialData?.username || '');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState<UserRole>(initialData?.role || 'viewer');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || !email.trim()) return;
    onSave({ username: username.trim(), displayName: displayName.trim(), email: email.trim(), role });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-container rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!initialData && (
            <div>
              <label className="block text-sm font-medium mb-1">用户名 *</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
                placeholder="登录用户名"
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">显示名称 *</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              placeholder="如：张三"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱 *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">角色 *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
            >
              <option value="admin">管理员</option>
              <option value="editor">编辑者</option>
              <option value="viewer">查看者</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface transition-colors">
              取消
            </button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-80 transition-opacity">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
