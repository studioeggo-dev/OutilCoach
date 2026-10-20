import React from 'react';
import { Menu, Eye } from 'lucide-react';
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
    <header className="h-16 bg-[#FFFCF7] border-b border-[#E7D7C6] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-xl text-[#756154] hover:text-[#352219] hover:bg-[#F3E2CC]/40 lg:hidden transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9E8A7C]">
            Cabinet
          </span>
          <span className="text-[#E7D7C6]">/</span>
          <h1 className="text-sm font-bold text-[#352219] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {brand.displayName || workspace?.name || 'Mon Espace Conseil en Image'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Preview Public Questionnaire Button */}
        <button
          onClick={onPreviewClient}
          className="btn-ivoire px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
          title="Prévisualiser le portail client avec votre univers graphique"
        >
          <Eye className="w-3.5 h-3.5 text-[#A66538]" />
          <span className="hidden sm:inline">Portail cliente</span>
          <span className="sm:hidden">Aperçu</span>
        </button>

        {/* Dynamic Coach Brand Badge */}
        <div 
          className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border border-[#E7D7C6] bg-[#FBF4EB] shadow-2xs"
          style={{ color: brand.primaryColor || '#A66538' }}
        >
          <span 
            className="w-2 h-2 rounded-full inline-block" 
            style={{ backgroundColor: brand.primaryColor || '#A66538' }}
          />
          <span className="hidden md:inline">{brand.displayName}</span>
          <span className="md:hidden">Actif</span>
        </div>
      </div>
    </header>
  );
};
