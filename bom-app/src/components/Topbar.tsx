import React from 'react';
import type { PageRoute } from '../types';

interface TopbarProps {
  title?: string;
  showBreadcrumb?: boolean;
  breadcrumb?: { label: string; href?: string }[];
  children?: React.ReactNode;
  onNavigate?: (page: PageRoute) => void;
  onBack?: () => void;
  showBack?: boolean;
}

export function Topbar({ title, showBreadcrumb, breadcrumb, children, onNavigate, onBack, showBack }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-8 w-full h-16 z-40 bg-surface-container-low shrink-0 border-b-0">
      {/* Left: Back button or Title */}
      <div className="flex-1 flex items-center gap-3">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        {showBreadcrumb && breadcrumb ? (
          <div className="hidden md:flex items-center gap-2 text-sm text-on-surface-variant font-medium">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
                <span className="hover:text-primary cursor-pointer transition-colors">{item.label}</span>
              </React.Fragment>
            ))}
          </div>
        ) : title ? (
          <span className="text-xl font-bold text-[#2B5797] font-headline">{title}</span>
        ) : (
          <span className="text-xl font-bold text-[#2B5797] font-headline">BOM Catalyst</span>
        )}
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex justify-center flex-1">
        <div className="relative max-w-md w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Search BOMs, Parts..."
            className="w-full pl-10 pr-4 py-1.5 bg-surface-container-highest rounded-full text-sm focus:bg-white border-none outline-none focus:ring-0 focus:border-b-2 focus:border-b-primary transition-all"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 flex-1">
        {children}
        <button
          onClick={() => onNavigate?.('help')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">help</span>
        </button>
        <button
          onClick={() => onNavigate?.('settings')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="ml-2 w-9 h-9 rounded-full overflow-hidden border-2 border-surface-container-highest cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
