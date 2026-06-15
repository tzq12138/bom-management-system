import { useCallback, useEffect, useState } from 'react';
import { Topbar } from '../components/Topbar';
import type { BOMProject, Part, ValidationError, ValidationResult } from '../types';
import { createVersion, getProject, updateProject, validateBOM } from '../services/storage';

interface BOMDetailProps {
  projectId: string;
  onBack?: () => void;
  canEdit?: boolean;
  canApprove?: boolean;
}

export function BOMDetail({ projectId, onBack, canEdit = true, canApprove = false }: BOMDetailProps) {
  const [project, setProject] = useState<BOMProject | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Part>>({});
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const loadProject = useCallback(async () => {
    const [nextProject, nextValidationResult] = await Promise.all([
      getProject(projectId),
      validateBOM(projectId),
    ]);

    if (nextProject) {
      setProject(nextProject);
      setValidationResult(nextValidationResult);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      verified: { bg: 'bg-primary-container', text: 'text-on-primary-container', label: '已验证' },
      outdated: { bg: 'bg-[#fff0e6]', text: 'text-[#b35900]', label: '已过期' },
      missing: { bg: 'bg-error-container', text: 'text-on-error-container', label: '缺失' },
      error: { bg: 'bg-error-container', text: 'text-on-error-container', label: '错误' },
    };
    const badge = badges[status] || badges.verified;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setEditForm(part);
    setIsEditing(true);
  };

  const handleSavePart = async () => {
    if (!project || !selectedPart) return;

    const updatedParts = project.parts.map(part =>
      part.id === selectedPart.id ? { ...part, ...editForm, updatedAt: new Date().toISOString() } : part
    );

    await updateProject(projectId, { parts: updatedParts });
    await loadProject();
    setIsEditing(false);
    setSelectedPart(null);
  };

  const handleAddPart = async () => {
    if (!project) return;

    const newPart: Part = {
      id: Date.now().toString(),
      partNumber: 'NEW-PART',
      description: '新零件',
      quantity: 1,
      refDes: '',
      manufacturer: '',
      footprint: '',
      status: 'missing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateProject(projectId, { parts: [...project.parts, newPart] });
    await loadProject();
    handleEditPart(newPart);
  };

  const handleDeletePart = async (partId: string) => {
    if (!project || !confirm('确定要删除这个零件吗？')) return;

    const updatedParts = project.parts.filter(part => part.id !== partId);
    await updateProject(projectId, { parts: updatedParts });
    await loadProject();
    setIsEditing(false);
    setSelectedPart(null);
  };

  const handleExportExcel = () => {
    if (!project) return;

    const headers = ['序号', '零件编号', '描述', '数量', '位号', '厂商', '封装', '状态'];
    const rows = project.parts.map((part, index) => [
      `${index + 1}`,
      part.partNumber,
      part.description,
      part.quantity.toString(),
      part.refDes,
      part.manufacturer,
      part.footprint,
      part.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.name}_${project.currentVersion}.csv`;
    link.click();
  };

  const handleCommitVersion = async () => {
    if (!project) return;

    const versionParts = project.currentVersion.split('.');
    const minorVersion = parseInt(versionParts[versionParts.length - 1] || '0', 10) + 1;
    const newVersion = `${versionParts.slice(0, -1).join('.')}.${minorVersion}`;

    await createVersion(projectId, {
      version: newVersion,
      description: '零件更新',
      author: project.author,
    });

    await loadProject();
  };

  const handleApproveVersion = async () => {
    if (!project) return;
    await updateProject(projectId, { status: 'approved' });
    await loadProject();
    setShowApproveModal(false);
  };

  const handleVersionCompare = (v1: string, v2: string) => {
    setCompareVersions([v1, v2]);
    setShowVersionCompare(true);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours} 小时前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  if (!project) {
    return <div className="p-8">Loading...</div>;
  }

  const errorCount = validationResult?.errors.filter((error: ValidationError) => error.type === 'missing' || error.type === 'invalid').length || 0;

  return (
    <div className="flex flex-col h-full">
      <Topbar
        onBack={onBack}
        showBack={!!onBack}
        showBreadcrumb
        breadcrumb={[
          { label: '项目', href: '#' },
          { label: project.category },
          { label: project.name },
        ]}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-headline text-[2rem] font-bold text-on-surface tracking-tight leading-none">{project.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label text-xs font-semibold tracking-wide">活跃</span>
              {project.status === 'pending' && (
                <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/30 text-on-tertiary-container font-label text-xs font-semibold tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  待审核
                </span>
              )}
              {project.status === 'approved' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#1e4620] font-label text-xs font-semibold tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1e4620]" />
                  已批准
                </span>
              )}
              {errorCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label text-xs font-semibold tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  {errorCount} 个问题
                </span>
              )}
            </div>
            <p className="font-body text-sm text-on-surface-variant max-w-2xl">{project.subAssembly || '主装配'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-transparent text-primary hover:bg-primary-container rounded-lg font-headline text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              导出 CSV
            </button>
            <button
              onClick={() => {
                if (project.versions.length >= 2) {
                  handleVersionCompare(project.versions[1].version, project.versions[0].version);
                } else {
                  alert('至少需要两个版本才能比较');
                }
              }}
              className="px-4 py-2 bg-surface-container-lowest text-on-surface border border-outline-variant/15 hover:bg-surface-container-high rounded-lg font-headline text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              版本对比
            </button>
            {canEdit && (
              <button
                onClick={() => void handleCommitVersion()}
                className="px-4 py-2 bg-surface-container-lowest text-on-surface border border-outline-variant/15 hover:bg-surface-container-high rounded-lg font-headline text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                提交更改
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 btn-primary-gradient text-on-primary rounded-lg font-headline text-sm font-bold transition-opacity hover:opacity-90 flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                批准版本
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          <div className="flex-1 bg-surface-container-low rounded-xl flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-auto rounded-lg bg-surface-container-lowest">
              <table className="w-full text-left border-collapse whitespace-nowrap font-body text-[0.875rem]">
                <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant font-headline text-sm font-semibold z-10">
                  <tr>
                    <th className="px-4 py-3 font-medium w-16">序号</th>
                    <th className="px-4 py-3 font-medium">零件编号</th>
                    <th className="px-4 py-3 font-medium">描述</th>
                    <th className="px-4 py-3 font-medium text-right">数量</th>
                    <th className="px-4 py-3 font-medium">位号</th>
                    <th className="px-4 py-3 font-medium">厂商</th>
                    <th className="px-4 py-3 font-medium">封装</th>
                    <th className="px-4 py-3 font-medium w-32 text-center">状态</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {project.parts.map((part, index) => (
                    <tr
                      key={part.id}
                      onClick={() => handleEditPart(part)}
                      className={`hover:bg-surface-container-high transition-colors cursor-pointer group ${
                        part.status === 'missing' || part.status === 'error' ? 'bg-error-container/10' : index % 2 === 1 ? 'bg-surface' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-on-surface-variant tabular-nums">{index + 1}</td>
                      <td className="px-4 py-2.5 font-headline font-semibold text-primary">{part.partNumber}</td>
                      <td className="px-4 py-2.5 truncate max-w-[200px]" title={part.description}>{part.description}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{part.quantity}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-on-surface-variant">{part.refDes}</td>
                      <td className="px-4 py-2.5 text-sm">{part.manufacturer || <span className="italic text-on-surface-variant">未知</span>}</td>
                      <td className="px-4 py-2.5 text-xs text-on-surface-variant">{part.footprint}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-center">
                          {getStatusBadge(part.status)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {project.parts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                  <p className="text-lg font-medium mb-2">暂无零件</p>
                  <p className="text-sm mb-4">点击下方按钮添加第一个零件</p>
                  {canEdit && (
                    <button
                      onClick={() => void handleAddPart()}
                      className="btn-primary-gradient text-on-primary py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      添加零件
                    </button>
                  )}
                </div>
              )}
            </div>

            {project.parts.length > 0 && canEdit && (
              <div className="p-3 bg-surface-container-lowest border-t border-surface-container-low">
                <button
                  onClick={() => void handleAddPart()}
                  className="w-full py-2 border-2 border-dashed border-outline-variant rounded-lg text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  添加零件
                </button>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            {validationResult && validationResult.errors.length > 0 && (
              <div className="bg-error-container/10 rounded-xl p-4 border border-error-container/30">
                <h3 className="font-headline text-lg font-bold text-error mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  校验问题 ({validationResult.errors.length})
                </h3>
                <div className="space-y-2">
                  {validationResult.errors.slice(0, 5).map((error: ValidationError) => (
                    <div key={`${error.partId}-${error.type}`} className="p-2 bg-surface-container-lowest rounded-lg text-sm">
                      <span className="font-medium text-error">
                        {error.type === 'missing' ? '缺失' : error.type === 'duplicate' ? '重复' : error.type === 'outdated' ? '过期' : '无效'}
                      </span>
                      <p className="text-on-surface-variant mt-1">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1">
              <h3 className="font-headline text-lg font-bold text-on-surface mb-4">版本历史</h3>
              <div className="bg-surface-container-low rounded-xl p-4 overflow-y-auto relative">
                <div className="absolute top-8 bottom-8 left-[27px] w-0.5 bg-outline-variant/30" />
                <div className="flex flex-col gap-6 relative">
                  {project.versions.map((version, idx) => (
                    <div key={version.id} className={`flex gap-4 relative ${!version.isActive ? 'opacity-75 hover:opacity-100 transition-opacity' : ''}`}>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 z-10 shadow-[0_0_0_4px_theme('colors.surface-container-low')] ${
                          version.isActive
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-dim text-on-surface-variant'
                        }`}
                      >
                        {version.isActive ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">commit</span>
                        )}
                      </div>
                      <div className={`p-4 rounded-lg flex-1 ${version.isActive ? 'bg-surface-container-lowest shadow-sm border border-outline-variant/15' : 'bg-surface-dim/30'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-headline font-bold ${version.isActive ? 'text-primary' : 'text-on-surface'} text-sm`}>
                            {version.version}
                          </span>
                          <span className="font-label text-xs text-on-surface-variant">
                            {version.isActive ? '当前' : formatTimeAgo(version.createdAt)}
                          </span>
                        </div>
                        <p className="font-body text-xs text-on-surface mb-2">{version.description}</p>
                        {!version.isActive && idx < project.versions.length - 1 && (
                          <button
                            onClick={() => handleVersionCompare(version.version, project.currentVersion)}
                            className="text-xs text-primary hover:underline"
                          >
                            与当前版本对比
                          </button>
                        )}
                        {version.isActive && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline-variant/15">
                            <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                              {project.authorInitials}
                            </div>
                            <span className="font-label text-xs text-on-surface-variant">编辑于 {formatTimeAgo(version.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isEditing && selectedPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-surface-container-low sticky top-0 bg-surface-container-lowest">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">编辑零件</h3>
                  <p className="text-sm text-on-surface-variant mt-1 font-mono">{selectedPart.partNumber}</p>
                </div>
                <button
                  onClick={() => void handleDeletePart(selectedPart.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">零件编号</label>
                <input
                  type="text"
                  value={editForm.partNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, partNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">描述</label>
                <input
                  type="text"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">数量</label>
                  <input
                    type="number"
                    value={editForm.quantity || 1}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">位号</label>
                  <input
                    type="text"
                    value={editForm.refDes || ''}
                    onChange={(e) => setEditForm({ ...editForm, refDes: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">厂商</label>
                <input
                  type="text"
                  value={editForm.manufacturer || ''}
                  onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">封装</label>
                <input
                  type="text"
                  value={editForm.footprint || ''}
                  onChange={(e) => setEditForm({ ...editForm, footprint: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-surface-container-low flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-surface-container-highest transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => void handleSavePart()}
                className="px-4 py-2 btn-primary-gradient text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showVersionCompare && compareVersions.length === 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowVersionCompare(false)}>
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-outline-variant/30">
              <h3 className="font-headline text-xl font-bold">版本对比</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {compareVersions[0]} {'->'} {compareVersions[1]}
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-surface rounded-lg p-4 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">compare</span>
                <p className="mt-2">版本对比功能开发中...</p>
                <p className="text-sm mt-1">后续会显示两个版本之间的零件差异。</p>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/30 flex justify-end">
              <button
                onClick={() => setShowVersionCompare(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApproveModal(false)}>
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-outline-variant/30">
              <h3 className="font-headline text-xl font-bold text-on-surface">批准版本</h3>
            </div>
            <div className="p-6">
              <p className="text-on-surface">
                确定要批准 <span className="font-semibold">{project.name}</span> 的当前版本 <span className="font-mono">{project.currentVersion}</span> 吗？
              </p>
              <p className="text-sm text-on-surface-variant mt-2">
                批准后需要创建新版本才能继续编辑。
              </p>
            </div>
            <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => void handleApproveVersion()}
                className="px-4 py-2 bg-[#1e4620] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                确认批准
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
