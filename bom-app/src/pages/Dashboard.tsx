import { useEffect, useState } from 'react';
import type { BOMProject, DashboardStats, PageRoute, TeamActivity } from '../types';
import { getActivities, getDashboardStats, getProjects } from '../services/storage';

interface DashboardProps {
  onNavigateToProject: (projectId: string) => void;
  onNavigate?: (page: PageRoute) => void;
}

export function Dashboard({ onNavigateToProject, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<BOMProject[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const [nextStats, nextProjects, nextActivities] = await Promise.all([
        getDashboardStats(),
        getProjects(),
        getActivities(),
      ]);
      setStats(nextStats);
      setProjects(nextProjects);
      setActivities(nextActivities);
    }

    void loadDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      approved: { bg: 'bg-[#e6f4ea]', text: 'text-[#1e4620]', label: '已确认' },
      pending: { bg: 'bg-[#fff3e0]', text: 'text-[#e65100]', label: '进行中' },
      draft: { bg: 'bg-surface-variant', text: 'text-on-surface-variant', label: '草稿' },
      error: { bg: 'bg-error-container', text: 'text-on-error-container', label: '待处理' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    if (days === 1) return '昨天';
    return `${days} 天前`;
  };

  const statCards = stats ? [
    { label: '项目总数', value: stats.totalProjects, icon: 'folder_open', color: 'bg-primary-container', iconColor: 'text-primary', onClick: () => onNavigate?.('projects') },
    { label: '活跃版本', value: stats.activeVersions, icon: 'account_tree', color: 'bg-tertiary-container', iconColor: 'text-tertiary' },
    { label: '待审核', value: stats.pendingReviews, icon: 'pending_actions', color: 'bg-error-container', iconColor: 'text-error', alert: true },
    { label: '物料数量', value: stats.materialsCount.toLocaleString(), icon: 'category', color: 'bg-secondary-container', iconColor: 'text-secondary', onClick: () => onNavigate?.('materials') },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-[2.25rem] font-headline font-extrabold text-on-surface tracking-tight leading-tight">概览</h2>
        <p className="text-on-surface-variant font-body text-sm mt-1">系统状态和最近动态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className={`${card.color} p-6 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group ${card.alert ? 'outline outline-1 outline-error/20' : ''} ${card.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full opacity-50 group-hover:scale-110 transition-transform" />
            <div className="relative z-10 flex justify-between items-start">
              <span className="font-label text-sm text-on-surface-variant font-medium uppercase tracking-wider">{card.label}</span>
              <span className={`material-symbols-outlined ${card.iconColor}`}>{card.icon}</span>
            </div>
            <div className="relative z-10">
              <span className="text-3xl font-headline font-bold text-on-surface">{card.value}</span>
              {card.alert && (
                <span className="text-sm font-body text-error font-medium ml-2">需要关注</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col">
            <div className="p-6 pb-4 bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-xl font-headline font-bold text-on-surface">最近更新的 BOM</h3>
              <button
                onClick={() => onNavigate?.('projects')}
                className="text-sm font-label text-primary hover:text-primary-dim transition-colors flex items-center gap-1"
              >
                查看全部 <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="bg-surface-container-lowest rounded-b-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-label text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest">
                    <th className="px-6 py-4 font-medium">项目名称</th>
                    <th className="px-6 py-4 font-medium">版本</th>
                    <th className="px-6 py-4 font-medium">最后更新</th>
                    <th className="px-6 py-4 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {projects.slice(0, 4).map((project, idx) => (
                    <tr
                      key={project.id}
                      onClick={() => onNavigateToProject(project.id)}
                      className={`hover:bg-surface-container-high transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}
                    >
                      <td className="px-6 py-4 text-on-surface font-medium group-hover:text-primary transition-colors">{project.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant tabular-nums">{project.currentVersion}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{formatTimeAgo(project.lastModified)}</td>
                      <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error" />
            <h3 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">assignment_late</span>
              待处理事项
            </h3>
            <div className="space-y-3">
              {stats?.pendingReviews && stats.pendingReviews > 0 ? (
                <div
                  onClick={() => onNavigate?.('projects')}
                  className="p-3 bg-surface rounded-lg flex items-start gap-3 hover:bg-surface-container-high transition-colors cursor-pointer outline outline-1 outline-outline-variant/15"
                >
                  <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-error-container text-sm">priority_high</span>
                  </div>
                  <div>
                    <p className="text-sm font-body font-medium text-on-surface">待审核项目</p>
                    <p className="text-xs font-body text-on-surface-variant mt-0.5">当前有 {stats.pendingReviews} 个项目等待审核。</p>
                  </div>
                </div>
              ) : null}
              <div className="p-3 bg-surface rounded-lg flex items-start gap-3 hover:bg-surface-container-high transition-colors cursor-pointer outline outline-1 outline-outline-variant/15">
                <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-tertiary-container text-sm">rule</span>
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-on-surface">供应商信息待补充</p>
                  <p className="text-xs font-body text-on-surface-variant mt-0.5">部分零件仍缺少完整供应商信息。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-headline font-bold text-on-surface">团队动态</h3>
              <button
                onClick={() => onNavigate?.('activity')}
                className="text-sm text-primary hover:underline"
              >
                查看全部
              </button>
            </div>
            <div className="relative border-l-2 border-outline-variant/30 ml-3 space-y-6">
              {activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="relative pl-6">
                  <div
                    className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full ring-4 ring-surface-container-low ${
                      activity.type === 'edit' ? 'bg-primary' : activity.type === 'confirm' ? 'bg-secondary' : 'bg-tertiary'
                    }`}
                  />
                  <div className="flex items-start gap-3">
                    {activity.type !== 'system' && activity.user !== 'System' ? (
                      <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container mt-0.5">
                        {activity.user.split('').slice(0, 2).join('')}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center text-xs font-bold text-on-tertiary-container mt-0.5">
                        SYS
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-body text-on-surface">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                        {activity.target && (
                          <span className="font-medium text-primary cursor-pointer hover:underline ml-1">{activity.target}</span>
                        )}
                      </p>
                      {activity.detail && <p className="text-xs text-on-surface-variant mt-0.5">{activity.detail}</p>}
                      <p className="text-xs text-on-surface-variant/70 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
