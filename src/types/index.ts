// Types for THRYVE SaaS Platform (strictly for coaches & administrators)
export type UserRole = 'platform_admin' | 'coach';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  activeWorkspaceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkspaceBranding {
  displayName: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;     // e.g. #0F766E, #1E3A8A, #7C3AED
  secondaryColor: string;   // e.g. #F0FDFA
  accentColor?: string;     // e.g. #F59E0B
  clientWelcomeMessage?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  brand: WorkspaceBranding;
  enabledModuleIds: string[];
  status: 'active' | 'trial' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export interface ClientProfile {
  id: string;
  workspaceId: string;
  coachId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  age?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  genre?: 'homme' | 'femme';
  couleurs?: string[];
  styles?: string[];
  status: 'invited' | 'active' | 'completed' | 'archived';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DiagnosticAssignment {
  id: string;
  workspaceId: string;
  coachId: string;
  clientId: string;
  clientName?: string;
  moduleId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  shareToken: string;
  expiresAt: string;
  responses?: Record<string, any>;
  resultsSummary?: {
    score?: number;
    completedDate?: string;
    keyInsights?: string[];
  };
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SaaSModule {
  id: string;
  name: string;
  shortDescription: string;
  category: 'diagnostic' | 'accompagnement' | 'analytics' | 'ia_tools';
  version: string;
  isAvailable: boolean; // Is module released in the platform
  badge?: string;
  iconName: string;
  estimatedDuration?: string;
}

// ==========================================
// Image Consulting & Visual Catalog Types
// ==========================================

export type ImageScope = 'system' | 'workspace';

export type ImageCategory =
  | 'look_complet'
  | 'haut'
  | 'bas'
  | 'chaussures'
  | 'accessoire'
  | 'texture_matiere'
  | 'colorimetrie_palette'
  | 'moodboard'
  | 'autre';

export interface ImageMetadata {
  width?: number;
  height?: number;
  sizeBytes: number;
  mimeType: string;
  format?: string;
}

export interface ImageItem {
  id: string;
  workspaceId?: string; // Present if workspace-private, undefined if system image
  scope: ImageScope;
  title: string; // For compatibility
  displayName: string; // Clean name without extension (e.g. "Robe_rouge_coupe_droite_01")
  originalFilename: string; // Exact original filename with extension (e.g. "Robe_rouge_coupe_droite_01.jpg")
  description?: string;
  category: ImageCategory | string;
  styleUniverseIds: string[]; // Associated StyleUniverse IDs
  tags: string[];
  storagePath: string; // Firebase Storage reference path
  downloadUrl: string; // Accessible image URL
  thumbnailUrl?: string;
  metadata: ImageMetadata;
  createdAt: string;
  updatedAt?: string;
  createdBy: string; // Coach UID
}

export interface StyleUniverse {
  id: string;
  code: string;
  name: string;
  description: string;
  keyTraits: string[];
  dominantColors?: string[];
  isSystem: boolean;
  workspaceId?: string; // Present if coach-defined, undefined if platform system
  createdAt: string;
  updatedAt?: string;
}

