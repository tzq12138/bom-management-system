import { useState } from 'react';
import { Topbar } from '../components/Topbar';

interface HelpProps {
  onBack?: () => void;
}

export function Help({ onBack }: HelpProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const sections = [
    {
      id: 'getting-started',
      icon: 'rocket_launch',
      title: '快速开始',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. 登录系统</h4>
            <p className="text-on-surface-variant text-sm">使用您的用户名和密码登录系统。如果您是首次使用，可以选择快速登录中的演示账号。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. 创建项目</h4>
            <p className="text-on-surface-variant text-sm">在「BOM 项目」页面，点击右上角的「新建项目」按钮，填写项目名称、分类等信息。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. 添加零件</h4>
            <p className="text-on-surface-variant text-sm">在项目详情页，点击「添加零件」按钮，填写料号、描述、品牌等信息。支持 Excel 批量导入。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">4. 版本管理</h4>
            <p className="text-on-surface-variant text-sm">每次修改后可以提交新版本，系统会记录所有版本历史，方便追溯和对比。</p>
          </div>
        </div>
      ),
    },
    {
      id: 'modules',
      icon: 'widgets',
      title: '模块库管理',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">什么是模块库？</h4>
            <p className="text-on-surface-variant text-sm">模块库是预定义的标准模块集合，可以按机台工位分类。例如：视觉系统（相机、镜头、光源）、电气系统（PLC、伺服）等。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">大模块 vs 子模块</h4>
            <p className="text-on-surface-variant text-sm">大模块是顶层分类（如「视觉系统」），子模块是大模块下的细分（如「相机」、「镜头」）。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">替代品牌</h4>
            <p className="text-on-surface-variant text-sm">每个零件可以设置一个默认品牌和多个替代品牌，方便在缺货时快速替换。</p>
          </div>
        </div>
      ),
    },
    {
      id: 'versions',
      icon: 'history',
      title: '版本管理',
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">创建版本</h4>
            <p className="text-on-surface-variant text-sm">点击「提交更改」按钮，系统会为您的修改创建一个新版本快照。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">版本对比</h4>
            <p className="text-on-surface-variant text-sm">点击「版本对比」按钮，选择两个版本进行对比，查看零件的增删改情况。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">批准版本</h4>
            <p className="text-on-surface-variant text-sm">管理员可以批准某个版本为正式版本，批准后的版本会被标记为已审核状态。</p>
          </div>
        </div>
      ),
    },
    {
      id: 'roles',
      icon: 'manage_accounts',
      title: '角色权限',
      content: (
        <div className="space-y-4">
          <div className="bg-surface rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">shield</span>
              管理员
            </h4>
            <p className="text-on-surface-variant text-sm mt-1">拥有全部权限，可以管理用户、项目、模块库，批准版本等。</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-secondary/20">
            <h4 className="font-semibold text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">edit</span>
              编辑者
            </h4>
            <p className="text-on-surface-variant text-sm mt-1">可以创建和编辑项目、模块，但不能删除内容或批准版本。</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-outline-variant">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">visibility</span>
              查看者
            </h4>
            <p className="text-on-surface-variant text-sm mt-1">只读权限，可以查看项目和模块，但不能修改任何内容。</p>
          </div>
        </div>
      ),
    },
    {
      id: 'shortcuts',
      icon: 'keyboard',
      title: '快捷键',
      content: (
        <div className="space-y-2">
          {[
            { key: 'Ctrl + N', action: '新建项目' },
            { key: 'Ctrl + S', action: '保存当前修改' },
            { key: 'Ctrl + F', action: '搜索' },
            { key: 'Ctrl + E', action: '导出当前数据' },
            { key: 'Esc', action: '关闭弹窗' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">{item.action}</span>
              <kbd className="px-2 py-1 rounded bg-surface-container text-sm font-mono">{item.key}</kbd>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'faq',
      icon: 'help',
      title: '常见问题',
      content: (
        <div className="space-y-4">
          <details className="group">
            <summary className="font-medium cursor-pointer flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">expand_more</span>
              数据存储在哪里？
            </summary>
            <p className="mt-2 ml-6 text-on-surface-variant text-sm">业务数据现在通过后端 API 保存到服务器本地数据文件中。当前登录态仍会暂存在浏览器中，方便刷新后保持会话。</p>
          </details>
          <details className="group">
            <summary className="font-medium cursor-pointer flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">expand_more</span>
              如何添加替代品牌？
            </summary>
            <p className="mt-2 ml-6 text-on-surface-variant text-sm">在模块库中编辑零件，可以添加多个替代品牌，包含品牌名、可选料号和备注。</p>
          </details>
          <details className="group">
            <summary className="font-medium cursor-pointer flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">expand_more</span>
              可以批量导入零件吗？
            </summary>
            <p className="mt-2 ml-6 text-on-surface-variant text-sm">是的，在物料库页面支持 Excel 批量导入功能，格式请参考导出模板。</p>
          </details>
          <details className="group">
            <summary className="font-medium cursor-pointer flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">expand_more</span>
              如何重置密码？
            </summary>
            <p className="mt-2 ml-6 text-on-surface-variant text-sm">请联系系统管理员帮您重置密码。</p>
          </details>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Topbar
        title="帮助中心"
        onBack={onBack}
        showBack={!!onBack}
      />

      <main className="p-6 max-w-3xl mx-auto">
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="bg-surface-container rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-surface-container-high/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-primary">{section.icon}</span>
                  <span className="font-headline font-semibold">{section.title}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant transition-transform group-hover:rotate-180">
                  {expandedSection === section.id ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expandedSection === section.id && (
                <div className="px-4 pb-4 pt-0 border-t border-outline-variant/20">
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 bg-surface-container rounded-xl p-6 text-center">
          <h3 className="font-headline font-bold text-lg mb-2">需要更多帮助？</h3>
          <p className="text-on-surface-variant text-sm mb-4">如有其他问题，请联系系统管理员</p>
          <div className="flex items-center justify-center gap-2 text-primary">
            <span className="material-symbols-outlined">email</span>
            <span>admin@bom.local</span>
          </div>
        </div>
      </main>
    </div>
  );
}
