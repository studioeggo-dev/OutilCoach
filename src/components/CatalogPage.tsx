import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';
import { ImageItem, StyleUniverse, ImageCategory, ImageScope } from '../types';
import { 
  fetchCatalogImages, 
  fetchStyleUniverses, 
  uploadWorkspaceImage, 
  deleteWorkspaceImage,
  batchUploadWorkspaceImages,
  validateImageFile,
  extractDisplayName,
  BatchUploadState,
  IMAGE_CATEGORIES 
} from '../services/imageCatalog';
import { 
  Images, 
  Upload, 
  FolderUp,
  FilePlus,
  Search, 
  Filter, 
  Tag, 
  Eye, 
  Trash2, 
  Sparkles, 
  Lock, 
  Globe, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileImage,
  Folder,
  Layers,
  ChevronDown
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { user, workspace } = useAuth();
  const { brand } = useWorkspaceTheme();

  // State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [styleUniverses, setStyleUniverses] = useState<StyleUniverse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<'all' | ImageScope>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('all');

  // Input refs for multi-file and folder selection
  const multipleFilesInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Batch Upload Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatchFiles, setSelectedBatchFiles] = useState<File[]>([]);
  const [batchCategory, setBatchCategory] = useState<ImageCategory>('look_complet');
  const [batchUniverseIds, setBatchUniverseIds] = useState<string[]>([]);
  const [batchTagsInput, setBatchTagsInput] = useState('');
  const [batchState, setBatchState] = useState<BatchUploadState | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchFilterTab, setBatchFilterTab] = useState<'all' | 'success' | 'skipped' | 'error'>('all');

  // Detail Modal State
  const [selectedDetailImage, setSelectedDetailImage] = useState<ImageItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [workspace?.id]);

  const loadData = async () => {
    if (!workspace?.id) return;
    try {
      setLoading(true);
      const [loadedUniverses, loadedImages] = await Promise.all([
        fetchStyleUniverses(workspace.id),
        fetchCatalogImages(workspace.id)
      ]);
      setStyleUniverses(loadedUniverses);
      setImages(loadedImages);
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if browser supports folder selection (webkitdirectory)
  const isFolderUploadSupported = typeof document !== 'undefined' && 'webkitdirectory' in document.createElement('input');

  // Multi-file selection handler
  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      openBatchModalWithFiles(filesArray);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  // Folder selection handler
  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      openBatchModalWithFiles(filesArray);
      e.target.value = '';
    }
  };

  const openBatchModalWithFiles = (files: File[]) => {
    setSelectedBatchFiles(files);
    setBatchState(null);
    setIsBatchRunning(false);
    setBatchFilterTab('all');
    setShowBatchModal(true);
  };

  const toggleBatchUniverse = (univId: string) => {
    setBatchUniverseIds(prev => 
      prev.includes(univId) ? prev.filter(id => id !== univId) : [...prev, univId]
    );
  };

  // Start the batch upload execution
  const startBatchUpload = async () => {
    if (!workspace?.id || !user?.uid || selectedBatchFiles.length === 0) return;

    try {
      setIsBatchRunning(true);
      const tags = batchTagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const finalState = await batchUploadWorkspaceImages(
        selectedBatchFiles,
        {
          workspaceId: workspace.id,
          coachId: user.uid,
          category: batchCategory,
          styleUniverseIds: batchUniverseIds,
          tags
        },
        (updatedState) => {
          setBatchState(updatedState);
        },
        3 // Concurrency limit of 3
      );

      setBatchState(finalState);

      // Prepend successful uploads to current catalog view
      const newItems: ImageItem[] = [];
      finalState.items.forEach(it => {
        if (it.status === 'success' && it.imageItem) {
          newItems.push(it.imageItem);
        }
      });

      if (newItems.length > 0) {
        setImages(prev => [...newItems, ...prev]);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const closeBatchModal = () => {
    if (isBatchRunning) {
      if (!window.confirm('Une importation est en cours. Fermer cette fenêtre continuera le traitement en arrière-plan.')) {
        return;
      }
    }
    setShowBatchModal(false);
    setSelectedBatchFiles([]);
    setBatchState(null);
  };

  const handleDeleteImage = async (image: ImageItem) => {
    if (!workspace?.id) return;
    if (image.scope === 'system') {
      alert('Les visuels du catalogue partagé THRYVE ne peuvent pas être supprimés.');
      return;
    }

    const displayName = image.displayName || image.title;
    if (!window.confirm(`Supprimer définitivement l'image "${displayName}" (${image.originalFilename || 'fichier'}) de votre cabinet ?`)) {
      return;
    }

    try {
      setDeletingId(image.id);
      await deleteWorkspaceImage(workspace.id, image.id, image.storagePath);
      setImages(prev => prev.filter(img => img.id !== image.id));
      if (selectedDetailImage?.id === image.id) {
        setSelectedDetailImage(null);
      }
    } catch (err) {
      console.error('Delete image error:', err);
      alert('Impossible de supprimer cette image. Vérifiez vos permissions.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered images
  const filteredImages = images.filter(img => {
    // Search query matches title, displayName, originalFilename, description or tags
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = img.title?.toLowerCase().includes(q);
      const matchDisplay = img.displayName?.toLowerCase().includes(q);
      const matchOriginal = img.originalFilename?.toLowerCase().includes(q);
      const matchDesc = img.description?.toLowerCase().includes(q);
      const matchTags = img.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDisplay && !matchOriginal && !matchDesc && !matchTags) return false;
    }

    // Scope filter
    if (selectedScope !== 'all' && img.scope !== selectedScope) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && img.category !== selectedCategory) {
      return false;
    }

    // Style universe filter
    if (selectedUniverseId !== 'all') {
      if (!img.styleUniverseIds?.includes(selectedUniverseId)) {
        return false;
      }
    }

    return true;
  });

  // Calculate stats for pre-upload view
  const validFilesCount = selectedBatchFiles.filter(f => validateImageFile(f).valid).length;
  const invalidFilesCount = selectedBatchFiles.length - validFilesCount;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={multipleFilesInputRef}
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleMultipleFilesChange}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        multiple
        // @ts-ignore
        webkitdirectory=""
        directory=""
        onChange={handleFolderChange}
        className="hidden"
      />

      {/* Header with Title and Distinct Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
              Catalogue d'Images & Référentiel de Styles
            </h2>
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Photothèque Métier
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Importez et organisez les visuels de votre cabinet par lot ou par dossier. Le nom original de chaque fichier est conservé comme référence métier.
          </p>
        </div>

        {/* Action Buttons: Multi-file & Folder Upload */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Button A: Importer des images */}
          <button
            onClick={() => multipleFilesInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-all hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <FilePlus className="w-4 h-4" />
            <span>Importer des images</span>
          </button>

          {/* Button B: Importer un dossier */}
          <button
            onClick={() => {
              if (isFolderUploadSupported) {
                folderInputRef.current?.click();
              } else {
                alert('La sélection directe de dossiers complets n\'est pas prise en charge par ce navigateur. Veuillez utiliser le bouton « Importer des images » qui accepte la sélection multiple.');
                multipleFilesInputRef.current?.click();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <FolderUp className="w-4 h-4 text-stone-600" />
            <span>Importer un dossier</span>
          </button>
        </div>
      </div>

      {/* Control Bar / Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par nom original, nom d'affichage, mot-clé, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
            />
          </div>

          {/* Scope filter */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl text-xs font-medium text-stone-600">
            <button
              onClick={() => setSelectedScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedScope === 'all' ? 'bg-white text-stone-900 font-semibold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Toutes ({images.length})
            </button>
            <button
              onClick={() => setSelectedScope('workspace')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedScope === 'workspace' ? 'bg-white text-stone-900 font-semibold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              <Lock className="w-3 h-3 text-stone-500" />
              <span>Cabinet ({images.filter(i => i.scope === 'workspace').length})</span>
            </button>
            <button
              onClick={() => setSelectedScope('system')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedScope === 'system' ? 'bg-white text-stone-900 font-semibold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              <Globe className="w-3 h-3 text-stone-500" />
              <span>Système ({images.filter(i => i.scope === 'system').length})</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters: Category & Style Universe */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <span className="text-stone-400 font-medium flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" />
            <span>Filtres :</span>
          </span>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-800"
          >
            <option value="all">Toutes les catégories</option>
            {IMAGE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          {/* Style Universe Dropdown */}
          <select
            value={selectedUniverseId}
            onChange={(e) => setSelectedUniverseId(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-800"
          >
            <option value="all">Tous les univers de style</option>
            {styleUniverses.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {(selectedCategory !== 'all' || selectedUniverseId !== 'all' || searchQuery || selectedScope !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedUniverseId('all');
                setSearchQuery('');
                setSelectedScope('all');
              }}
              className="text-[11px] text-stone-500 hover:text-stone-800 underline ml-auto"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" />
            <p className="text-xs text-stone-500">Chargement de la bibliothèque d'images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <Images className="w-7 h-7 text-stone-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-stone-900 font-serif">
                {images.length === 0 
                  ? 'Votre photothèque est prête' 
                  : 'Aucune image ne correspond à ces critères'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {images.length === 0
                  ? 'Importez vos premiers dossiers de tenues, silhouettes ou matières pour constituer votre catalogue de conseil en image.'
                  : 'Essayez de modifier votre recherche ou de réinitialiser les filtres.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => multipleFilesInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs"
                style={{ backgroundColor: brand.primaryColor }}
              >
                <FilePlus className="w-4 h-4" />
                <span>Importer des images</span>
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-xs"
              >
                <FolderUp className="w-4 h-4" />
                <span>Importer un dossier</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredImages.map((image) => {
              const matchedUniverse = styleUniverses.find(u => image.styleUniverseIds?.includes(u.id));
              const categoryObj = IMAGE_CATEGORIES.find(c => c.id === image.category);
              const displayName = image.displayName || image.title;

              return (
                <div
                  key={image.id}
                  onClick={() => setSelectedDetailImage(image)}
                  className="group relative bg-stone-50 rounded-xl overflow-hidden border border-stone-200/80 hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* Image Container with 4:5 aspect ratio */}
                  <div className="relative aspect-[4/5] bg-stone-200 overflow-hidden">
                    <img
                      src={image.downloadUrl}
                      alt={displayName}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Scope Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md bg-stone-900/75 text-white">
                      {image.scope === 'workspace' ? (
                        <>
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Cabinet</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-2.5 h-2.5 text-sky-400" />
                          <span>THRYVE</span>
                        </>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-stone-900 text-xs font-semibold shadow-sm">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Détails</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-stone-900 text-xs truncate" title={displayName}>
                        {displayName}
                      </h4>
                      {image.originalFilename && (
                        <p className="text-[10px] text-stone-400 truncate" title={image.originalFilename}>
                          {image.originalFilename}
                        </p>
                      )}
                      <p className="text-[11px] text-stone-500 truncate pt-0.5">
                        {categoryObj?.label || image.category}
                      </p>
                    </div>

                    {matchedUniverse && (
                      <div className="pt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                        <span className="text-[10px] text-stone-600 truncate font-medium">
                          {matchedUniverse.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Batch Upload / Folder Upload */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-stone-800" />
                <div>
                  <h3 className="font-semibold text-stone-900 text-base font-serif">
                    Importation Multiple d'Images
                  </h3>
                  <p className="text-xs text-stone-500">
                    {selectedBatchFiles.length} fichier{selectedBatchFiles.length > 1 ? 's' : ''} sélectionné{selectedBatchFiles.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeBatchModal}
                disabled={isBatchRunning}
                className="text-stone-400 hover:text-stone-700 text-sm font-semibold p-1 disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Pre-upload Options (only if not yet started) */}
              {!batchState && (
                <div className="space-y-4">
                  {/* File pre-check summary */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                      <span>Analyse préliminaire des fichiers</span>
                      <span className="font-normal text-stone-500">
                        {validFilesCount} image{validFilesCount > 1 ? 's' : ''} compatible{validFilesCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{validFilesCount} images JPG/PNG/WebP (&le; 5 Mo)</span>
                      </div>
                      {invalidFilesCount > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{invalidFilesCount} fichier{invalidFilesCount > 1 ? 's' : ''} incompatible{invalidFilesCount > 1 ? 's' : ''} ignoré{invalidFilesCount > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch Category selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Catégorie pour ce lot *
                    </label>
                    <select
                      value={batchCategory}
                      onChange={(e) => setBatchCategory(e.target.value as ImageCategory)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white"
                    >
                      {IMAGE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} — ({cat.description})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Style Universes selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                      Associer à un univers de style (Optionnel)
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-stone-200 rounded-xl bg-stone-50/50">
                      {styleUniverses.map(univ => {
                        const isSelected = batchUniverseIds.includes(univ.id);
                        return (
                          <label
                            key={univ.id}
                            onClick={() => toggleBatchUniverse(univ.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="hidden"
                            />
                            <span className="truncate">{univ.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batch Tags */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                      Mots-clés / Tags communs (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={batchTagsInput}
                      onChange={(e) => setBatchTagsInput(e.target.value)}
                      placeholder="ex. collection_ete, tendance, basiques"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>
                </div>
              )}

              {/* Progress & Queue View (while running or finished) */}
              {batchState && (
                <div className="space-y-4">
                  {/* Global Progress Bar */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                      <span>Progression globale : {batchState.completed} / {batchState.total} fichiers</span>
                      <span>{batchState.overallPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-200 rounded-full"
                        style={{
                          width: `${batchState.overallPercent}%`,
                          backgroundColor: brand.primaryColor
                        }}
                      />
                    </div>

                    {/* Counters */}
                    <div className="flex items-center gap-4 pt-1 text-[11px] font-medium text-stone-600">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {batchState.successCount} importée{batchState.successCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {batchState.skippedCount} ignorée{batchState.skippedCount > 1 ? 's' : ''}
                      </span>
                      {batchState.errorCount > 0 && (
                        <span className="text-red-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {batchState.errorCount} échec{batchState.errorCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Queue Filter Tabs */}
                  <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 text-xs">
                    <button
                      onClick={() => setBatchFilterTab('all')}
                      className={`px-2.5 py-1 rounded-lg ${batchFilterTab === 'all' ? 'bg-stone-900 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'}`}
                    >
                      Tous ({batchState.items.length})
                    </button>
                    <button
                      onClick={() => setBatchFilterTab('success')}
                      className={`px-2.5 py-1 rounded-lg ${batchFilterTab === 'success' ? 'bg-emerald-800 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'}`}
                    >
                      Succès ({batchState.successCount})
                    </button>
                    <button
                      onClick={() => setBatchFilterTab('skipped')}
                      className={`px-2.5 py-1 rounded-lg ${batchFilterTab === 'skipped' ? 'bg-amber-800 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'}`}
                    >
                      Ignorés ({batchState.skippedCount})
                    </button>
                    {batchState.errorCount > 0 && (
                      <button
                        onClick={() => setBatchFilterTab('error')}
                        className={`px-2.5 py-1 rounded-lg ${batchFilterTab === 'error' ? 'bg-red-800 text-white font-semibold' : 'text-stone-600 hover:bg-stone-100'}`}
                      >
                        Échecs ({batchState.errorCount})
                      </button>
                    )}
                  </div>

                  {/* Queue Items List */}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {batchState.items
                      .filter(item => batchFilterTab === 'all' || item.status === batchFilterTab)
                      .map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 text-xs"
                        >
                          <div className="min-w-0 pr-3 flex-1">
                            <p className="font-semibold text-stone-900 truncate" title={item.originalFilename}>
                              {item.originalFilename}
                            </p>
                            <p className="text-[10px] text-stone-400 truncate">
                              Nom d'affichage : {item.displayName}
                              {item.relativePath && ` • ${item.relativePath}`}
                            </p>
                            {item.reason && (
                              <p className="text-[10px] text-amber-700 truncate mt-0.5">
                                {item.reason}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {item.status === 'pending' && (
                              <span className="text-[10px] font-medium text-stone-400 px-2 py-0.5 rounded-md bg-stone-100">
                                En attente
                              </span>
                            )}
                            {item.status === 'uploading' && (
                              <span className="text-[10px] font-medium text-sky-700 px-2 py-0.5 rounded-md bg-sky-50 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {item.progress}%
                              </span>
                            )}
                            {item.status === 'success' && (
                              <span className="text-[10px] font-medium text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Importé
                              </span>
                            )}
                            {item.status === 'skipped' && (
                              <span className="text-[10px] font-medium text-amber-700 px-2 py-0.5 rounded-md bg-amber-50">
                                Ignoré
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-[10px] font-medium text-red-700 px-2 py-0.5 rounded-md bg-red-50 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Échec
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Completion Notice */}
                  {batchState.isDone && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold">Importation terminée !</p>
                        <p className="text-emerald-700 text-[11px]">
                          {batchState.successCount} image{batchState.successCount > 1 ? 's ont' : ' a'} été ajoutée{batchState.successCount > 1 ? 's' : ''} à votre catalogue.
                          {batchState.skippedCount > 0 && ` ${batchState.skippedCount} fichier${batchState.skippedCount > 1 ? 's' : ''} incompatible${batchState.skippedCount > 1 ? 's' : ''} ignoré${batchState.skippedCount > 1 ? 's' : ''}.`}
                          {batchState.errorCount > 0 && ` ${batchState.errorCount} échec${batchState.errorCount > 1 ? 's' : ''}.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-stone-500">
                {!batchState && `${validFilesCount} image${validFilesCount > 1 ? 's' : ''} prête${validFilesCount > 1 ? 's' : ''} à être importée${validFilesCount > 1 ? 's' : ''}`}
                {batchState?.isDone && 'Opération achevée'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeBatchModal}
                  disabled={isBatchRunning}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 disabled:opacity-40"
                >
                  {batchState?.isDone ? 'Fermer' : 'Annuler'}
                </button>

                {!batchState && (
                  <button
                    type="button"
                    disabled={validFilesCount === 0 || isBatchRunning}
                    onClick={startBatchUpload}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Lancer l'importation ({validFilesCount})</span>
                  </button>
                )}

                {batchState?.isDone && (
                  <button
                    type="button"
                    onClick={closeBatchModal}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    <span>Voir dans le catalogue</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Image Detail */}
      {selectedDetailImage && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-stone-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedDetailImage.scope === 'workspace' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}>
                  {selectedDetailImage.scope === 'workspace' ? 'Visuel Cabinet Privé' : 'Catalogue Partagé THRYVE'}
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs text-stone-500 font-medium">
                  {IMAGE_CATEGORIES.find(c => c.id === selectedDetailImage.category)?.label || selectedDetailImage.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailImage(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Content: Image & Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image Preview */}
              <div className="rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center max-h-96">
                <img
                  src={selectedDetailImage.downloadUrl}
                  alt={selectedDetailImage.displayName || selectedDetailImage.title}
                  className="max-h-96 w-auto object-contain mx-auto"
                />
              </div>

              {/* Metadata Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">
                    {selectedDetailImage.displayName || selectedDetailImage.title}
                  </h3>
                  {selectedDetailImage.originalFilename && (
                    <div className="mt-1 p-2 rounded-lg bg-stone-100 font-mono text-[11px] text-stone-700 break-all flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>Fichier : {selectedDetailImage.originalFilename}</span>
                    </div>
                  )}
                  {selectedDetailImage.description && (
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                      {selectedDetailImage.description}
                    </p>
                  )}
                </div>

                {/* Style Universes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>Univers de style associés :</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDetailImage.styleUniverseIds && selectedDetailImage.styleUniverseIds.length > 0 ? (
                      selectedDetailImage.styleUniverseIds.map(uid => {
                        const univ = styleUniverses.find(u => u.id === uid);
                        return (
                          <span
                            key={uid}
                            className="px-2.5 py-1 rounded-lg text-xs bg-stone-100 text-stone-800 font-medium"
                          >
                            {univ?.name || uid}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-stone-400 italic">Non rattaché à un univers spécifique</span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {selectedDetailImage.tags && selectedDetailImage.tags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-stone-400" />
                      <span>Mots-clés / Tags :</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDetailImage.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-stone-50 border border-stone-200 text-stone-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Specs & Stable PDF References */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs text-stone-600">
                  <div className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider">
                    Références Techniques & Diagnostic
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-400">ID Image :</span>{' '}
                      <span className="font-mono text-stone-700">{selectedDetailImage.id}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Dimensions :</span>{' '}
                      <span className="font-medium text-stone-700">
                        {selectedDetailImage.metadata?.width || 'N/A'} × {selectedDetailImage.metadata?.height || 'N/A'} px
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400">Poids :</span>{' '}
                      <span className="font-medium text-stone-700">
                        {selectedDetailImage.metadata?.sizeBytes 
                          ? `${(selectedDetailImage.metadata.sizeBytes / 1024).toFixed(1)} Ko` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400">Format :</span>{' '}
                      <span className="font-medium text-stone-700 uppercase">
                        {selectedDetailImage.metadata?.format || selectedDetailImage.metadata?.mimeType?.split('/')[1] || 'Web'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400">Ajouté le :</span>{' '}
                      <span className="font-medium text-stone-700">
                        {new Date(selectedDetailImage.createdAt).toLocaleDateString('fr-FR')} à {new Date(selectedDetailImage.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button if private cabinet image */}
                {selectedDetailImage.scope === 'workspace' && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleDeleteImage(selectedDetailImage)}
                      disabled={deletingId === selectedDetailImage.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deletingId === selectedDetailImage.id ? 'Suppression...' : 'Supprimer cette image de mon cabinet'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedDetailImage(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
