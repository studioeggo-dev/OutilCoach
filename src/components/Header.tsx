import React from 'react';
import { Menu, Bell, Sparkles, SlidersHorizontal, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onPreviewClient: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onPreviewClient }) => {
  const { workspace } = useAuth();
  const { brand } = useWorkspaceTheme();

  return (
    <header className="h-16 bg-white border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Plateforme THRYVE
          </span>
          <span className="text-stone-300">/</span>
          <h1 className="text-sm font-medium text-stone-700">
            {workspace?.name || 'Mon Espace Coaching'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Preview Public Questionnaire Button */}
        <button
          onClick={onPreviewClient}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors"
          title="Prévisualiser le questionnaire public avec le thème dynamique de votre cabinet"
        >
          <Eye className="w-3.5 h-3.5 text-stone-500" />
          <span className="hidden sm:inline">Aperçu questionnaire</span>
          <span className="sm:hidden">Aperçu</span>
        </button>

        {/* Dynamic Coach Brand Pill */}
        <div 
          className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-2 border shadow-xs"
          style={{ 
            backgroundColor: `${brand.primaryColor}15`, 
            borderColor: `${brand.primaryColor}30`,
            color: brand.primaryColor 
          }}
        >
          <span 
            className="w-2 h-2 rounded-full inline-block animate-pulse" 
            style={{ backgroundColor: brand.primaryColor }}
          />
          <span className="hidden md:inline font-semibold">{brand.displayName}</span>
          <span className="md:hidden">Thème actif</span>
        </div>
      </div>
    </header>
  );
};
