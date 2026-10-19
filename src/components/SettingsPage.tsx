import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme, DEFAULT_THRYVE_BRAND } from '../context/WorkspaceThemeContext';
import { WorkspaceBranding } from '../types';
import { 
  Palette, 
  Building2, 
  Save, 
  Check, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Info,
  Shield,
  Layers
} from 'lucide-react';

interface SettingsPageProps {
  onPreviewClient: () => void;
}

const PRESET_PALETTES = [
  { name: 'Émeraude & Sérénité (Défaut)', primary: '#0F766E', secondary: '#F0FDFA', accent: '#D97706' },
  { name: 'Bleu Minéral & Focus', primary: '#1E3A8A', secondary: '#EFF6FF', accent: '#3B82F6' },
  { name: 'Terre Cuite & Énergie', primary: '#C2410C', secondary: '#FFF7ED', accent: '#EA580C' },
  { name: 'Indigo & Profondeur', primary: '#4338CA', secondary: '#EEF2FF', accent: '#6366F1' },
  { name: 'Anthracite & Épure', primary: '#27272A', secondary: '#FAFAFA', accent: '#71717A' },
  { name: 'Prune & Sensibilité', primary: '#701A75', secondary: '#FDF4FF', accent: '#A21CAF' },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onPreviewClient }) => {
  const { workspace, updateWorkspaceBrandData } = useAuth();
  const { brand } = useWorkspaceTheme();

  const [formData, setFormData] = useState<WorkspaceBranding>({
    displayName: brand.displayName || '',
    tagline: brand.tagline || '',
    logoUrl: brand.logoUrl || '',
    primaryColor: brand.primaryColor || '#0F766E',
    secondaryColor: brand.secondaryColor || '#F0FDFA',
    accentColor: brand.accentColor || '#D97706',
    clientWelcomeMessage: brand.clientWelcomeMessage || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof PRESET_PALETTES[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      await updateWorkspaceBrandData(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMsg('Erreur lors de l\'enregistrement des paramètres.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_THRYVE_BRAND);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
          Paramètres du Cabinet & Personnalisation Visuelle
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Configurez l'identité visuelle de votre espace coach et personnalisez l'expérience de vos clients.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Brand Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
            <Building2 className="w-5 h-5 text-stone-700" />
            <h3 className="font-semibold text-stone-900 text-base">
              Identité de l'Espace Professionnel
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Nom affiché du Cabinet / Coach *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="ex. Cabinet Horizon Coaching"
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Visible dans l'en-tête du tableau de bord et sur les interfaces clientes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Signature ou Slogan professionnel
              </label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="ex. Révélateur de potentiels & leadership"
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Message d'accueil pour vos clients
            </label>
            <textarea
              rows={2}
              value={formData.clientWelcomeMessage || ''}
              onChange={(e) => setFormData({ ...formData, clientWelcomeMessage: e.target.value })}
              placeholder="Message introductif affiché au début des diagnostics..."
              className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
          </div>
        </div>

        {/* Dynamic Color Palette Customization */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-stone-700" />
              <h3 className="font-semibold text-stone-900 text-base">
                Thème Graphique & Couleurs Dynamiques
              </h3>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser THRYVE</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Palettes recommandées par les designers THRYVE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_PALETTES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`
                    p-3 rounded-xl border text-left flex items-center gap-3 transition-all
                    ${formData.primaryColor.toLowerCase() === preset.primary.toLowerCase()
                      ? 'border-stone-800 bg-stone-50 ring-1 ring-stone-800'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                    }
                  `}
                >
                  <div 
                    className="w-6 h-6 rounded-lg shadow-2xs shrink-0" 
                    style={{ backgroundColor: preset.primary }} 
                  />
                  <span className="text-xs font-medium text-stone-800 truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Couleur Primaire (Boutons, Accents)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-xl uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Fond doux / Nuance Secondaire
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-xl uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Couleur d'Action Secondaire
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor || '#D97706'}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200 p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={formData.accentColor || '#D97706'}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-xl uppercase"
                />
              </div>
            </div>
          </div>

          {/* Live Dynamic Preview Card */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3">
            <span className="text-xs font-semibold uppercase text-stone-500 tracking-wider">
              Aperçu en direct des éléments de vos diagnostics
            </span>
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {formData.displayName ? formData.displayName[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">{formData.displayName || 'Votre Cabinet'}</h4>
                  <p className="text-xs text-stone-500">{formData.tagline || 'Diagnostic en ligne'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Bouton Principal
                </button>
                <div 
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold border"
                  style={{ 
                    backgroundColor: formData.secondaryColor, 
                    borderColor: `${formData.primaryColor}30`,
                    color: formData.primaryColor 
                  }}
                >
                  Badge Thématique
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Paramètres et identité visuelle enregistrés avec succès dans Firebase.</span>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onPreviewClient}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
          >
            <Eye className="w-4 h-4 text-stone-500" />
            <span>Prévisualiser le questionnaire public</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
