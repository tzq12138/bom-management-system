import { useState } from 'react';
import { addActivity, createProject } from '../services/storage';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export function NewProjectModal({ isOpen, onClose, onCreated }: NewProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'PCBA',
    subAssembly: '',
  });

  const categories = ['PCBA', '机械', '电气', '结构', '其他'];
  const authors = [
    { name: 'Zhang San', initials: 'ZS' },
    { name: 'Li Si', initials: 'LS' },
    { name: 'Wang Wu', initials: 'WW' },
  ];
  const randomAuthor = authors[Math.floor(Math.random() * authors.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    const project = await createProject({
      name: formData.name,
      category: formData.category,
      subAssembly: formData.subAssembly,
      currentVersion: 'v1.0.0',
      author: randomAuthor.name,
      authorInitials: randomAuthor.initials,
      status: 'draft',
      lastModified: new Date().toISOString(),
      parts: [],
      versions: [{
        id: Date.now().toString(),
        version: 'v1.0.0',
        description: '初始创建',
        author: randomAuthor.name,
        createdAt: new Date().toISOString(),
        isActive: true,
      }],
    });

    await addActivity({
      user: randomAuthor.name,
      action: 'created',
      target: project.name,
      detail: 'New BOM project created',
      type: 'edit',
    });

    onCreated(project.id);
    setFormData({ name: '', category: 'PCBA', subAssembly: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-container-low">
          <h3 className="font-headline text-xl font-bold text-on-surface">创建新项目</h3>
          <p className="text-sm text-on-surface-variant mt-1">为团队创建一个新的 BOM 项目</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">项目名称 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：飞控主板 V2"
                className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">子装配（可选）</label>
              <input
                type="text"
                value={formData.subAssembly}
                onChange={(e) => setFormData({ ...formData, subAssembly: e.target.value })}
                placeholder="例如：主板、电源模块"
                className="w-full px-3 py-2 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-surface-container-low flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-surface-container-highest transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 btn-primary-gradient text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
