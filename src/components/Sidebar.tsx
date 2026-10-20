import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Images,
  Sparkles,
  Settings, 
  LogOut, 
  Palette, 
  Layers, 
  ExternalLink, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';

export type NavigationTab = 'dashboard' | 'diagnostic' | 'clients' | 'catalog' | 'modules' | 'settings' | 'client_preview';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const { user, profile, workspace, signOut } = useAuth();
  const { brand } = useWorkspaceTheme();

  // Navigation ordonnée selon le parcours métier
  const navigationItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'diagnostic' as NavigationTab,
      label: 'Nouveau diagnostic',
      icon: Sparkles,
      badge: 'Séance'
    },
    {
      id: 'clients' as NavigationTab,
      label: 'Clients & fiches',
      icon: Users,
      badge: null
    },
    {
      id: 'catalog' as NavigationTab,
      label: 'Catalogue d\'images',
      icon: Images,
      badge: null
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Paramètres & marque',
      icon: Palette,
      badge: null
    },
    // Modules en retrait comme sous-rubrique extensible sans dominer
    {
      id: 'modules' as NavigationTab,
      label: 'Catalogue modules',
      icon: Layers,
      badge: 'Option'
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#352219]/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-[#FFFCF7] border-r border-[#E7D7C6] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top: Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#E7D7C6]/80 bg-[#FFFCF7]">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-[0_2px_8px_rgba(166,101,56,0.25)] transition-transform"
                style={{ background: 'linear-gradient(135deg, #C68A51 0%, #A66538 50%, #864A28 100%)' }}
              >
                T
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wide text-[#352219] text-base leading-tight font-serif">THRYVE</span>
                <span className="text-[10px] uppercase tracking-wider text-[#A66538] font-semibold">Conseil en image</span>
              </div>
            </div>
          </div>

          {/* Active Workspace Switcher / Indicator */}
          <div className="px-4 py-3 border-b border-[#E7D7C6]/70 bg-[#FBF4EB]/60">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] uppercase font-semibold text-[#9E8A7C] tracking-wider">Cabinet actif</p>
                <p className="text-xs font-bold text-[#352219] truncate" title={brand.displayName}>
                  {brand.displayName}
                </p>
              </div>
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: brand.primaryColor || '#A66538' }}
                title="Couleur du cabinet"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left
                    ${isActive 
                      ? 'bg-gradient-to-r from-[#A66538] to-[#864A28] text-white shadow-[0_4px_14px_rgba(134,74,40,0.22)]' 
                      : 'text-[#756154] hover:text-[#352219] hover:bg-[#F3E2CC]/40'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A66538]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                      isActive 
                        ? 'bg-[#864A28] text-[#F3E2CC]' 
                        : 'bg-[#F3E2CC]/60 text-[#704323]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Public Diagnostic Questionnaire Preview */}
          <div className="px-3 pt-2">
            <button
              onClick={() => {
                onSelectTab('client_preview');
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#E7D7C6] bg-[#FFFCF7] hover:bg-[#FBF4EB] transition-colors text-left group"
            >
              <div>
                <div className="flex items-center gap-1.5 text-[#352219] text-xs font-semibold">
                  <span>Portail cliente</span>
                  <ExternalLink className="w-3 h-3 text-[#A66538] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[10px] text-[#756154] mt-0.5">
                  Aperçu du portail de marque
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C68A51]" />
            </button>
          </div>
        </div>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-3 border-t border-[#E7D7C6]/80 bg-[#FFFCF7]">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FBF4EB] border border-[#E7D7C6]/80 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#F3E2CC] text-[#704323] flex items-center justify-center font-bold text-xs border border-[#E7D7C6]">
              {(profile?.displayName || user?.email || 'C')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#352219] truncate">
                {profile?.displayName || 'Coach en Image'}
              </p>
              <p className="text-[10px] text-[#756154] truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#756154] hover:text-[#864A28] hover:bg-[#F3E2CC]/40 transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#A66538]" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
