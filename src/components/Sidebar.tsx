import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Images,
  Sparkles,
  Compass, 
  Settings, 
  LogOut, 
  Palette, 
  Layers, 
  ExternalLink, 
  ChevronRight,
  ShieldAlert
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

  const navigationItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'diagnostic' as NavigationTab,
      label: 'Nouveau Diagnostic',
      icon: Sparkles,
      badge: 'Processus'
    },
    {
      id: 'clients' as NavigationTab,
      label: 'Clientes & Fiches',
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
      id: 'modules' as NavigationTab,
      label: 'Catalogue des Modules',
      icon: Layers,
      badge: 'Extensible'
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Paramètres & Marque',
      icon: Palette,
      badge: null
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top: Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-xs transition-colors"
                style={{ backgroundColor: brand.primaryColor || '#0F766E' }}
              >
                T
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-wider text-stone-900 text-sm font-serif">THRYVE</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">SaaS Platform</span>
              </div>
            </div>
          </div>

          {/* Active Workspace Switcher / Indicator */}
          <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">Espace Coach Actif</p>
                <p className="text-xs font-semibold text-stone-800 truncate" title={brand.displayName}>
                  {brand.displayName}
                </p>
              </div>
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: brand.primaryColor }}
                title="Couleur primaire du cabinet"
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
                    w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors
                    ${isActive 
                      ? 'bg-stone-900 text-white font-semibold shadow-xs' 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Public Diagnostic Questionnaire Preview */}
          <div className="px-3 pt-3">
            <button
              onClick={() => {
                onSelectTab('client_preview');
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100/80 transition-colors text-left group"
            >
              <div>
                <div className="flex items-center gap-1.5 text-stone-800 text-xs font-medium">
                  <span>Questionnaire Public</span>
                  <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-stone-700" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Aperçu du lien envoyé aux clientes
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-3 border-t border-stone-100">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 border border-stone-100 mb-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs">
              {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-800 truncate">
                {profile?.displayName || 'Coach'}
              </p>
              <p className="text-[11px] text-stone-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
