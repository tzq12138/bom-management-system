import { useEffect, useState } from 'react';
import { getUsers, login as loginUser, type User } from '../services/storage';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      setUsers(await getUsers());
    }

    void loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError('');

    const user = await loginUser(username.trim(), password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('用户名或密码错误');
    }
    setIsLoading(false);
  }

  async function handleQuickLogin(user: User) {
    setIsLoading(true);
    setError('');
    const loggedInUser = await loginUser(user.username, 'demo');
    if (loggedInUser) {
      onLoginSuccess(loggedInUser);
    } else {
      setError('用户名或密码错误');
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 text-on-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-5xl">inventory_2</span>
            <h1 className="font-headline text-4xl font-bold">BOM Catalyst</h1>
          </div>
          <p className="mt-6 text-on-primary/80 text-lg">智能 BOM 管理系统</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <div>
              <h3 className="font-semibold">模块化管理</h3>
              <p className="text-on-primary/70 text-sm">按功能组织项目、模块与物料结构</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <div>
              <h3 className="font-semibold">版本控制</h3>
              <p className="text-on-primary/70 text-sm">完整追踪 BOM 版本变更与审批流程</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <div>
              <h3 className="font-semibold">团队协作</h3>
              <p className="text-on-primary/70 text-sm">支持多角色权限和团队活动记录</p>
            </div>
          </div>
        </div>

        <p className="text-on-primary/60 text-sm">v1.0.0</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">inventory_2</span>
            <h1 className="font-headline text-2xl font-bold">BOM Catalyst</h1>
          </div>

          <h2 className="font-headline text-2xl font-bold">登录</h2>
          <p className="text-on-surface-variant mt-2">输入你的账号信息开始使用</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                placeholder="输入用户名"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant focus:border-primary focus:outline-none transition-colors pr-12"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">Demo accounts use password `demo`. The `admin` account also supports `admin123`.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-error text-sm">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-primary text-on-primary font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-on-surface-variant">快速登录（演示）</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => void handleQuickLogin(user)}
                  disabled={isLoading}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{user.displayName}</div>
                    <div className="text-xs text-on-surface-variant capitalize">
                      {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑者' : '查看者'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-on-surface-variant">
            You can use quick login, or sign in with one of the demo passwords above.
          </p>
        </div>
      </div>
    </div>
  );
}
