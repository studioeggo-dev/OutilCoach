import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';
import { 
  Genre, 
  DocumentPdf, 
  LudiClientProfil, 
  profilVide, 
  listerDocuments, 
  embellirTitre, 
  telechargerFiche, 
  enregistrerDiagnosticEnBase 
} from '../services/ludiDiagnostic';
import { fetchCatalogImages } from '../services/imageCatalog';
import { 
  User, 
  Palette, 
  Shirt, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Download, 
  RotateCcw, 
  Eye, 
  X, 
  Loader2, 
  ImageIcon, 
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface Props {
  onGoToClients?: () => void;
  initialClient?: Partial<LudiClientProfil> | null;
}

export const DiagnosticWorkflowPage: React.FC<Props> = ({ onGoToClients, initialClient }) => {
  const { user, workspace } = useAuth();
  const { brand } = useWorkspaceTheme();

  // Workflow state
  const [etape, setEtape] = useState<number>(0);
  const [profil, setProfil] = useState<LudiClientProfil>(() => {
    if (initialClient) {
      return {
        ...profilVide(),
        ...initialClient,
        couleurs: initialClient.couleurs || [],
        styles: initialClient.styles || []
      };
    }
    return profilVide();
  });

  useEffect(() => {
    if (initialClient) {
      setProfil(prev => ({
        ...prev,
        ...initialClient,
        couleurs: initialClient.couleurs || prev.couleurs || [],
        styles: initialClient.styles || prev.styles || []
      }));
      // If client is already specified with name and genre, optionally jump to Étape 1 (Association de couleur)
      if (initialClient.nom && initialClient.prenom && initialClient.genre && etape === 0) {
        setEtape(1);
      }
    }
  }, [initialClient]);
  const [docsCouleur, setDocsCouleur] = useState<DocumentPdf[]>([]);
  const [docsStyle, setDocsStyle] = useState<DocumentPdf[]>([]);
  const [chargementDocs, setChargementDocs] = useState<boolean>(false);
  const [apercuModal, setApercuModal] = useState<{ chemin: string; titre: string } | null>(null);

  // Saving state
  const [enregistre, setEnregistre] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load documents when genre changes
  useEffect(() => {
    if (!profil.genre) {
      setDocsCouleur([]);
      setDocsStyle([]);
      return;
    }

    let isMounted = true;
    setChargementDocs(true);

    Promise.all([
      listerDocuments('assocolor', profil.genre),
      listerDocuments('style', profil.genre)
    ]).then(async ([couleurs, styles]) => {
      // Also optionally enrich with coach catalog images if available
      if (workspace?.id) {
        try {
          const catalogImages = await fetchCatalogImages(workspace.id);
          const colorCatalog = catalogImages
            .filter(img => img.category === 'colorimetrie_palette')
            .map(img => ({
              fichier: img.originalFilename || img.title,
              chemin: img.downloadUrl,
              titre: img.displayName || img.title
            }));
          const styleCatalog = catalogImages
            .filter(img => img.category === 'look_complet' || img.category === 'autre')
            .map(img => ({
              fichier: img.originalFilename || img.title,
              chemin: img.downloadUrl,
              titre: img.displayName || img.title
            }));

          if (isMounted) {
            setDocsCouleur([...couleurs, ...colorCatalog]);
            setDocsStyle([...styles, ...styleCatalog]);
          }
        } catch {
          if (isMounted) {
            setDocsCouleur(couleurs);
            setDocsStyle(styles);
          }
        }
      } else {
        if (isMounted) {
          setDocsCouleur(couleurs);
          setDocsStyle(styles);
        }
      }

      if (isMounted) setChargementDocs(false);
    });

    return () => {
      isMounted = false;
    };
  }, [profil.genre, workspace?.id]);

  const majChamp = (champ: keyof LudiClientProfil, valeur: any) => {
    setProfil((prev) => ({ ...prev, [champ]: valeur }));
  };

  const basculerSelection = (type: 'couleurs' | 'styles', fichier: string) => {
    setProfil((prev) => {
      const liste = prev[type];
      const existe = liste.includes(fichier);
      return {
        ...prev,
        [type]: existe ? liste.filter((f) => f !== fichier) : [...liste, fichier]
      };
    });
  };

  const profilValide = Boolean(
    profil.nom.trim() &&
    profil.prenom.trim() &&
    profil.genre
  );

  const recommencer = () => {
    if (window.confirm('Voulez-vous réinitialiser le diagnostic en cours ?')) {
      setProfil(profilVide());
      setEtape(0);
      setEnregistre(false);
    }
  };

  const sauvegarder = async () => {
    if (!workspace?.id || !user?.uid) return;
    try {
      setIsSaving(true);
      await enregistrerDiagnosticEnBase(workspace.id, user.uid, profil);
      setEnregistre(true);
      telechargerFiche(profil);
    } catch (e) {
      console.error('Erreur enregistrement diagnostic:', e);
      alert('Impossible d\'enregistrer le diagnostic. Vos modifications restent disponibles.');
    } finally {
      setIsSaving(false);
    }
  };

  const ETAPES = [
    { id: 0, titre: 'Profil client', icone: User, desc: 'Coordonnées & Genre' },
    { id: 1, titre: 'Association de couleur', icone: Palette, desc: 'Nuanciers & Harmonies' },
    { id: 2, titre: 'Recette de style', icone: Shirt, desc: 'Lignes vestimentaires' },
    { id: 3, titre: 'Synthèse & Export', icone: FileText, desc: 'Fiche diagnostic' }
  ];

  const getDocTitre = (docs: DocumentPdf[], fichier: string) => {
    const d = docs.find((item) => item.fichier === fichier);
    return d ? d.titre : embellirTitre(fichier);
  };

  const getDocChemin = (docs: DocumentPdf[], fichier: string) => {
    const d = docs.find((item) => item.fichier === fichier);
    return d ? d.chemin : undefined;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
              Diagnostic Image & Conseil Stylistique
            </h2>
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Processus Métier
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Protocole en 4 étapes : qualification du profil, sélection des associations de couleur et des recettes de style adaptées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {etape > 0 && (
            <button
              onClick={recommencer}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {ETAPES.map((step) => {
          const Icon = step.icone;
          const actif = etape === step.id;
          const complete = etape > step.id;
          return (
            <button
              key={step.id}
              onClick={() => {
                if (step.id <= etape || (step.id === 1 && profilValide)) {
                  setEtape(step.id);
                }
              }}
              disabled={step.id > 0 && !profilValide && step.id > etape}
              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                actif
                  ? 'bg-white border-stone-800 shadow-xs ring-1 ring-stone-800'
                  : complete
                  ? 'bg-stone-50 border-stone-200 hover:bg-stone-100/70 text-stone-800'
                  : 'bg-stone-50/50 border-stone-200/60 opacity-60 cursor-not-allowed'
              }`}
            >
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  actif
                    ? 'text-white'
                    : complete
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-500'
                }`}
                style={actif ? { backgroundColor: brand.primaryColor } : {}}
              >
                {complete ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Étape {step.id + 1}
                </p>
                <p className="text-xs font-bold text-stone-900 truncate">
                  {step.titre}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: PROFIL CLIENT */}
      {etape === 0 && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              1. Informations & Profil du Client
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Renseignez les coordonnées. Le choix du genre détermine les planches de couleur et de style proposées aux étapes suivantes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={profil.nom}
                onChange={(e) => majChamp('nom', e.target.value)}
                placeholder="ex. Darval"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={profil.prenom}
                onChange={(e) => majChamp('prenom', e.target.value)}
                placeholder="ex. Éléonore"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Âge
              </label>
              <input
                type="number"
                value={profil.age}
                onChange={(e) => majChamp('age', e.target.value)}
                placeholder="ex. 34"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={profil.telephone}
                onChange={(e) => majChamp('telephone', e.target.value)}
                placeholder="ex. 06 12 34 56 78"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={profil.adresse}
                onChange={(e) => majChamp('adresse', e.target.value)}
                placeholder="ex. 14 rue de la Paix"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={profil.codePostal}
                onChange={(e) => majChamp('codePostal', e.target.value)}
                placeholder="ex. 44000"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Ville
              </label>
              <input
                type="text"
                value={profil.ville}
                onChange={(e) => majChamp('ville', e.target.value)}
                placeholder="ex. Nantes"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={profil.email}
                onChange={(e) => majChamp('email', e.target.value)}
                placeholder="ex. eleonore.darval@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>

            {/* Genre Selection */}
            <div className="sm:col-span-2 pt-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Genre sélectionné (détermine les planches de styles) *
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {(['femme', 'homme'] as const).map((g) => {
                  const estActif = profil.genre === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => majChamp('genre', g)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        estActif
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      {estActif && <Check className="w-3.5 h-3.5" />}
                      <span>{g === 'femme' ? 'Femme' : 'Homme'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ASSOCIATION DE COULEUR */}
      {etape === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-[11px] font-semibold uppercase text-stone-600 mb-1">
                Genre : {profil.genre === 'homme' ? 'Homme' : 'Femme'}
              </div>
              <h3 className="text-xl font-bold text-stone-900 font-serif">
                2. Associations de Couleur
              </h3>
              <p className="text-xs text-stone-500">
                Sélectionnez une ou plusieurs planches d'harmonies chromatiques pour {profil.prenom} {profil.nom}.
              </p>
            </div>
            <div className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {profil.couleurs.length} planche{profil.couleurs.length > 1 ? 's' : ''} sélectionnée{profil.couleurs.length > 1 ? 's' : ''}
            </div>
          </div>

          {chargementDocs ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-stone-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" />
              <p className="text-xs text-stone-500">Chargement des planches de couleurs...</p>
            </div>
          ) : docsCouleur.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
              <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs text-stone-600 font-semibold">Aucun visuel d'association de couleur disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {docsCouleur.map((doc) => {
                const selectionne = profil.couleurs.includes(doc.fichier);
                return (
                  <div key={doc.fichier} className="flex flex-col gap-2 group">
                    <button
                      type="button"
                      onClick={() => basculerSelection('couleurs', doc.fichier)}
                      className={`relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all ${
                        selectionne
                          ? 'border-stone-900 ring-2 ring-stone-900 shadow-md bg-stone-50'
                          : 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs'
                      }`}
                    >
                      <span
                        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectionne
                            ? 'bg-stone-900 text-white opacity-100 shadow-xs'
                            : 'bg-white/80 text-stone-400 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>

                      <div className="aspect-[4/3] w-full bg-stone-100 relative overflow-hidden">
                        <img
                          src={doc.chemin}
                          alt={doc.titre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-2.5 text-center border-t border-stone-100">
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {doc.titre}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApercuModal({ chemin: doc.chemin, titre: doc.titre })}
                      className="text-center text-[10px] font-semibold text-stone-400 hover:text-stone-800 uppercase tracking-wider transition-colors"
                    >
                      Agrandir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: RECETTE DE STYLE */}
      {etape === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-[11px] font-semibold uppercase text-stone-600 mb-1">
                Genre : {profil.genre === 'homme' ? 'Homme' : 'Femme'}
              </div>
              <h3 className="text-xl font-bold text-stone-900 font-serif">
                3. Recettes de Style
              </h3>
              <p className="text-xs text-stone-500">
                Sélectionnez les lignes de style qui correspondent à la personnalité vestimentaire de {profil.prenom}.
              </p>
            </div>
            <div className="text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {profil.styles.length} recette{profil.styles.length > 1 ? 's' : ''} sélectionnée{profil.styles.length > 1 ? 's' : ''}
            </div>
          </div>

          {chargementDocs ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-stone-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" />
              <p className="text-xs text-stone-500">Chargement des recettes de style...</p>
            </div>
          ) : docsStyle.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
              <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs text-stone-600 font-semibold">Aucun visuel de recette de style disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {docsStyle.map((doc) => {
                const selectionne = profil.styles.includes(doc.fichier);
                return (
                  <div key={doc.fichier} className="flex flex-col gap-2 group">
                    <button
                      type="button"
                      onClick={() => basculerSelection('styles', doc.fichier)}
                      className={`relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all ${
                        selectionne
                          ? 'border-stone-900 ring-2 ring-stone-900 shadow-md bg-stone-50'
                          : 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs'
                      }`}
                    >
                      <span
                        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectionne
                            ? 'bg-stone-900 text-white opacity-100 shadow-xs'
                            : 'bg-white/80 text-stone-400 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>

                      <div className="aspect-[4/3] w-full bg-stone-100 relative overflow-hidden">
                        <img
                          src={doc.chemin}
                          alt={doc.titre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-2.5 text-center border-t border-stone-100">
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {doc.titre}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApercuModal({ chemin: doc.chemin, titre: doc.titre })}
                      className="text-center text-[10px] font-semibold text-stone-400 hover:text-stone-800 uppercase tracking-wider transition-colors"
                    >
                      Agrandir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: SYNTHÈSE & EXPORT */}
      {etape === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-stone-100 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Fiche de restitution
                </p>
                <h3 className="text-2xl font-bold text-stone-900 font-serif">
                  {profil.prenom} {profil.nom}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={sauvegarder}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-95"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Sauvegarder & Télécharger</span>
                </button>
              </div>
            </div>

            {/* Notification confirmation */}
            {enregistre && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Le profil a été enregistré dans votre cabinet et la fiche descriptive téléchargée.</span>
              </div>
            )}

            {/* Coordonnées */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Âge</span>
                <span className="font-medium text-stone-800">{profil.age || '—'} ans</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Genre</span>
                <span className="font-medium text-stone-800 capitalize">{profil.genre}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Téléphone</span>
                <span className="font-medium text-stone-800">{profil.telephone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Email</span>
                <span className="font-medium text-stone-800 truncate block">{profil.email || '—'}</span>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Adresse & Ville</span>
                <span className="font-medium text-stone-800">
                  {[profil.adresse, profil.codePostal, profil.ville].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            </div>

            {/* Sélections Couleurs & Styles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Couleurs */}
              <div className="p-5 rounded-2xl border border-stone-200/80 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm font-serif">
                    Associations de Couleur
                  </h4>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {profil.couleurs.length} planche{profil.couleurs.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {profil.couleurs.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Aucune association sélectionnée</p>
                  ) : (
                    profil.couleurs.map((f) => {
                      const titre = getDocTitre(docsCouleur, f);
                      const chemin = getDocChemin(docsCouleur, f);
                      return (
                        <div key={f} className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 border border-stone-100">
                          {chemin && (
                            <img src={chemin} alt={titre} className="w-10 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-stone-900 truncate">{titre}</p>
                            <p className="text-[10px] text-stone-400 truncate">{f}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Styles */}
              <div className="p-5 rounded-2xl border border-stone-200/80 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm font-serif">
                    Recettes de Style
                  </h4>
                  <span className="text-[11px] font-semibold text-stone-500">
                    {profil.styles.length} recette{profil.styles.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {profil.styles.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Aucune recette sélectionnée</p>
                  ) : (
                    profil.styles.map((f) => {
                      const titre = getDocTitre(docsStyle, f);
                      const chemin = getDocChemin(docsStyle, f);
                      return (
                        <div key={f} className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 border border-stone-100">
                          {chemin && (
                            <img src={chemin} alt={titre} className="w-10 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-stone-900 truncate">{titre}</p>
                            <p className="text-[10px] text-stone-400 truncate">{f}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation controls */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={() => setEtape((e) => Math.max(0, e - 1))}
          disabled={etape === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Étape précédente</span>
        </button>

        {etape < 3 ? (
          <button
            type="button"
            onClick={() => setEtape((e) => Math.min(3, e + 1))}
            disabled={!profilValide}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-95 disabled:opacity-40"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <span>Continuer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onGoToClients) onGoToClients();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-2xs"
          >
            <span>Consulter les fiches clientes</span>
          </button>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {apercuModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setApercuModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl p-2"
          >
            <div className="flex items-center justify-between p-3 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 font-serif">
                {apercuModal.titre}
              </h4>
              <button
                type="button"
                onClick={() => setApercuModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh]">
              <img
                src={apercuModal.chemin}
                alt={apercuModal.titre}
                className="max-h-[72vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
