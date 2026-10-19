import React from 'react';
import { SAAS_MODULES_REGISTRY } from '../modules/registry';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';
import { 
  Compass, 
  Zap, 
  Target, 
  CheckSquare, 
  Sparkles, 
  BarChart3, 
  Lock, 
  Check, 
  Layers, 
  ArrowUpRight,
  Info
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Zap,
  Target,
  CheckSquare,
  Sparkles,
  BarChart3
};

export const ModulesCatalogPage: React.FC = () => {
  const { workspace } = useWorkspaceTheme();
  const enabledModuleIds = workspace?.enabledModuleIds || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Écosystème THRYVE
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-xs font-medium text-stone-500">Registre extensible</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
          Catalogue des Modules & Outils Métier
        </h2>
        <p className="text-sm text-stone-600 max-w-3xl">
          THRYVE est conçu avec une architecture modulaire découplée. Chaque module métier (diagnostics holistiques, bilans énergétiques, synthèses d'intelligence artificielle) s'active indépendamment sans réécrire le socle applicatif.
        </p>
      </div>

      {/* Architecture Disclaimer Card */}
      <div className="bg-stone-100/70 border border-stone-200/80 rounded-2xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">
            Principe d'extensibilité SaaS THRYVE :
          </p>
          <p>
            Les modules listés ci-dessous respectent le contrat d'interface commun. Les futures fonctionnalités métier développées ultérieurement viendront se brancher sur ce registre sans impacter l'isolation multi-tenant ni la charte graphique de chaque cabinet.
          </p>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAAS_MODULES_REGISTRY.map((mod) => {
          const Icon = ICON_MAP[mod.iconName] || Layers;
          const isEnabled = enabledModuleIds.includes(mod.id);

          return (
            <div
              key={mod.id}
              className={`
                bg-white rounded-2xl p-6 border shadow-xs flex flex-col justify-between transition-all
                ${mod.isAvailable 
                  ? 'border-stone-200/90 hover:border-stone-300 hover:shadow-sm' 
                  : 'border-dashed border-stone-200 opacity-75 bg-stone-50/40'
                }
              `}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${mod.isAvailable ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className={`
                    text-[11px] px-2.5 py-1 rounded-full font-medium
                    ${mod.isAvailable 
                      ? 'bg-stone-100 text-stone-800' 
                      : 'bg-stone-200/60 text-stone-500'
                    }
                  `}>
                    {mod.badge || (mod.isAvailable ? 'Disponible' : 'En développement')}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-900 text-base">
                    {mod.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                    <span className="uppercase tracking-wider font-semibold">v{mod.version}</span>
                    <span>•</span>
                    <span>{mod.estimatedDuration}</span>
                  </div>
                  <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                    {mod.shortDescription}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  {mod.isAvailable ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Activable dans l'espace</span>
                    </span>
                  ) : (
                    <span className="text-stone-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Étape ultérieure</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                  {mod.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
