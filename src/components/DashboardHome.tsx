import React from 'react';
import { 
  Users, 
  Images,
  Compass, 
  Layers, 
  Palette, 
  ArrowUpRight, 
  Plus, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';
import { SAAS_MODULES_REGISTRY } from '../modules/registry';
import { NavigationTab } from './Sidebar';

interface DashboardHomeProps {
  onNavigate: (tab: NavigationTab) => void;
  onPreviewClient: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, onPreviewClient }) => {
  const { profile, workspace } = useAuth();
  const { brand } = useWorkspaceTheme();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs relative overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none -mr-20 -mt-20"
          style={{ backgroundColor: brand.primaryColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Socle SaaS Opérationnel • Multi-tenant</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif">
              Bienvenue sur THRYVE, {profile?.displayName || 'Coach'}
            </h2>
            <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">
              Votre espace professionnel est prêt. Vous pouvez gérer vos clientes, personnaliser l'identité visuelle de votre cabinet et transmettre vos premiers questionnaires de diagnostic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('diagnostic')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-95"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Lancer un diagnostic</span>
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Images className="w-4 h-4 text-stone-500" />
              <span>Photothèque & Styles</span>
            </button>
            <button
              onClick={() => onNavigate('clients')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Users className="w-4 h-4 text-stone-500" />
              <span>Fiches Clientes</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Palette className="w-4 h-4 text-stone-500" />
              <span>Paramètres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Setup Cards / Architecture Foundations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Multi-tenant Branding */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="space-y-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">
              Identité de votre cabinet
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Vos clients découvrent vos diagnostics sous vos propres couleurs et votre logo. L'expérience est totalement personnalisée.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600 truncate max-w-[150px]">
              {brand.displayName}
            </span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-semibold text-stone-800 hover:text-stone-950 flex items-center gap-1"
            >
              <span>Ajuster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Clients & Diagnostics */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">
              Fiches Clientes & Diagnostics
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Créez vos fiches clientes, générez des liens publics sécurisés sans compte pour elles et consultez leurs réponses dès validation.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Gestion de votre patientèle
            </span>
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs font-semibold text-stone-800 hover:text-stone-950 flex items-center gap-1"
            >
              <span>Accéder</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Modular Registry */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">
              Architecture Modulaire
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {SAAS_MODULES_REGISTRY.length} modules répertoriés dans le registre extensible (Diagnostics, Énergie, Jalons, Outils IA).
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              Catalogue extensible
            </span>
            <button
              onClick={() => onNavigate('modules')}
              className="text-xs font-semibold text-stone-800 hover:text-stone-950 flex items-center gap-1"
            >
              <span>Explorer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Public Questionnaire Security & Experience Section */}
      <div className="bg-stone-100/60 rounded-2xl p-6 border border-stone-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-stone-900">
              Formulaires Publics Sans Compte & Sécurité des Données
            </h4>
          </div>
          <p className="text-xs text-stone-600 max-w-2xl">
            Vos clientes n'ont aucun compte à créer : elles répondent via leur lien direct sécurisé. Le questionnaire charge votre identité graphique, puis se referme immédiatement après soumission sans exposer vos données internes.
          </p>
        </div>

        <button
          onClick={onPreviewClient}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-50 shadow-2xs transition-colors"
        >
          <span>Tester le questionnaire public</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-stone-500" />
        </button>
      </div>
    </div>
  );
};
