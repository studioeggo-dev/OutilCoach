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
                  ? 'bg-[#FFFCF7] border-[#A66538] shadow-[0_4px_14px_rgba(134,74,40,0.15)] ring-1 ring-[#A66538]'
                  : complete
                  ? 'bg-[#FBF4EB] border-[#E7D7C6] hover:bg-[#F3E2CC]/40 text-[#704323]'
                  : 'bg-[#FFFCF7]/50 border-[#E7D7C6]/60 opacity-60 cursor-not-allowed'
              }`}
            >
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  actif
                    ? 'text-white'
                    : complete
                    ? 'bg-[#F3E2CC] text-[#704323] border border-[#E7D7C6]'
                    : 'bg-[#F0E5D8] text-[#9E8A7C]'
                }`}
                style={actif ? { backgroundColor: brand.primaryColor || '#A66538' } : {}}
              >
                {complete ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9E8A7C]">
                  Étape {step.id + 1}
                </p>
                <p className="text-xs font-bold text-[#352219] truncate">
                  {step.titre}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: PROFIL CLIENT */}
      {etape === 0 && (
        <div className="card-warm p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#F0E5D8] pb-4">
            <h3 className="text-xl font-bold text-[#352219] font-serif">
              1. Informations & Profil du Client
            </h3>
            <p className="text-xs text-[#756154] mt-0.5">
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
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        estActif
                          ? 'btn-caramel text-white shadow-xs'
                          : 'border-[#E7D7C6] bg-[#FFFCF7] hover:bg-[#FBF4EB] text-[#756154]'
                      }`}
                    >
                      {estActif && <Check className="w-3.5 h-3.5 text-white" />}
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
          <div className="card-warm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3E2CC] border border-[#E7D7C6] text-[11px] font-semibold uppercase text-[#704323] mb-1">
                Genre : {profil.genre === 'homme' ? 'Homme' : 'Femme'}
              </div>
              <h3 className="text-xl font-bold text-[#352219] font-serif">
                2. Associations de Couleur
              </h3>
              <p className="text-xs text-[#756154]">
                Sélectionnez une ou plusieurs planches d'harmonies chromatiques pour {profil.prenom} {profil.nom}.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#704323] bg-[#FBF4EB] border border-[#E7D7C6] px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {profil.couleurs.length} planche{profil.couleurs.length > 1 ? 's' : ''} sélectionnée{profil.couleurs.length > 1 ? 's' : ''}
            </div>
          </div>

          {chargementDocs ? (
            <div className="py-20 text-center space-y-3 card-warm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A66538]" />
              <p className="text-xs text-[#756154]">Chargement des planches de couleurs...</p>
            </div>
          ) : docsCouleur.length === 0 ? (
            <div className="p-12 text-center card-warm space-y-3">
              <ImageIcon className="w-8 h-8 text-[#9E8A7C] mx-auto" />
              <p className="text-xs text-[#352219] font-semibold">Aucun visuel d'association de couleur disponible.</p>
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
                      className={`relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all cursor-pointer ${
                        selectionne
                          ? 'border-[#A66538] ring-2 ring-[#A66538] shadow-[0_8px_20px_rgba(134,74,40,0.18)] bg-[#FDF8F0]'
                          : 'border-[#E7D7C6] bg-[#FFFCF7] hover:border-[#C68A51] hover:shadow-xs'
                      }`}
                    >
                      <span
                        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectionne
                            ? 'bg-[#A66538] text-white opacity-100 shadow-xs'
                            : 'bg-white/80 text-[#9E8A7C] opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>

                      <div className="aspect-[4/3] w-full bg-[#F3E2CC]/30 relative overflow-hidden">
                        <img
                          src={doc.chemin}
                          alt={doc.titre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-2.5 text-center border-t border-[#F0E5D8] bg-[#FFFCF7]">
                        <p className="text-xs font-semibold text-[#352219] truncate">
                          {doc.titre}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApercuModal({ chemin: doc.chemin, titre: doc.titre })}
                      className="text-center text-[10px] font-semibold text-[#A66538] hover:text-[#864A28] uppercase tracking-wider transition-colors cursor-pointer"
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
          <div className="card-warm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3E2CC] border border-[#E7D7C6] text-[11px] font-semibold uppercase text-[#704323] mb-1">
                Genre : {profil.genre === 'homme' ? 'Homme' : 'Femme'}
              </div>
              <h3 className="text-xl font-bold text-[#352219] font-serif">
                3. Recettes de Style
              </h3>
              <p className="text-xs text-[#756154]">
                Sélectionnez les lignes de style qui correspondent à la personnalité vestimentaire de {profil.prenom}.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#704323] bg-[#FBF4EB] border border-[#E7D7C6] px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {profil.styles.length} recette{profil.styles.length > 1 ? 's' : ''} sélectionnée{profil.styles.length > 1 ? 's' : ''}
            </div>
          </div>

          {chargementDocs ? (
            <div className="py-20 text-center space-y-3 card-warm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A66538]" />
              <p className="text-xs text-[#756154]">Chargement des recettes de style...</p>
            </div>
          ) : docsStyle.length === 0 ? (
            <div className="p-12 text-center card-warm space-y-3">
              <ImageIcon className="w-8 h-8 text-[#9E8A7C] mx-auto" />
              <p className="text-xs text-[#352219] font-semibold">Aucun visuel de recette de style disponible.</p>
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
                      className={`relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all cursor-pointer ${
                        selectionne
                          ? 'border-[#A66538] ring-2 ring-[#A66538] shadow-[0_8px_20px_rgba(134,74,40,0.18)] bg-[#FDF8F0]'
                          : 'border-[#E7D7C6] bg-[#FFFCF7] hover:border-[#C68A51] hover:shadow-xs'
                      }`}
                    >
                      <span
                        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectionne
                            ? 'bg-[#A66538] text-white opacity-100 shadow-xs'
                            : 'bg-white/80 text-[#9E8A7C] opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>

                      <div className="aspect-[4/3] w-full bg-[#F3E2CC]/30 relative overflow-hidden">
                        <img
                          src={doc.chemin}
                          alt={doc.titre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      <div className="p-2.5 text-center border-t border-[#F0E5D8] bg-[#FFFCF7]">
                        <p className="text-xs font-semibold text-[#352219] truncate">
                          {doc.titre}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApercuModal({ chemin: doc.chemin, titre: doc.titre })}
                      className="text-center text-[10px] font-semibold text-[#A66538] hover:text-[#864A28] uppercase tracking-wider transition-colors cursor-pointer"
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
          <div className="card-warm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F0E5D8] gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8A7C]">
                  Fiche de restitution
                </p>
                <h3 className="text-2xl font-bold text-[#352219] font-serif">
                  {profil.prenom} {profil.nom}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={sauvegarder}
                  disabled={isSaving}
                  className="btn-caramel px-5 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Download className="w-4 h-4 text-white" />
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#FBF4EB] border border-[#E7D7C6] text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#9E8A7C] block">Âge</span>
                <span className="font-semibold text-[#352219]">{profil.age || '—'} ans</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#9E8A7C] block">Genre</span>
                <span className="font-semibold text-[#352219] capitalize">{profil.genre}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#9E8A7C] block">Téléphone</span>
                <span className="font-semibold text-[#352219]">{profil.telephone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#9E8A7C] block">Email</span>
                <span className="font-semibold text-[#352219] truncate block">{profil.email || '—'}</span>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <span className="text-[10px] font-semibold uppercase text-[#9E8A7C] block">Adresse & Ville</span>
                <span className="font-semibold text-[#352219]">
                  {[profil.adresse, profil.codePostal, profil.ville].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
            </div>

            {/* Sélections Couleurs & Styles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Couleurs */}
              <div className="p-5 rounded-2xl border border-[#E7D7C6] bg-[#FFFCF7] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#352219] text-sm font-serif">
                    Associations de Couleur
                  </h4>
                  <span className="text-[11px] font-semibold text-[#704323] bg-[#F3E2CC] px-2 py-0.5 rounded-full border border-[#E7D7C6]">
                    {profil.couleurs.length} planche{profil.couleurs.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {profil.couleurs.length === 0 ? (
                    <p className="text-xs text-[#9E8A7C] italic">Aucune association sélectionnée</p>
                  ) : (
                    profil.couleurs.map((f) => {
                      const titre = getDocTitre(docsCouleur, f);
                      const chemin = getDocChemin(docsCouleur, f);
                      return (
                        <div key={f} className="flex items-center gap-3 p-2 rounded-xl bg-[#FBF4EB] border border-[#E7D7C6]">
                          {chemin && (
                            <img src={chemin} alt={titre} className="w-10 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#352219] truncate">{titre}</p>
                            <p className="text-[10px] text-[#9E8A7C] truncate">{f}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Styles */}
              <div className="p-5 rounded-2xl border border-[#E7D7C6] bg-[#FFFCF7] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#352219] text-sm font-serif">
                    Recettes de Style
                  </h4>
                  <span className="text-[11px] font-semibold text-[#704323] bg-[#F3E2CC] px-2 py-0.5 rounded-full border border-[#E7D7C6]">
                    {profil.styles.length} recette{profil.styles.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {profil.styles.length === 0 ? (
                    <p className="text-xs text-[#9E8A7C] italic">Aucune recette sélectionnée</p>
                  ) : (
                    profil.styles.map((f) => {
                      const titre = getDocTitre(docsStyle, f);
                      const chemin = getDocChemin(docsStyle, f);
                      return (
                        <div key={f} className="flex items-center gap-3 p-2 rounded-xl bg-[#FBF4EB] border border-[#E7D7C6]">
                          {chemin && (
                            <img src={chemin} alt={titre} className="w-10 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#352219] truncate">{titre}</p>
                            <p className="text-[10px] text-[#9E8A7C] truncate">{f}</p>
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
      <div className="flex items-center justify-between pt-4 border-t border-[#E7D7C6]">
        <button
          type="button"
          onClick={() => setEtape((e) => Math.max(0, e - 1))}
          disabled={etape === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#756154] hover:text-[#352219] disabled:opacity-30 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#A66538]" />
          <span>Étape précédente</span>
        </button>

        {etape < 3 ? (
          <button
            type="button"
            onClick={() => setEtape((e) => Math.min(3, e + 1))}
            disabled={!profilValide}
            className="btn-caramel px-6 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <span>Continuer</span>
            <ArrowRight className="w-4 h-4 text-[#FFFDF9]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onGoToClients) onGoToClients();
            }}
            className="btn-ivoire px-5 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer"
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
