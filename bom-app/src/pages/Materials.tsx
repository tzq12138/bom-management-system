import { useEffect, useState } from 'react';
import type { Material, MaterialCategory } from '../types';
import { createMaterial, deleteMaterial, getMaterials, updateMaterial } from '../services/storage';

interface MaterialsProps {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function Materials({ canCreate = true, canEdit = true, canDelete = true }: MaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void loadMaterials();
  }, []);

  async function loadMaterials() {
    setMaterials(await getMaterials());
  }

  const categories: MaterialCategory[] = [
    { id: 'passives', name: '被动元件', count: 1200, children: [
      { id: 'capacitors', name: '电容', count: 800 },
      { id: 'resistors', name: '电阻', count: 300 },
      { id: 'inductors', name: '电感', count: 100 },
    ]},
    { id: 'ic', name: '集成电路', count: 450 },
    { id: 'connectors', name: '连接器', count: 320 },
    { id: 'power', name: '电源管理', count: 180 },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      preferred: { bg: 'bg-primary-container/30', text: 'text-on-primary-container', label: '首选' },
      alternate: { bg: 'bg-tertiary-container/30', text: 'text-on-tertiary-container', label: '替代' },
      eol: { bg: 'bg-error-container/20', text: 'text-on-error-container', label: '停产' },
    };
    const badge = badges[status] || badges.preferred;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-label ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const filteredMaterials = materials.filter(m => {
    const matchCategory = selectedCategory
      ? m.category.toLowerCase().includes(selectedCategory.toLowerCase())
      : true;
    const matchSearch = searchQuery
      ? m.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchCategory && matchSearch;
  });

  const handleSaveMaterial = async (material: Omit<Material, 'id' | 'createdAt'>) => {
    if (editingMaterial) {
      await updateMaterial(editingMaterial.id, material);
    } else {
      await createMaterial(material);
    }
    await loadMaterials();
    setShowAddModal(false);
    setEditingMaterial(null);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('确定要删除这个物料吗？')) return;
    await deleteMaterial(id);
    await loadMaterials();
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-[2rem] font-headline font-bold text-on-surface leading-tight tracking-tight">物料库</h2>
          <p className="text-sm font-body text-on-surface-variant mt-1">工程组件的全局目录。</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary-gradient px-5 py-2.5 rounded-lg font-headline text-sm font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            添加物料
          </button>
        )}
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <aside className="w-64 shrink-0 bg-surface-container-low rounded-xl p-4 overflow-y-auto flex flex-col gap-4">
          <h3 className="font-headline font-semibold text-sm text-on-surface uppercase tracking-wider mb-2">分类</h3>
          <ul className="flex flex-col gap-1">
            <li>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'bg-surface-container-lowest shadow-sm'
                    : 'hover:bg-surface-container-highest/50'
                }`}
              >
                <span className={`font-body text-sm font-medium ${selectedCategory === null ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                  全部物料
                </span>
                <span className="text-xs font-label text-on-surface-variant bg-surface px-1.5 py-0.5 rounded">
                  {materials.length}
                </span>
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-surface-container-lowest shadow-sm'
                      : 'hover:bg-surface-container-highest/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] ${selectedCategory === category.name ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {selectedCategory === category.name ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                    </span>
                    <span className={`font-body text-sm font-medium ${selectedCategory === category.name ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs font-label text-on-surface-variant bg-surface px-1.5 py-0.5 rounded">
                    {category.count >= 1000 ? `${(category.count / 1000).toFixed(1)}k` : category.count}
                  </span>
                </button>
                {selectedCategory === category.name && category.children && (
                  <ul className="pl-7 mt-1 flex flex-col gap-1">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() => setSelectedCategory(child.name)}
                          className="block px-3 py-1.5 rounded text-sm font-body text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 transition-colors"
                        >
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 bg-surface-container-lowest rounded-xl flex flex-col overflow-hidden relative">
          <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/20">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索料号、描述或厂商..."
                className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container-low sticky top-0 z-10 text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-3">零件编号</div>
            <div className="col-span-2">厂商</div>
            <div className="col-span-2">分类</div>
            <div className="col-span-2">状态</div>
            <div className="col-span-2">库存</div>
            <div className="col-span-1 text-right">操作</div>
          </div>

          <div className="flex-1 overflow-y-auto pb-4">
            {filteredMaterials.map((material, index) => (
              <div
                key={material.id}
                className={`grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-surface-container-high transition-colors group ${
                  index % 2 === 1 ? 'bg-surface-container-low/30' : ''
                }`}
              >
                <div className="col-span-3 flex flex-col">
                  <span className="font-headline font-bold text-sm text-on-surface">{material.partNumber}</span>
                  <span className="font-label text-xs text-on-surface-variant mt-0.5">{material.description}</span>
                </div>
                <div className="col-span-2 font-body text-sm text-on-surface">{material.manufacturer}</div>
                <div className="col-span-2 font-body text-sm text-on-surface-variant">{material.category}</div>
                <div className="col-span-2">{getStatusBadge(material.status)}</div>
                <div className={`col-span-2 font-body text-sm font-mono ${material.inventory === 0 ? 'text-error' : 'text-on-surface'}`}>
                  {material.inventory.toLocaleString()}
                </div>
                <div className="col-span-1 flex justify-end gap-2 text-on-surface-variant">
                  {canEdit && (
                    <button
                      onClick={() => { setEditingMaterial(material); setShowAddModal(true); }}
                      className="hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      title="编辑"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => void handleDeleteMaterial(material.id)}
                      className="hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                      title="删除"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredMaterials.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                <p className="text-lg font-medium">未找到物料</p>
                <p className="text-sm mt-1">试试选择其他分类或添加新物料</p>
                {canCreate && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 btn-primary-gradient text-on-primary py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    添加物料
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <MaterialFormModal
          material={editingMaterial}
          onSave={(material) => void handleSaveMaterial(material)}
          onClose={() => { setShowAddModal(false); setEditingMaterial(null); }}
        />
      )}
    </div>
  );
}

function MaterialFormModal({
  material,
  onSave,
  onClose,
}: {
  material?: Material | null;
  onSave: (material: Omit<Material, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [partNumber, setPartNumber] = useState(material?.partNumber || '');
  const [description, setDescription] = useState(material?.description || '');
  const [manufacturer, setManufacturer] = useState(material?.manufacturer || '');
  const [category, setCategory] = useState(material?.category || '电容');
  const [inventory, setInventory] = useState(material?.inventory?.toString() || '0');
  const [status, setStatus] = useState<'preferred' | 'alternate' | 'eol'>(material?.status || 'preferred');

  const categoryOptions = ['电容', '电阻', '电感', 'IC / 射频', '连接器', '电源管理', '其他'];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partNumber.trim() || !manufacturer.trim()) return;

    onSave({
      partNumber: partNumber.trim(),
      description: description.trim(),
      manufacturer: manufacturer.trim(),
      category,
      inventory: parseInt(inventory) || 0,
      status,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-outline-variant/30">
          <h3 className="font-headline text-xl font-bold">{material ? '编辑物料' : '添加物料'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">零件编号 *</label>
            <input
              type="text"
              value={partNumber}
              onChange={e => setPartNumber(e.target.value)}
              className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none font-mono"
              placeholder="如：C-0402-104K-10V"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述 *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
              placeholder="物料描述"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">厂商 *</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
                placeholder="厂商名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">库存数量</label>
              <input
                type="number"
                value={inventory}
                onChange={e => setInventory(e.target.value)}
                className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">状态</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'preferred' | 'alternate' | 'eol')}
                className="w-full px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                <option value="preferred">首选</option>
                <option value="alternate">替代</option>
                <option value="eol">停产</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface transition-colors">
              取消
            </button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
