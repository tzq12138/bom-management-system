import { useEffect, useState } from 'react';
import type { TeamActivity } from '../types';
import { getActivities } from '../services/storage';

export function Activity() {
  const [activities, setActivities] = useState<TeamActivity[]>([]);

  useEffect(() => {
    async function loadActivities() {
      setActivities(await getActivities());
    }

    void loadActivities();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days === 1) return '昨天';
    return `${days} 天前`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, TeamActivity[]>);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit':
        return { icon: 'edit', color: 'bg-primary', textColor: 'text-on-primary' };
      case 'confirm':
        return { icon: 'check_circle', color: 'bg-[#e6f4ea]', textColor: 'text-[#1e4620]' };
      case 'system':
        return { icon: 'settings', color: 'bg-tertiary-container', textColor: 'text-on-tertiary-container' };
      default:
        return { icon: 'info', color: 'bg-secondary-container', textColor: 'text-on-secondary-container' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-[2rem] font-headline font-bold text-on-surface tracking-tight">团队动态</h2>
        <p className="text-sm font-body text-on-surface-variant mt-1">跟踪所有项目的变更和更新</p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedActivities).map(([dateStr, dayActivities]) => (
          <div key={dateStr}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-on-surface-variant">
                {new Date(dateStr).toDateString() === new Date().toDateString() ? '今天' :
                 new Date(dateStr).toDateString() === new Date(Date.now() - 86400000).toDateString() ? '昨天' :
                 formatDate(dateStr)}
              </span>
              <div className="flex-1 h-px bg-surface-container-high" />
            </div>

            <div className="relative border-l-2 border-outline-variant/30 ml-4 space-y-4">
              {dayActivities.map((activity) => {
                const { icon, color, textColor } = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="relative pl-6">
                    <div className={`absolute -left-[13px] top-0 w-5 h-5 rounded-full ${color} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-[12px] ${textColor}`}>{icon}</span>
                    </div>

                    <div className="bg-surface-container-low rounded-xl p-4 ml-4 hover:bg-surface-container-high transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {activity.user !== 'System' ? (
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {activity.user.split(' ').map(n => n[0]).join('')}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-xs font-bold flex-shrink-0">
                              SYS
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-body text-on-surface">
                              <span className="font-semibold">{activity.user}</span>
                              {' '}{activity.action}
                              {activity.target && (
                                <>
                                  {' '}
                                  <span className="font-semibold text-primary cursor-pointer hover:underline">
                                    {activity.target}
                                  </span>
                                </>
                              )}
                            </p>
                            {activity.detail && (
                              <p className="text-xs text-on-surface-variant mt-1">{activity.detail}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4">history</span>
            <p className="text-lg font-medium">暂无动态</p>
            <p className="text-sm mt-1">团队成员操作后将显示在这里</p>
          </div>
        )}
      </div>
    </div>
  );
}
