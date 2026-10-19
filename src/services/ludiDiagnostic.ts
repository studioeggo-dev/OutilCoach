import { ClientProfile, DiagnosticAssignment } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export type Genre = 'homme' | 'femme';

export interface DocumentPdf {
  /** Nom du fichier, ex: "Associations_couleurs_femme-2.jpg" */
  fichier: string;
  /** Chemin public complet */
  chemin: string;
  /** Libellé lisible embellit */
  titre: string;
}

export interface LudiClientProfil {
  id: string;
  nom: string;
  prenom: string;
  age: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  genre: Genre | '';
  couleurs: string[]; // Noms de fichiers sélectionnés en assocolor
  styles: string[];   // Noms de fichiers sélectionnés en style
  creeLe: string;
}

export const profilVide = (): LudiClientProfil => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  nom: '',
  prenom: '',
  age: '',
  adresse: '',
  codePostal: '',
  ville: '',
  telephone: '',
  email: '',
  genre: '',
  couleurs: [],
  styles: [],
  creeLe: new Date().toISOString()
});

export const embellirTitre = (fichier: string): string => {
  return fichier
    .replace(/\.(jpe?g|png|webp|avif|gif|pdf)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

type Manifeste = Record<string, Record<string, string[]>>;
let cacheManifeste: Manifeste | null = null;

// Fallback embedded manifest in case /documents.json fetch is delayed or offline
const FALLBACK_MANIFEST: Manifeste = {
  assocolor: {
    homme: [
      'Associations_couleurs_homme-2.jpg',
      'Associations_couleurs_homme-3.jpg',
      'Associations_couleurs_homme-4.jpg',
      'Associations_couleurs_homme-5.jpg',
      'Associations_couleurs_homme-6.jpg'
    ],
    femme: [
      'Associations_couleurs_femme-2.jpg',
      'Associations_couleurs_femme-3.jpg',
      'Associations_couleurs_femme-4.jpg',
      'Associations_couleurs_femme-5.jpg',
      'Associations_couleurs_femme-6.jpg'
    ]
  },
  style: {
    homme: [
      'Recette_de_style_homme-1.jpg',
      'Recette_de_style_homme-2.jpg',
      'Recette_de_style_homme-3.jpg',
      'Recette_de_style_homme-4.jpg',
      'Recette_de_style_homme-5.jpg',
      'Recette_de_style_homme-6.jpg'
    ],
    femme: [
      'Recette_de_style_femme-3.jpg',
      'Recette_de_style_femme-12.jpg',
      'Recette_de_style_femme-27.jpg',
      'Recette_de_style_femme-42.jpg',
      'Recette_de_style_femme-55.jpg',
      'Recette_de_style_femme-72.jpg'
    ]
  }
};

export async function chargerManifeste(): Promise<Manifeste> {
  if (cacheManifeste) return cacheManifeste;
  try {
    const res = await fetch('/documents.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Manifeste documents.json introuvable');
    cacheManifeste = (await res.json()) as Manifeste;
    return cacheManifeste;
  } catch (e) {
    console.warn('Utilisation du manifeste de repli pour assocolor et style:', e);
    cacheManifeste = FALLBACK_MANIFEST;
    return cacheManifeste;
  }
}

/**
 * List available visual boards for Association de Couleur or Recette de Style according to genre
 */
export async function listerDocuments(
  categorie: 'assocolor' | 'style',
  genre: Genre
): Promise<DocumentPdf[]> {
  const manifeste = await chargerManifeste();
  const fichiers = manifeste?.[categorie]?.[genre] ?? FALLBACK_MANIFEST?.[categorie]?.[genre] ?? [];
  return fichiers.map((fichier) => ({
    fichier,
    chemin: `/${categorie}/${genre}/${fichier}`,
    titre: embellirTitre(fichier)
  }));
}

/**
 * Build the exact diagnostic summary text matching the Ludidiag standard
 */
export function construireTexte(p: LudiClientProfil): string {
  const ligne = (l: string, v: string) => `${l.padEnd(18, ' ')}: ${v || '—'}`;
  return [
    'FICHE DIAGNOSTIC IMAGE — CONSEIL EN IMAGE',
    '='.repeat(45),
    '',
    'PROFIL CLIENT',
    '-'.repeat(45),
    ligne('Nom', p.nom),
    ligne('Prénom', p.prenom),
    ligne('Âge', p.age),
    ligne('Adresse', p.adresse),
    ligne('Code postal', p.codePostal),
    ligne('Ville', p.ville),
    ligne('Téléphone', p.telephone),
    ligne('Email', p.email),
    ligne('Genre', p.genre === 'homme' ? 'Homme' : p.genre === 'femme' ? 'Femme' : '—'),
    '',
    'ASSOCIATION DE COULEUR',
    '-'.repeat(45),
    ...(p.couleurs.length
      ? p.couleurs.map((f) => `• ${embellirTitre(f)} (${f})`)
      : ['• Aucune sélection']),
    '',
    'RECETTE DE STYLE',
    '-'.repeat(45),
    ...(p.styles.length
      ? p.styles.map((f) => `• ${embellirTitre(f)} (${f})`)
      : ['• Aucune sélection']),
    '',
    `Diagnostic réalisé le ${new Date(p.creeLe).toLocaleDateString('fr-FR')} à ${new Date(p.creeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    '='.repeat(45)
  ].join('\n');
}

const nettoyerNomFichier = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .trim() || 'Client';

/**
 * Trigger immediate download of the diagnostic text sheet
 */
export function telechargerFiche(p: LudiClientProfil) {
  const contenu = construireTexte(p);
  const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Diagnostic_${nettoyerNomFichier(p.nom)}_${nettoyerNomFichier(p.prenom)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Resolve display path for an image file based on category and genre
 */
export function resoudreCheminDocument(
  categorie: 'assocolor' | 'style',
  genre: Genre | string | undefined,
  fichier: string
): string {
  if (fichier.startsWith('http://') || fichier.startsWith('https://') || fichier.startsWith('/')) {
    return fichier;
  }
  const cleanGenre = genre === 'homme' ? 'homme' : 'femme';
  return `/${categorie}/${cleanGenre}/${fichier}`;
}

/**
 * Trigger immediate download of the diagnostic text sheet from a ClientProfile
 */
export function telechargerFicheDepuisClient(client: Partial<ClientProfile>) {
  const profil: LudiClientProfil = {
    id: client.id || 'cli',
    nom: client.lastName || '',
    prenom: client.firstName || '',
    age: client.age || '',
    adresse: client.adresse || '',
    codePostal: client.codePostal || '',
    ville: client.ville || '',
    telephone: client.phone || '',
    email: client.email || '',
    genre: (client.genre as Genre) || '',
    couleurs: client.couleurs || [],
    styles: client.styles || [],
    creeLe: client.createdAt || new Date().toISOString()
  };
  telechargerFiche(profil);
}

/**
 * Save diagnostic profile in Firestore under the coach workspace
 */
export async function enregistrerDiagnosticEnBase(
  workspaceId: string,
  coachId: string,
  profil: LudiClientProfil
): Promise<string> {
  const clientsRef = collection(db, 'workspaces', workspaceId, 'clients');
  
  // Format into standard THRYVE ClientProfile
  const clientData: Omit<ClientProfile, 'id'> = {
    workspaceId,
    coachId,
    firstName: profil.prenom.trim(),
    lastName: profil.nom.trim(),
    email: profil.email.trim(),
    phone: profil.telephone.trim() || undefined,
    age: profil.age.trim() || undefined,
    adresse: profil.adresse.trim() || undefined,
    codePostal: profil.codePostal.trim() || undefined,
    ville: profil.ville.trim() || undefined,
    genre: (profil.genre as Genre) || undefined,
    couleurs: profil.couleurs,
    styles: profil.styles,
    status: 'completed',
    notes: `Diagnostic Image réalisé le ${new Date().toLocaleDateString('fr-FR')}.`,
    createdAt: profil.creeLe || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const clientDoc = await addDoc(clientsRef, clientData);

  // Also create a completed assignment record for historical traceability
  const assignmentsRef = collection(db, 'workspaces', workspaceId, 'assignments');
  await addDoc(assignmentsRef, {
    workspaceId,
    coachId,
    clientId: clientDoc.id,
    clientName: `${profil.prenom} ${profil.nom}`.trim(),
    moduleId: 'mod_diagnostic_image_ludidiag',
    title: 'Diagnostic Image (Couleurs & Recettes de Style)',
    status: 'completed',
    shareToken: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    responses: {
      age: profil.age,
      genre: profil.genre,
      adresse: profil.adresse,
      codePostal: profil.codePostal,
      ville: profil.ville,
      telephone: profil.telephone,
      email: profil.email,
      couleurs: profil.couleurs,
      styles: profil.styles
    },
    resultsSummary: {
      genre: profil.genre,
      couleursCount: profil.couleurs.length,
      stylesCount: profil.styles.length,
      completedDate: new Date().toISOString()
    },
    completedAt: new Date().toISOString(),
    createdAt: profil.creeLe || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return clientDoc.id;
}
