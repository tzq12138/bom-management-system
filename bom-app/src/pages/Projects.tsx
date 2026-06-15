import { useEffect, useState } from 'react';
import type { BOMProject } from '../types';
import { createProject, deleteProject, getProjects } from '../services/storage';

interface ProjectsProps {
  onNavigateToProject: (projectId: string) => void;
  onNewProject: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

export function Projects({ onNavigateToProject, onNewProject, canCreate = true, canDelete = false }: ProjectsProps) {
  const [projects, setProjects] = useState<BOMProject[]>([]);
  const [filter, setFilter] = useState<'all' | 'my' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setProjects(await getProjects());
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      approved: { bg: 'bg-[#1e4620]/10', text: 'text-[#1e4620]', label: '已批准' },
      pending: { bg: 'bg-[#8a4a0f]/10', text: 'text-[#8a4a0f]', label: '待审核' },
      draft: { bg: 'bg-surface-variant', text: 'text-on-surface-variant', label: '草稿' },
      error: { bg: 'bg-error-container', text: 'text-on-error-container', label: '有错误' },
      archived: { bg: 'bg-surface-container', text: 'text-on-surface-variant', label: '已归档' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'my') return project.author === 'Zhang San';
    if (filter === 'archived') return project.status === 'archived';
    return true;
  });

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) return;
    await deleteProject(projectId);
    await loadProjects();
  };

  const handleDuplicateProject = async (e: React.MouseEvent, project: BOMProject) => {
    e.stopPropagation();
    const newProject = await createProject({
      name: `${project.name} (副本)`,
      category: project.category,
      subAssembly: project.subAssembly,
      currentVersion: 'v1.0.0',
      author: 'Zhang San',
      authorInitials: 'ZS',
      status: 'draft',
      lastModified: new Date().toISOString(),
      parts: project.parts.map(part => ({
        ...part,
        id: `${part.id}-copy-${Date.now()}`,
      })),
      versions: [{
        id: Date.now().toString(),
        version: 'v1.0.0',
        description: `Copied from ${project.name} ${project.currentVersion}`,
        author: 'Zhang San',
        createdAt: new Date().toISOString(),
        isActive: true,
      }],
    });
    await loadProjects();
    onNavigateToProject(newProject.id);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-[2.25rem] text-on-background font-bold tracking-tight">BOM 项目</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">管理、版本控制和跟踪所有工程物料清单。</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-container-highest text-primary py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-surface-container-lowest transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            筛选
          </button>
          {canCreate && (
            <button
              onClick={onNewProject}
              className="btn-primary-gradient text-on-primary py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_4px_12px_rgba(51,94,159,0.2)]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              新建项目
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden p-1">
        <div className="flex items-center justify-between p-3 mb-2 bg-surface-container-lowest rounded-lg">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-2 py-1 rounded transition-colors ${filter === 'all' ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container cursor-pointer'}`}
            >
              全部项目 ({projects.length})
            </button>
            <button
              onClick={() => { setFilter('my'); setPage(1); }}
              className={`px-2 py-1 rounded transition-colors ${filter === 'my' ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container cursor-pointer'}`}
            >
              我的项目
            </button>
            <button
              onClick={() => { setFilter('archived'); setPage(1); }}
              className={`px-2 py-1 rounded transition-colors ${filter === 'archived' ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container cursor-pointer'}`}
            >
              已归档
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
              title="列表视图"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
              title="网格视图"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onNavigateToProject(project.id)}
                className="bg-surface rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer border border-outline-variant/10 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">inventory_2</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-semibold text-sm group-hover:text-primary transition-colors">{project.name}</h3>
                      <span className="font-mono text-xs text-primary">{project.projectId}</span>
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                  <span>{project.category}</span>
                  <span>·</span>
                  <span>{project.currentVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                      {project.authorInitials}
                    </div>
                    <span className="text-xs text-on-surface-variant">{project.author}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => void handleDuplicateProject(e, project)}
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded"
                      title="复制"
                    >
                      <span className="material-symbols-outlined text-sm">file_copy</span>
                    </button>
                    {canDelete && (
                      <button
                        onClick={(e) => void handleDeleteProject(e, project.id)}
                        className="p-1 text-on-surface-variant hover:text-error transition-colors rounded"
                        title="删除"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="w-full overflow-x-auto rounded-lg">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest rounded-tl-lg">
                  <th className="py-3 px-4 font-headline rounded-tl-lg">项目编号</th>
                  <th className="py-3 px-4 font-headline">项目名称</th>
                  <th className="py-3 px-4 font-headline">分类</th>
                  <th className="py-3 px-4 font-headline text-right">版本</th>
                  <th className="py-3 px-4 font-headline">作者</th>
                  <th className="py-3 px-4 font-headline">最后修改</th>
                  <th className="py-3 px-4 font-headline">状态</th>
                  <th className="py-3 px-4 font-headline rounded-tr-lg"></th>
                </tr>
              </thead>
              <tbody className="text-sm align-middle font-body text-on-surface">
                {paginatedProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`hover:bg-surface-container-high transition-colors group ${index % 2 === 1 ? 'bg-surface-container-low/30' : ''}`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-primary font-medium bg-surface-container-highest px-2 py-1 rounded text-xs">{project.projectId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-on-background">{project.name}</div>
                      {project.subAssembly && (
                        <div className="text-xs text-on-surface-variant mt-0.5">子装配: {project.subAssembly}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-tertiary">{project.category}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-on-surface-variant">{project.currentVersion}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                          {project.authorInitials}
                        </div>
                        <span>{project.author}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant text-xs">{formatDate(project.lastModified)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(project.status)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onNavigateToProject(project.id)}
                          className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded"
                          title="查看详情"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={(e) => void handleDuplicateProject(e, project)}
                          className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded"
                          title="复制"
                        >
                          <span className="material-symbols-outlined text-[18px]">file_copy</span>
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => void handleDeleteProject(e, project.id)}
                            className="p-1 text-on-surface-variant hover:text-error transition-colors rounded"
                            title="删除"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="bg-surface-container-lowest p-3 rounded-b-lg flex items-center justify-between mt-0.5">
            <span className="text-xs text-on-surface-variant">
              显示 {(page - 1) * pageSize + 1} 到 {Math.min(page * pageSize, filteredProjects.length)} 条，共 {filteredProjects.length} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 text-on-surface-variant hover:bg-surface-container rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary-container text-primary'
                        : 'hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 text-on-surface-variant hover:bg-surface-container rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">folder_open</span>
            <p className="mt-3">
              {filter === 'archived' ? '暂无已归档项目' : filter === 'my' ? '暂无我的项目' : '暂无项目'}
            </p>
            {canCreate && (
              <button
                onClick={onNewProject}
                className="mt-4 btn-primary-gradient text-on-primary py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                新建项目
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
