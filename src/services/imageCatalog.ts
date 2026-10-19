import { db, storage, storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { ImageItem, StyleUniverse, ImageCategory, ImageScope } from '../types';

/**
 * Standard reference style universes for image consulting
 */
export const DEFAULT_STYLE_UNIVERSES: StyleUniverse[] = [
  {
    id: 'univ_casual_natural',
    code: 'casual_natural',
    name: 'Naturel & Décontracté',
    description: 'Style privilégiant le confort, les fibres naturelles, la fluidité des coupes et la simplicité de l\'allure.',
    keyTraits: ['Confort', 'Fibres naturelles', 'Fluidité', 'Simplicité', 'Spontanéité'],
    dominantColors: ['#D4B996', '#556B2F', '#F5F5DC', '#8B4513'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_classic_timeless',
    code: 'classic_timeless',
    name: 'Classique & Intemporel',
    description: 'Élégance sobre, coupes structurées, matières nobles et pièces pérennes qui traversent les modes.',
    keyTraits: ['Structure', 'Sobriété', 'Pérennité', 'Maintien', 'Discrétion'],
    dominantColors: ['#000080', '#FFFFFF', '#808080', '#B22222'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_creative_bohemian',
    code: 'creative_bohemian',
    name: 'Créatif & Bohème',
    description: 'Univers d\'expression personnelle, mélanges d\'imprimés, superpositions, textures artisanales et liberté.',
    keyTraits: ['Originalité', 'Superpositions', 'Mélange d\'imprimés', 'Textures', 'Liberté'],
    dominantColors: ['#CC5500', '#E2725B', '#9932CC', '#D2B48C'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_sophisticated_chic',
    code: 'sophisticated_chic',
    name: 'Sophistiqué & Chic',
    description: 'Raffinement soigné, finitions haut de gamme, accessoires soignés et prestance maîtrisée.',
    keyTraits: ['Raffinement', 'Finitions impeccables', 'Matières soyeuses', 'Prestance'],
    dominantColors: ['#000000', '#D4AF37', '#4A0E17', '#FDF5E6'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_dramatic_bold',
    code: 'dramatic_bold',
    name: 'Dramatique & Audacieux',
    description: 'Lignes architecturales, contrastes marqués, volumes affirmés et présence visuelle percutante.',
    keyTraits: ['Contrastes puissants', 'Volumes sculpturaux', 'Avant-garde', 'Affirmation'],
    dominantColors: ['#000000', '#FF0000', '#4B0082', '#FFFFFF'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_minimal_modern',
    code: 'minimal_modern',
    name: 'Minimaliste & Épuré',
    description: 'Recherche de la ligne pure, absence d\'artifice, palettes monochromes et fonctionnalisme moderne.',
    keyTraits: ['Lignes pures', 'Monochrome', 'Précision', 'Modernité', 'Less is more'],
    dominantColors: ['#2F4F4F', '#DCDCDC', '#000000', '#708090'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_romantic_soft',
    code: 'romantic_soft',
    name: 'Romantique & Délicat',
    description: 'Nuances poudrées, matières aériennes, détails de dentelle, délicatesse et féminité sensible.',
    keyTraits: ['Douceur', 'Nuances pastel', 'Volants & dentelles', 'Aérien', 'Sensibilité'],
    dominantColors: ['#FFC0CB', '#E6E6FA', '#FFF0F5', '#B0E0E6'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'univ_sunny_vibrant',
    code: 'sunny_vibrant',
    name: 'Solaire & Lumineux',
    description: 'Teintes chaudes et chatoyantes, spontanéité, énergie rayonnante et vitalité naturelle.',
    keyTraits: ['Rayonnement', 'Couleurs chaudes', 'Énergie', 'Chaleur humaine', 'Spontanéité'],
    dominantColors: ['#FFD700', '#FF8C00', '#FF4500', '#FFF8DC'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const IMAGE_CATEGORIES: { id: ImageCategory; label: string; description: string }[] = [
  { id: 'look_complet', label: 'Look complet', description: 'Silhouette entière ou tenue composée' },
  { id: 'haut', label: 'Hauts & Vestes', description: 'Tops, chemises, vestes, blazers, manteaux' },
  { id: 'bas', label: 'Bas & Pantalons', description: 'Pantalons, jupes, bermudas' },
  { id: 'chaussures', label: 'Chaussures', description: 'Escarpins, bottes, sneakers, derbies' },
  { id: 'accessoire', label: 'Accessoires & Bijoux', description: 'Sacs, ceintures, bijoux, écharpes' },
  { id: 'texture_matiere', label: 'Textures & Matières', description: 'Soie, lin, cuir, denim, cachemire' },
  { id: 'colorimetrie_palette', label: 'Colorimétrie & Palettes', description: 'Harmonies de tons, nuanciers de saisons' },
  { id: 'moodboard', label: 'Moodboard & Inspiration', description: 'Planches d\'ambiance et inspirations globales' },
  { id: 'autre', label: 'Autres visuels', description: 'Visuels divers' }
];

export interface UploadImageParams {
  workspaceId: string;
  coachId: string;
  title?: string;
  displayName?: string;
  originalFilename?: string;
  category: ImageCategory | string;
  description?: string;
  styleUniverseIds: string[];
  tags: string[];
}

/**
 * Extract clean display name from filename without extension
 * e.g. "Robe_rouge_coupe_droite_01.jpg" -> "Robe_rouge_coupe_droite_01"
 */
export function extractDisplayName(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex <= 0) return filename;
  return filename.substring(0, lastDotIndex);
}

/**
 * Validate image file format and size (< 5MB, JPG/PNG/WebP)
 */
export function validateImageFile(file: File): { valid: boolean; reason?: string } {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const hasValidExt = allowedExtensions.includes(ext);
  const hasValidType = !file.type || allowedTypes.includes(file.type);

  if (!hasValidExt || !hasValidType) {
    return {
      valid: false,
      reason: `Format non supporté ("${ext || file.type || 'inconnu'}"). Seuls JPG, PNG et WebP sont acceptés.`
    };
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    const sizeMo = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      reason: `Fichier trop volumineux (${sizeMo} Mo). La limite maximale autorisée est de 5 Mo.`
    };
  }

  return { valid: true };
}

/**
 * Fetch all style universes (system default merged with any custom ones in Firestore)
 */
export async function fetchStyleUniverses(workspaceId?: string): Promise<StyleUniverse[]> {
  try {
    const universesRef = collection(db, 'styleUniverses');
    const snap = await getDocs(universesRef);
    
    if (snap.empty) {
      return DEFAULT_STYLE_UNIVERSES;
    }

    const firestoreUniverses: StyleUniverse[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as Omit<StyleUniverse, 'id'>;
      if ((data as any).isSystem || (workspaceId && (data as any).workspaceId === workspaceId)) {
        firestoreUniverses.push({ id: doc.id, ...data });
      }
    });

    // Merge system defaults with custom
    const existingIds = new Set(firestoreUniverses.map(u => u.id));
    const merged = [
      ...firestoreUniverses,
      ...DEFAULT_STYLE_UNIVERSES.filter(u => !existingIds.has(u.id))
    ];

    return merged;
  } catch (error) {
    console.warn('Could not fetch styleUniverses from Firestore, using standard defaults:', error);
    return DEFAULT_STYLE_UNIVERSES;
  }
}

/**
 * Fetch both cabinet private images and platform system images
 */
export async function fetchCatalogImages(workspaceId: string): Promise<ImageItem[]> {
  const images: ImageItem[] = [];

  // 1. Fetch cabinet private images
  try {
    const wsImagesRef = collection(db, 'workspaces', workspaceId, 'images');
    const snap = await getDocs(query(wsImagesRef, orderBy('createdAt', 'desc')));
    snap.forEach((doc) => {
      images.push({ id: doc.id, ...(doc.data() as Omit<ImageItem, 'id'>) });
    });
  } catch (err) {
    console.error('Error fetching cabinet images:', err);
  }

  // 2. Fetch platform system shared images
  try {
    const sysImagesRef = collection(db, 'systemImages');
    const sysSnap = await getDocs(sysImagesRef);
    sysSnap.forEach((doc) => {
      images.push({ id: doc.id, ...(doc.data() as Omit<ImageItem, 'id'>) });
    });
  } catch (err) {
    // Non-blocking if systemImages is empty
  }

  return images;
}

/**
 * Read image file dimensions in browser
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 800, height: 800 });
    };
    img.src = url;
  });
}

/**
 * Upload an image to the coach's private cabinet catalog
 */
export async function uploadWorkspaceImage(
  file: File,
  params: UploadImageParams,
  onProgress?: (percent: number) => void
): Promise<ImageItem> {
  // 1. Validation checks
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // 2. Extract dimensions
  const dimensions = await getImageDimensions(file);

  // 3. Prepare unique ID & storage path
  // Preserving original filename reference while keeping storage filename collision-free
  const originalFilename = params.originalFilename || file.name;
  const displayName = params.displayName || extractDisplayName(originalFilename);
  const title = params.title || displayName;

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const imageId = `img_${timestamp}_${randomSuffix}`;
  const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `workspaces/${params.workspaceId}/catalog/${imageId}_${sanitizedName}`;

  // 4. Upload to Firebase Storage with strict metadata verification
  const fileRef = storageRef(storage, storagePath);
  const uploadTask = uploadBytesResumable(fileRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      workspaceId: params.workspaceId,
      coachId: params.coachId,
      title: title,
      originalFilename: originalFilename
    }
  });

  let downloadUrl = '';
  try {
    downloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (storageErr: any) {
    console.error('Firebase Storage upload error:', storageErr);
    const errorMsg = storageErr?.code === 'storage/unauthorized'
      ? 'Accès refusé par Firebase Storage : vous n\'avez pas les permissions requises pour ce cabinet.'
      : (storageErr?.message || 'Erreur lors du téléversement du fichier sur Firebase Storage.');
    throw new Error(errorMsg);
  }

  // 5. Persist image metadata in Firestore: /workspaces/{wsId}/images/{imageId}
  const imageItem: ImageItem = {
    id: imageId,
    workspaceId: params.workspaceId,
    scope: 'workspace',
    title: title.trim(),
    displayName: displayName.trim(),
    originalFilename: originalFilename,
    description: params.description?.trim() || undefined,
    category: params.category,
    styleUniverseIds: params.styleUniverseIds,
    tags: params.tags.map(t => t.trim().toLowerCase()).filter(Boolean),
    storagePath,
    downloadUrl,
    metadata: {
      width: dimensions.width,
      height: dimensions.height,
      sizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      format: (originalFilename.split('.').pop() || 'jpg').toLowerCase()
    },
    createdAt: new Date().toISOString(),
    createdBy: params.coachId
  };

  const imageDocRef = doc(db, 'workspaces', params.workspaceId, 'images', imageId);
  try {
    await setDoc(imageDocRef, imageItem);
  } catch (firestoreErr) {
    console.error('Firestore save failed after Storage upload, cleaning up storage file:', firestoreErr);
    // Cleanup orphan storage file if Firestore fails
    try {
      await deleteObject(fileRef);
    } catch (cleanupErr) {
      console.warn('Orphan storage file cleanup warning:', cleanupErr);
    }
    throw firestoreErr;
  }

  return imageItem;
}

export interface BatchItemProgress {
  id: string;
  file: File;
  relativePath?: string;
  originalFilename: string;
  displayName: string;
  status: 'pending' | 'uploading' | 'success' | 'skipped' | 'error';
  progress: number;
  reason?: string;
  imageItem?: ImageItem;
}

export interface BatchUploadState {
  total: number;
  completed: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  overallPercent: number;
  items: BatchItemProgress[];
  isDone: boolean;
}

/**
 * Batch upload images with a concurrency pool (default 3 concurrent uploads),
 * non-blocking error handling, skipped file tracking, and progress reporting.
 */
export async function batchUploadWorkspaceImages(
  files: File[],
  params: Omit<UploadImageParams, 'title' | 'displayName' | 'originalFilename'>,
  onStateChange: (state: BatchUploadState) => void,
  concurrencyLimit = 3
): Promise<BatchUploadState> {
  const items: BatchItemProgress[] = files.map((file, idx) => ({
    id: `batch_${idx}_${Date.now()}_${file.name}`,
    file,
    relativePath: (file as any).webkitRelativePath || undefined,
    originalFilename: file.name,
    displayName: extractDisplayName(file.name),
    status: 'pending',
    progress: 0
  }));

  const state: BatchUploadState = {
    total: items.length,
    completed: 0,
    successCount: 0,
    skippedCount: 0,
    errorCount: 0,
    overallPercent: 0,
    items,
    isDone: false
  };

  const updateGlobalProgress = () => {
    state.completed = state.successCount + state.skippedCount + state.errorCount;
    state.overallPercent = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 100;
    onStateChange({ ...state, items: [...state.items] });
  };

  // Pre-filter: identify invalid formats or oversize files immediately
  for (const item of items) {
    const val = validateImageFile(item.file);
    if (!val.valid) {
      item.status = 'skipped';
      item.progress = 100;
      item.reason = val.reason;
      state.skippedCount++;
    }
  }
  updateGlobalProgress();

  // Process pending files with concurrency pool
  const pendingQueue = items.filter(item => item.status === 'pending');
  let activeIndex = 0;

  async function worker() {
    while (activeIndex < pendingQueue.length) {
      const currentItem = pendingQueue[activeIndex++];
      currentItem.status = 'uploading';
      currentItem.progress = 10;
      onStateChange({ ...state, items: [...state.items] });

      try {
        const uploadedItem = await uploadWorkspaceImage(
          currentItem.file,
          {
            workspaceId: params.workspaceId,
            coachId: params.coachId,
            category: params.category,
            styleUniverseIds: params.styleUniverseIds,
            tags: params.tags,
            description: params.description,
            originalFilename: currentItem.originalFilename,
            displayName: currentItem.displayName
          },
          (percent) => {
            currentItem.progress = percent;
            onStateChange({ ...state, items: [...state.items] });
          }
        );

        currentItem.status = 'success';
        currentItem.progress = 100;
        currentItem.imageItem = uploadedItem;
        state.successCount++;
      } catch (err: any) {
        currentItem.status = 'error';
        currentItem.progress = 100;
        currentItem.reason = err?.message || 'Erreur de téléversement';
        state.errorCount++;
      }

      updateGlobalProgress();
    }
  }

  const workerCount = Math.min(concurrencyLimit, pendingQueue.length);
  if (workerCount > 0) {
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);
  }

  state.isDone = true;
  updateGlobalProgress();
  return state;
}

/**
 * Delete a private image from workspace catalog
 */
export async function deleteWorkspaceImage(
  workspaceId: string, 
  imageId: string, 
  storagePath?: string
): Promise<void> {
  // 1. Delete from Firestore
  const docRef = doc(db, 'workspaces', workspaceId, 'images', imageId);
  await deleteDoc(docRef);

  // 2. Try delete from Firebase Storage if storagePath exists
  if (storagePath) {
    try {
      const fileRef = storageRef(storage, storagePath);
      await deleteObject(fileRef);
    } catch (e) {
      console.warn('Could not delete file from Firebase Storage:', e);
    }
  }
}
