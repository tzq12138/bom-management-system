import { useState, useEffect } from 'react';
import type { PageRoute } from '../types';
import { getCurrentUser, type User } from '../services/storage';

interface SidebarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onNewProject: () => void;
}

export function Sidebar({ currentPage, onNavigate, onNewProject }: SidebarProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    // 监听存储变化
    const handleStorageChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener('storage', handleStorageChange);
    // 也监听自定义事件（用于同页面更新）
    window.addEventListener('userUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);

  const navItems: { id: PageRoute; icon: string; label: string; filled?: boolean; requirePermission?: boolean }[] = [
    { id: 'dashboard', icon: 'dashboard', label: '仪表盘' },
    { id: 'projects', icon: 'inventory_2', label: 'BOM 项目' },
    { id: 'modules', icon: 'widgets', label: '模块库' },
    { id: 'materials', icon: 'layers', label: '物料库' },
    { id: 'activity', icon: 'group', label: '团队动态' },
  ];

  const bottomNavItems: { id: PageRoute; icon: string; label: string }[] = [
    { id: 'settings', icon: 'settings', label: '设置' },
    { id: 'help', icon: 'contact_support', label: '帮助' },
  ];

  return (
    <nav className="hidden md:flex flex-col py-6 px-4 gap-2 fixed left-0 top-0 h-full w-64 z-50 bg-gradient-to-b from-surface-container-low to-surface shadow-xl shadow-blue-900/5">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-headline font-black text-xl">
          BO
        </div>
        <div>
          <h1 className="font-headline text-lg font-black text-[#2B5797]">BOM 管理</h1>
          <p className="font-label text-xs text-on-surface-variant">工程团队</p>
        </div>
      </div>

      {/* New Project Button */}
      {currentUser && currentUser.role !== 'viewer' && (
        <div className="px-2 mb-4">
          <button
            onClick={onNewProject}
            className="w-full btn-primary-gradient text-on-primary py-2.5 rounded-lg font-headline font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            新建项目
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-headline text-sm transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-white text-[#2B5797] shadow-sm font-bold'
                : 'text-slate-600 hover:text-[#2B5797] hover:bg-surface-container-high/50'
            }`}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: item.filled ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-col gap-1 mt-auto pt-4 border-t border-outline-variant/20">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-headline text-sm font-medium ${
              currentPage === item.id
                ? 'bg-white text-[#2B5797] shadow-sm'
                : 'text-slate-600 hover:text-[#2B5797] hover:bg-surface-container-high/50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Current User */}
      {currentUser && (
        <div className="mt-2 pt-3 border-t border-outline-variant/20">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{currentUser.displayName}</div>
              <div className="text-xs text-on-surface-variant">
                {currentUser.role === 'admin' ? '管理员' : currentUser.role === 'editor' ? '编辑者' : '查看者'}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
