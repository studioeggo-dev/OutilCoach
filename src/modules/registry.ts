import { SaaSModule } from '../types';

/**
 * THRYVE Module Registry
 * Defines extensible modules that can be activated per workspace or subscription.
 * Does not implement business logic prematurely, but establishes the extensible contract.
 */
export const SAAS_MODULES_REGISTRY: SaaSModule[] = [
  {
    id: 'mod_diagnostic_image_ludidiag',
    name: 'Diagnostic Image & Conseil Stylistique',
    shortDescription: 'Protocole en 4 étapes : profil client, associations de couleur (assocolor), recettes de style et fiche de synthèse.',
    category: 'diagnostic',
    version: '2.0.0',
    isAvailable: true,
    badge: 'Cœur Métier',
    iconName: 'Palette',
    estimatedDuration: '15-20 min'
  },
  {
    id: 'mod_diagnostic_holistique',
    name: 'Diagnostic Holistique & Alignement',
    shortDescription: 'Évaluation 360° du potentiel, de la posture et des leviers d\'épanouissement personnel et professionnel.',
    category: 'diagnostic',
    version: '1.0.0',
    isAvailable: true,
    badge: 'Inclus',
    iconName: 'Compass',
    estimatedDuration: '15-20 min'
  },
  {
    id: 'mod_matrice_energie',
    name: 'Matrice d\'Énergie & Facteurs de Stress',
    shortDescription: 'Cartographie des sources de recharge et des drainages d\'énergie pour prévenir l\'épuisement.',
    category: 'diagnostic',
    version: '0.9.0',
    isAvailable: true,
    badge: 'Module Clé',
    iconName: 'Zap',
    estimatedDuration: '10 min'
  },
  {
    id: 'mod_valeurs_moteurs',
    name: 'Explorateur de Valeurs & Moteurs',
    shortDescription: 'Identification hiérarchisée des moteurs intrinsèques et des non-négociables d\'évolution.',
    category: 'diagnostic',
    version: '1.1.0',
    isAvailable: true,
    badge: 'Populaire',
    iconName: 'Target',
    estimatedDuration: '12 min'
  },
  {
    id: 'mod_plan_action',
    name: 'Feuille de Route & Jalons d\'Action',
    shortDescription: 'Planification stratégique et suivi des étapes de transformation post-diagnostic.',
    category: 'accompagnement',
    version: '1.0.0',
    isAvailable: true,
    badge: 'Inclus',
    iconName: 'CheckSquare',
    estimatedDuration: 'Suivi continu'
  },
  {
    id: 'mod_ia_synthese',
    name: 'Assistant Synthèse & Clés d\'Analyse (IA)',
    shortDescription: 'Génération assistée de résumés d\'entretien et mise en lumière des signaux faibles.',
    category: 'ia_tools',
    version: '0.1.0-alpha',
    isAvailable: false,
    badge: 'Bientôt',
    iconName: 'Sparkles',
    estimatedDuration: 'Automatique'
  },
  {
    id: 'mod_analytics_cabinet',
    name: 'Indicateurs d\'Impact & Métriques Cabinet',
    shortDescription: 'Analyses de progression des coachés et suivi global de l\'activité.',
    category: 'analytics',
    version: '0.2.0-beta',
    isAvailable: false,
    badge: 'Prochainement',
    iconName: 'BarChart3',
    estimatedDuration: 'Tableau de bord'
  }
];

export function getModuleById(id: string): SaaSModule | undefined {
  return SAAS_MODULES_REGISTRY.find(m => m.id === id);
}

export function getModulesByCategory(category: SaaSModule['category']): SaaSModule[] {
  return SAAS_MODULES_REGISTRY.filter(m => m.category === category);
}
