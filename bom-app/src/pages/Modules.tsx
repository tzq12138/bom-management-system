import { useEffect, useState } from 'react';
import { Topbar } from '../components/Topbar';
import type { Module, ModulePart, SubModule } from '../types';
import {
  addPartToSubModule,
  addSubModule,
  createModule,
  deleteModule,
  deletePartFromSubModule,
  deleteSubModule,
  getModules,
  updateModule,
  updatePartInSubModule,
  updateSubModule,
} from '../services/storage';

interface ModulesProps {
  canEdit?: boolean;
  canDelete?: boolean;
}

const ICON_OPTIONS = [
  'videocam', 'camera', 'lens', 'flash_on', 'cable',
  'electrical_services', 'memory', 'chip', 'sensors',
  'power', 'settings', 'precision_manufacturing', 'hub',
  'router', 'developer_board', 'engineering', 'build',
];

export function Modules({ canEdit = true, canDelete = false }: ModulesProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [expandedSubModules, setExpandedSubModules] = useState<Set<string>>(new Set());
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingSubModule, setEditingSubModule] = useState<{ moduleId: string; subModule: SubModule } | null>(null);
  const [editingPart, setEditingPart] = useState<{ moduleId: string; subModuleId: string; part: ModulePart | null } | null>(null);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showAddSubModuleModal, setShowAddSubModuleModal] = useState(false);

  useEffect(() => {
    void loadModules();
  }, []);

  async function loadModules() {
    const data = await getModules();
    setModules(data);
    setSelectedModule((current) => {
      if (!data.length) return null;
      if (current) {
        return data.find((item) => item.id === current.id) || data[0];
      }
      return data[0];
    });
  }

  function toggleSubModule(subModuleId: string) {
    setExpandedSubModules(prev => {
      const next = new Set(prev);
      if (next.has(subModuleId)) {
        next.delete(subModuleId);
      } else {
        next.add(subModuleId);
      }
      return next;
    });
  }

  async function handleCreateModule(name: string, description: string, icon: string) {
    const newModule = await createModule({ name, description, icon });
    await loadModules();
    setSelectedModule(newModule);
    setShowAddModuleModal(false);
  }

  async function handleUpdateModule(id: string, name: string, description: string, icon: string) {
    await updateModule(id, { name, description, icon });
    await loadModules();
    setEditingModule(null);
  }

  async function handleDeleteModule(id: string) {
    if (!confirm('确定要删除这个大模块吗？')) return;
    await deleteModule(id);
    await loadModules();
  }

  async function handleCreateSubModule(moduleId: string, name: string, description: string) {
    await addSubModule(moduleId, { name, description });
    await loadModules();
    setShowAddSubModuleModal(false);
  }

  async function handleUpdateSubModule(moduleId: string, subModuleId: string, name: string, description: string) {
    await updateSubModule(moduleId, subModuleId, { name, description });
    await loadModules();
    setEditingSubModule(null);
  }

  async function handleDeleteSubModule(moduleId: string, subModuleId: string) {
    if (!confirm('确定要删除这个子模块吗？')) return;
    await deleteSubModule(moduleId, subModuleId);
    await loadModules();
  }

  async function handleCreatePart(moduleId: string, subModuleId: string, part: Omit<ModulePart, 'id'>) {
    await addPartToSubModule(moduleId, subModuleId, part);
    await loadModules();
    setEditingPart(null);
  }

  async function handleUpdatePart(moduleId: string, subModuleId: string, partId: string, part: Omit<ModulePart, 'id'>) {
    await updatePartInSubModule(moduleId, subModuleId, partId, part);
    await loadModules();
    setEditingPart(null);
  }

  async function handleDeletePart(moduleId: string, subModuleId: string, partId: string) {
    if (!confirm('确定要删除这个零件吗？')) return;
    await deletePartFromSubModule(moduleId, subModuleId, partId);
    await loadModules();
  }

  return (
    <div className="min-h-screen bg-surface">
      <Topbar title="模块库" />

      <main className="p-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          <div className="w-72 flex flex-col bg-surface-container rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="font-headline font-bold text-lg">大模块</h2>
              {canEdit && (
                <button
                  onClick={() => setShowAddModuleModal(true)}
                  className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    selectedModule?.id === module.id
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'hover:bg-surface-container-high/50 text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-primary/70">
                    {module.icon || 'folder'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-headline font-semibold text-sm truncate">{module.name}</div>
                    <div className="text-xs text-on-surface-variant">{module.subModules.length} 个子模块</div>
                  </div>
                </button>
              ))}

              {modules.length === 0 && (
                <div className="p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl opacity-50">folder_open</span>
                  <p className="mt-2 text-sm">暂无模块，点击上方加号创建</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-surface-container rounded-xl shadow-sm overflow-hidden flex flex-col">
            {selectedModule ? (
              <>
                <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      {selectedModule.icon || 'folder'}
                    </span>
                    <div>
                      <h2 className="font-headline font-bold text-lg">{selectedModule.name}</h2>
                      {selectedModule.description && (
                        <p className="text-sm text-on-surface-variant">{selectedModule.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => setEditingModule(selectedModule)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          编辑
                        </button>
                        <button
                          onClick={() => setShowAddSubModuleModal(true)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-80 transition-opacity flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          添加子模块
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => void handleDeleteModule(selectedModule.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedModule.subModules.map((subModule) => (
                    <div key={subModule.id} className="bg-surface rounded-lg border border-outline-variant/20 overflow-hidden">
                      <button
                        onClick={() => toggleSubModule(subModule.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg text-secondary">
                            {expandedSubModules.has(subModule.id) ? 'expand_more' : 'chevron_right'}
                          </span>
                          <div className="text-left">
                            <div className="font-headline font-semibold">{subModule.name}</div>
                            {subModule.description && (
                              <div className="text-xs text-on-surface-variant">{subModule.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                            {subModule.parts.length} 个零件
                          </span>
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSubModule({ moduleId: selectedModule.id, subModule });
                              }}
                              className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteSubModule(selectedModule.id, subModule.id);
                              }}
                              className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>
                      </button>

                      {expandedSubModules.has(subModule.id) && (
                        <div className="border-t border-outline-variant/20">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-on-surface-variant">零件列表</h4>
                              {canEdit && (
                                <button
                                  onClick={() => setEditingPart({ moduleId: selectedModule.id, subModuleId: subModule.id, part: null })}
                                  className="px-2 py-1 rounded text-xs font-medium bg-primary text-on-primary hover:opacity-80 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">add</span>
                                  添加零件
                                </button>
                              )}
                            </div>

                            {subModule.parts.length > 0 ? (
                              <div className="space-y-2">
                                {subModule.parts.map((part) => (
                                  <div key={part.id} className="bg-surface-container-low rounded-lg p-3 hover:bg-surface-container-low/80 transition-colors">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm font-medium">{part.partNumber}</span>
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                            {part.quantity}x
                                          </span>
                                        </div>
                                        <div className="text-sm text-on-surface-variant mt-0.5">{part.description}</div>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                          <span className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                                            {part.manufacturer}
                                          </span>
                                          {part.alternates.length > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-surface text-on-surface-variant border border-outline-variant/30">
                                              替代: {part.alternates.map(a => a.manufacturer).join(', ')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        {canEdit && (
                                          <button
                                            onClick={() => setEditingPart({ moduleId: selectedModule.id, subModuleId: subModule.id, part })}
                                            className="p-1 rounded hover:bg-surface text-on-surface-variant hover:text-primary"
                                          >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                          </button>
                                        )}
                                        {canDelete && (
                                          <button
                                            onClick={() => void handleDeletePart(selectedModule.id, subModule.id, part.id)}
                                            className="p-1 rounded hover:bg-surface text-on-surface-variant hover:text-error"
                                          >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-on-surface-variant text-sm">
                                暂无零件，点击上方添加
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedModule.subModules.length === 0 && (
                    <div className="text-center py-12 text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl opacity-30">folder_open</span>
                      <p className="mt-3">暂无子模块</p>
                      {canEdit && (
                        <button
                          onClick={() => setShowAddSubModuleModal(true)}
                          className="mt-3 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm hover:opacity-80 transition-opacity"
                        >
                          添加第一个子模块
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl opacity-30">widgets</span>
                  <p className="mt-3">选择或创建一个模块</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModuleModal && (
        <ModuleFormModal
          title="新建大模块"
          onSave={(name, description, icon) => void handleCreateModule(name, description, icon)}
          onClose={() => setShowAddModuleModal(false)}
        />
      )}

      {editingModule && (
        <ModuleFormModal
          title="编辑大模块"
          initialData={{ name: editingModule.name, description: editingModule.description || '', icon: editingModule.icon || 'folder' }}
          onSave={(name, description, icon) => void handleUpdateModule(editingModule.id, name, description, icon)}
          onClose={() => setEditingModule(null)}
        />
      )}

      {showAddSubModuleModal && selectedModule && (
        <SubModuleFormModal
          title="新建子模块"
          onSave={(name, description) => void handleCreateSubModule(selectedModule.id, name, description)}
          onClose={() => setShowAddSubModuleModal(false)}
        />
      )}

      {editingSubModule && (
        <SubModuleFormModal
          title="编辑子模块"
          initialData={{ name: editingSubModule.subModule.name, description: editingSubModule.subModule.description || '' }}
          onSave={(name, description) => void handleUpdateSubModule(editingSubModule.moduleId, editingSubModule.subModule.id, name, description)}
          onClose={() => setEditingSubModule(null)}
        />
      )}

      {editingPart && (
        <PartFormModal
          title={editingPart.part ? '编辑零件' : '添加零件'}
          initialData={editingPart.part || {
            partNumber: '',
            description: '',
            manufacturer: '',
            alternates: [],
            quantity: 1,
          }}
          onSave={(part) => {
            if (editingPart.part) {
              void handleUpdatePart(editingPart.moduleId, editingPart.subModuleId, editingPart.part.id, part);
            } else {
              void handleCreatePart(editingPart.moduleId, editingPart.subModuleId, part);
            }
          }}
          onClose={() => setEditingPart(null)}
        />
      )}
    </div>
  );
}

function ModuleFormModal({ title, initialData, onSave, onClose }: {
  title: string;
  initialData?: { name: string; description: string; icon: string };
  onSave: (name: string, description: string, icon: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || 'folder');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), icon);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-container rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">模块名称 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              placeholder="如：视觉系统、电气系统"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              placeholder="简要描述这个模块"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">图标</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(ico => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => setIcon(ico)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    icon === ico ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined">{ico}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
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

function SubModuleFormModal({ title, initialData, onSave, onClose }: {
  title: string;
  initialData?: { name: string; description: string };
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-container rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">子模块名称 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              placeholder="如：相机、镜头、光源、PLC"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              placeholder="简要描述这个子模块"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
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

function PartFormModal({ title, initialData, onSave, onClose }: {
  title: string;
  initialData: Omit<ModulePart, 'id'>;
  onSave: (part: Omit<ModulePart, 'id'>) => void;
  onClose: () => void;
}) {
  const [partNumber, setPartNumber] = useState(initialData.partNumber);
  const [description, setDescription] = useState(initialData.description);
  const [manufacturer, setManufacturer] = useState(initialData.manufacturer);
  const [quantity, setQuantity] = useState(initialData.quantity.toString());
  const [refDes, setRefDes] = useState(initialData.refDes || '');
  const [footprint, setFootprint] = useState(initialData.footprint || '');
  const [alternates, setAlternates] = useState(initialData.alternates);
  const [showAddAlternate, setShowAddAlternate] = useState(false);
  const [newAltManufacturer, setNewAltManufacturer] = useState('');
  const [newAltPartNumber, setNewAltPartNumber] = useState('');
  const [newAltNotes, setNewAltNotes] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partNumber.trim() || !manufacturer.trim()) return;
    onSave({
      partNumber: partNumber.trim(),
      description: description.trim(),
      manufacturer: manufacturer.trim(),
      quantity: parseInt(quantity) || 1,
      refDes: refDes.trim() || undefined,
      footprint: footprint.trim() || undefined,
      alternates,
    });
  }

  function addAlternate() {
    if (!newAltManufacturer.trim()) return;
    setAlternates([...alternates, {
      manufacturer: newAltManufacturer.trim(),
      partNumber: newAltPartNumber.trim() || undefined,
      notes: newAltNotes.trim() || undefined,
    }]);
    setNewAltManufacturer('');
    setNewAltPartNumber('');
    setNewAltNotes('');
    setShowAddAlternate(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-container rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface-container">
          <h3 className="font-headline font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">料号 *</label>
              <input
                type="text"
                value={partNumber}
                onChange={e => setPartNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none font-mono"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">数量 *</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
                min="1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述 *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">默认品牌 *</label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">参考位号</label>
              <input
                type="text"
                value={refDes}
                onChange={e => setRefDes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">封装</label>
            <input
              type="text"
              value={footprint}
              onChange={e => setFootprint(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">替代品牌 ({alternates.length})</label>
              <button
                type="button"
                onClick={() => setShowAddAlternate(!showAddAlternate)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                添加替代
              </button>
            </div>

            {showAddAlternate && (
              <div className="bg-surface rounded-lg p-3 mb-3 border border-outline-variant/30">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newAltManufacturer}
                    onChange={e => setNewAltManufacturer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-sm"
                    placeholder="替代品牌 *"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAltPartNumber}
                      onChange={e => setNewAltPartNumber(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-sm"
                      placeholder="料号"
                    />
                    <input
                      type="text"
                      value={newAltNotes}
                      onChange={e => setNewAltNotes(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded bg-surface-container border border-outline-variant focus:border-primary focus:outline-none text-sm"
                      placeholder="备注"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddAlternate(false)} className="flex-1 px-3 py-1 rounded text-sm border border-outline-variant hover:bg-surface-container">
                      取消
                    </button>
                    <button type="button" onClick={addAlternate} className="flex-1 px-3 py-1 rounded text-sm bg-primary text-on-primary">
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}

            {alternates.length > 0 && (
              <div className="space-y-1">
                {alternates.map((alt, index) => (
                  <div key={index} className="flex items-center gap-2 bg-surface rounded px-3 py-2 text-sm">
                    <span className="material-symbols-outlined text-secondary text-sm">swap_horiz</span>
                    <span className="flex-1">
                      <span className="font-medium">{alt.manufacturer}</span>
                      {alt.partNumber && <span className="text-on-surface-variant ml-2 font-mono text-xs">{alt.partNumber}</span>}
                      {alt.notes && <span className="text-on-surface-variant ml-2 text-xs">{alt.notes}</span>}
                    </span>
                    <button type="button" onClick={() => setAlternates(alternates.filter((_, i) => i !== index))} className="text-error hover:bg-error/10 p-1 rounded">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
