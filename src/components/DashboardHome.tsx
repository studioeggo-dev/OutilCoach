import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Images, 
  Sparkles, 
  Palette, 
  Search, 
  Plus, 
  ArrowRight, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  FolderOpen,
  Shirt,
  UserCheck,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';
import { NavigationTab } from './Sidebar';
import { ClientProfile } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  listerDocuments, 
  telechargerFicheDepuisClient, 
  embellirTitre, 
  Genre 
} from '../services/ludiDiagnostic';
import { fetchCatalogImages } from '../services/imageCatalog';

interface DashboardHomeProps {
  onNavigate: (tab: NavigationTab) => void;
  onPreviewClient: () => void;
  onStartDiagnosticForClient?: (client: ClientProfile) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  onNavigate, 
  onPreviewClient,
  onStartDiagnosticForClient 
}) => {
  const { profile, workspace, user } = useAuth();
  const { brand } = useWorkspaceTheme();

  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [totalDocumentsCount, setTotalDocumentsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<'all' | 'femme' | 'homme'>('all');
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  // Charger les données réelles du cabinet (clientes, diagnostics, photothèque)
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!workspace?.id) {
        setLoadingClients(false);
        return;
      }

      try {
        setLoadingClients(true);

        // 1. Charger les clients du cabinet
        const clientsRef = collection(db, 'workspaces', workspace.id, 'clients');
        const q = query(clientsRef, orderBy('createdAt', 'desc'), limit(30));
        const snapshot = await getDocs(q);
        
        const loadedClients: ClientProfile[] = [];
        snapshot.forEach((doc) => {
          loadedClients.push({
            id: doc.id,
            ...doc.data()
          } as ClientProfile);
        });

        if (isMounted) {
          setClients(loadedClients);
        }

        // 2. Calculer le total des planches disponibles (référence officielle + téléversées)
        const [assocolorFemme, assocolorHomme, styleFemme, styleHomme, customImages] = await Promise.all([
          listerDocuments('assocolor', 'femme').catch(() => []),
          listerDocuments('assocolor', 'homme').catch(() => []),
          listerDocuments('style', 'femme').catch(() => []),
          listerDocuments('style', 'homme').catch(() => []),
          fetchCatalogImages(workspace.id).catch(() => [])
        ]);

        const uniqueOfficialDocs = new Set([
          ...assocolorFemme.map(d => d.fichier),
          ...assocolorHomme.map(d => d.fichier),
          ...styleFemme.map(d => d.fichier),
          ...styleHomme.map(d => d.fichier),
        ]);

        if (isMounted) {
          setTotalDocumentsCount(uniqueOfficialDocs.size + customImages.length);
        }
      } catch (err) {
        console.error('Erreur chargement données accueil:', err);
      } finally {
        if (isMounted) {
          setLoadingClients(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [workspace?.id]);

  // Clients filtrés par la recherche et par genre
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = 
        !searchQuery.trim() ||
        c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.ville && c.ville.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre = 
        selectedGenreFilter === 'all' || 
        c.genre === selectedGenreFilter;

      return matchesSearch && matchesGenre;
    });
  }, [clients, searchQuery, selectedGenreFilter]);

  // Statistiques calculées
  const totalClients = clients.length;
  const completedDiagnostics = clients.filter(c => 
    (c.couleurs && c.couleurs.length > 0) || 
    (c.styles && c.styles.length > 0) || 
    c.status === 'completed'
  ).length;

  const handleDownloadTxt = (client: ClientProfile) => {
    telechargerFicheDepuisClient(client);
    setDownloadSuccessId(client.id);
    setTimeout(() => {
      setDownloadSuccessId(null);
    }, 2500);
  };

  const handleStartDiagnostic = (client: ClientProfile) => {
    if (onStartDiagnosticForClient) {
      onStartDiagnosticForClient(client);
    } else {
      onNavigate('diagnostic');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* 1. BANDEAU D'ACCUEIL CHALEUREUX (Champagne & Ivoire avec dégradés doux et relief) */}
      <section className="relative overflow-hidden rounded-[20px] border border-[#E7D7C6] bg-gradient-to-r from-[#FFFCF7] via-[#FDF8F0] to-[#F5E9DC] p-6 sm:p-8 lg:p-10 shadow-[0_8px_24px_rgba(112,73,40,0.08),0_2px_6px_rgba(112,73,40,0.04)]">
        {/* Formes décoratives douces en CSS pour l'ambiance chaleureuse */}
        <div 
          className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #C68A51 0%, #F3E2CC 70%, transparent 100%)' }}
        />
        <div 
          className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #A66538 0%, #F3E2CC 80%, transparent 100%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Tag délicat */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E2CC]/80 border border-[#E7D7C6] text-[#704323] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#A66538]" />
              <span>Atelier Conseil en Image & Diagnostic</span>
            </div>

            {/* Titre hiérarchisé 30-40px */}
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#352219] font-serif tracking-tight leading-snug">
              Bonjour, {profile?.displayName || 'Chère Coach'}
            </h1>

            {/* Texte courant 14-16px */}
            <p className="text-[#756154] text-sm sm:text-base leading-relaxed">
              Bienvenue dans votre espace <span className="font-semibold text-[#352219]">{brand.displayName}</span>. 
              Accompagnez vos clientes à travers le parcours de colorimétrie et de style, et éditez instantanément leurs fiches personnalisées.
            </p>
          </div>

          {/* Boutons d'action principaux */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('diagnostic')}
              className="btn-caramel px-5 py-3 text-sm flex items-center gap-2.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FFFDF9]" />
              <span>Nouveau diagnostic</span>
            </button>

            <button
              onClick={() => onNavigate('clients')}
              className="btn-ivoire px-4 py-3 text-sm flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#A66538]" />
              <span>Fiches clientes</span>
            </button>

            <button
              onClick={() => onNavigate('catalog')}
              className="btn-ivoire px-4 py-3 text-sm flex items-center gap-2 cursor-pointer"
            >
              <Images className="w-4 h-4 text-[#A66538]" />
              <span>Photothèque</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CARTES D'INDICATEURS CLÉS (Surfaces ivoire surélevées) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Indicateur 1 : Clientes */}
        <div className="card-warm card-warm-hover p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8A7C]">
                Clientes actives
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#352219] font-serif">
                {loadingClients ? '…' : totalClients}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F3E2CC] text-[#704323] flex items-center justify-center border border-[#E7D7C6]">
              <Users className="w-5 h-5 text-[#A66538]" />
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-[#F0E5D8] flex items-center justify-between text-xs text-[#756154]">
            <span>Fiches enregistrées</span>
            <button 
              onClick={() => onNavigate('clients')}
              className="font-semibold text-[#A66538] hover:text-[#864A28] flex items-center gap-0.5"
            >
              Voir <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Indicateur 2 : Diagnostics */}
        <div className="card-warm card-warm-hover p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8A7C]">
                Diagnostics réalisés
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#352219] font-serif">
                {loadingClients ? '…' : completedDiagnostics}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F3E2CC] text-[#704323] flex items-center justify-center border border-[#E7D7C6]">
              <Sparkles className="w-5 h-5 text-[#A66538]" />
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-[#F0E5D8] flex items-center justify-between text-xs text-[#756154]">
            <span>Séances finalisées</span>
            <button 
              onClick={() => onNavigate('diagnostic')}
              className="font-semibold text-[#A66538] hover:text-[#864A28] flex items-center gap-0.5"
            >
              Lancer <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Indicateur 3 : Planches visuelles */}
        <div className="card-warm card-warm-hover p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8A7C]">
                Planches & Palettes
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#352219] font-serif">
                {totalDocumentsCount > 0 ? totalDocumentsCount : 17}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F3E2CC] text-[#704323] flex items-center justify-center border border-[#E7D7C6]">
              <Images className="w-5 h-5 text-[#A66538]" />
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-[#F0E5D8] flex items-center justify-between text-xs text-[#756154]">
            <span>Couleurs & Styles</span>
            <button 
              onClick={() => onNavigate('catalog')}
              className="font-semibold text-[#A66538] hover:text-[#864A28] flex items-center gap-0.5"
            >
              Explorer <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Indicateur 4 : Cabinet & Personnalisation */}
        <div className="card-warm card-warm-hover p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9E8A7C]">
                Identité Visuelle
              </p>
              <p className="text-lg font-bold text-[#352219] truncate" title={brand.displayName}>
                {brand.displayName}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#F3E2CC] text-[#704323] flex items-center justify-center border border-[#E7D7C6]">
              <Palette className="w-5 h-5 text-[#A66538]" />
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-[#F0E5D8] flex items-center justify-between text-xs text-[#756154]">
            <span>Marque active</span>
            <button 
              onClick={() => onNavigate('settings')}
              className="font-semibold text-[#A66538] hover:text-[#864A28] flex items-center gap-0.5"
            >
              Modifier <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. PARCOURS MÉTIER EN 4 ÉTAPES (Rappel visuel & structuré) */}
      <section className="card-warm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-[#F0E5D8]">
          <div>
            <h2 className="text-xl font-bold text-[#352219] font-serif">
              Parcours de Conseil en Image
            </h2>
            <p className="text-xs text-[#756154] mt-0.5">
              4 étapes intuitives pour guider votre cliente durant sa séance en atelier
            </p>
          </div>
          <button
            onClick={() => onNavigate('diagnostic')}
            className="btn-caramel px-4 py-2 text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            Démarrer une séance
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
          {/* Étape 1 */}
          <div className="p-4 rounded-2xl bg-[#FBF4EB]/60 border border-[#E7D7C6] flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#F3E2CC] text-[#704323] flex items-center justify-center text-xs font-bold border border-[#E7D7C6]">
                1
              </div>
              <h3 className="font-bold text-[#352219] text-sm">Profil client</h3>
              <p className="text-xs text-[#756154] leading-relaxed">
                Coordonnées complètes et choix du genre déterminant les planches présentées.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#A66538]">Nom, prénom & genre requis</span>
          </div>

          {/* Étape 2 */}
          <div className="p-4 rounded-2xl bg-[#FBF4EB]/60 border border-[#E7D7C6] flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#F3E2CC] text-[#704323] flex items-center justify-center text-xs font-bold border border-[#E7D7C6]">
                2
              </div>
              <h3 className="font-bold text-[#352219] text-sm">Associations couleurs</h3>
              <p className="text-xs text-[#756154] leading-relaxed">
                Planches de colorimétrie filtrées, sélection multiple et zoom plein écran.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#A66538]">Nuanciers & harmonies</span>
          </div>

          {/* Étape 3 */}
          <div className="p-4 rounded-2xl bg-[#FBF4EB]/60 border border-[#E7D7C6] flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#F3E2CC] text-[#704323] flex items-center justify-center text-xs font-bold border border-[#E7D7C6]">
                3
              </div>
              <h3 className="font-bold text-[#352219] text-sm">Recettes de style</h3>
              <p className="text-xs text-[#756154] leading-relaxed">
                Silhouettes, styles vestimentaires et photothèque d'inspiration.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#A66538]">Planches de silhouettes</span>
          </div>

          {/* Étape 4 */}
          <div className="p-4 rounded-2xl bg-[#FBF4EB]/60 border border-[#E7D7C6] flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#F3E2CC] text-[#704323] flex items-center justify-center text-xs font-bold border border-[#E7D7C6]">
                4
              </div>
              <h3 className="font-bold text-[#352219] text-sm">Synthèse & Export TXT</h3>
              <p className="text-xs text-[#756154] leading-relaxed">
                Enregistrement sécurisé en base et téléchargement immédiat de la fiche.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#A66538]">Fiche client & bilan</span>
          </div>
        </div>
      </section>

      {/* 4. RECHERCHE FONCTIONNELLE & CLIENTES RÉCENTES */}
      <section className="card-warm p-6 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#352219] font-serif">
              Clientes & Diagnostics récents
            </h2>
            <p className="text-xs text-[#756154] mt-0.5">
              Retrouvez rapidement une cliente pour reprendre une séance ou télécharger sa fiche
            </p>
          </div>

          {/* Recherche & Filtre Genre réels */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8A7C]" />
              <input 
                type="text"
                placeholder="Rechercher par nom, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E7D7C6] bg-[#FFFCF7] text-xs text-[#352219] placeholder:text-[#9E8A7C] focus:outline-hidden focus:ring-2 focus:ring-[#A66538]/30 focus:border-[#A66538] transition-all"
              />
            </div>

            <div className="inline-flex rounded-xl border border-[#E7D7C6] bg-[#FBF4EB] p-0.5 text-xs font-medium">
              <button
                onClick={() => setSelectedGenreFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedGenreFilter === 'all' 
                    ? 'bg-[#FFFCF7] text-[#352219] font-bold shadow-xs' 
                    : 'text-[#756154] hover:text-[#352219]'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setSelectedGenreFilter('femme')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedGenreFilter === 'femme' 
                    ? 'bg-[#FFFCF7] text-[#352219] font-bold shadow-xs' 
                    : 'text-[#756154] hover:text-[#352219]'
                }`}
              >
                Femme
              </button>
              <button
                onClick={() => setSelectedGenreFilter('homme')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedGenreFilter === 'homme' 
                    ? 'bg-[#FFFCF7] text-[#352219] font-bold shadow-xs' 
                    : 'text-[#756154] hover:text-[#352219]'
                }`}
              >
                Homme
              </button>
            </div>
          </div>
        </div>

        {/* Liste / Tableau des clientes */}
        {loadingClients ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-[#756154]">
            <div className="w-6 h-6 border-2 border-[#A66538] border-t-transparent rounded-full animate-spin" />
            <span>Chargement des clientes du cabinet...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-[#FBF4EB]/50 border border-dashed border-[#E7D7C6] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F3E2CC] text-[#A66538] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#352219]">
              {searchQuery ? 'Aucune cliente ne correspond à votre recherche' : 'Aucune cliente enregistrée pour le moment'}
            </h3>
            <p className="text-xs text-[#756154] max-w-md mx-auto">
              {searchQuery 
                ? 'Essayez de modifier vos termes de recherche ou de réinitialiser le filtre de genre.'
                : 'Commencez par lancer votre premier diagnostic ou créez une nouvelle fiche cliente pour l\'accompagner.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('diagnostic')}
                className="btn-caramel px-4 py-2 text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lancer le premier diagnostic</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7D7C6] text-[#9E8A7C] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Genre</th>
                  <th className="py-3 px-4 hidden md:table-cell">Ville / Contact</th>
                  <th className="py-3 px-4">Planches choisies</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E5D8]">
                {filteredClients.map((client) => {
                  const hasDiagnostic = 
                    (client.couleurs && client.couleurs.length > 0) || 
                    (client.styles && client.styles.length > 0);
                  
                  const formattedDate = client.createdAt 
                    ? new Date(client.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '—';

                  const isDownloaded = downloadSuccessId === client.id;

                  return (
                    <tr 
                      key={client.id}
                      className="hover:bg-[#FBF4EB]/40 transition-colors group"
                    >
                      {/* Nom & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F3E2CC] text-[#704323] flex items-center justify-center font-bold text-xs shrink-0 border border-[#E7D7C6]">
                            {client.firstName[0]?.toUpperCase()}{client.lastName[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#352219] text-sm truncate">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-[11px] text-[#756154] truncate">
                              {client.email || 'Email non renseigné'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          client.genre === 'femme'
                            ? 'bg-[#F3E2CC]/80 border-[#E7D7C6] text-[#704323]'
                            : client.genre === 'homme'
                            ? 'bg-[#E7D7C6]/60 border-[#C68A51]/50 text-[#864A28]'
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}>
                          {client.genre === 'femme' ? 'Femme' : client.genre === 'homme' ? 'Homme' : 'Non précisé'}
                        </span>
                      </td>

                      {/* Contact / Ville */}
                      <td className="py-3 px-4 hidden md:table-cell text-[#756154]">
                        <p className="truncate font-medium text-[#352219]">
                          {client.ville ? `${client.ville}${client.codePostal ? ` (${client.codePostal})` : ''}` : '—'}
                        </p>
                        <p className="text-[11px] text-[#9E8A7C]">
                          {client.phone || '—'}
                        </p>
                      </td>

                      {/* Planches choisies */}
                      <td className="py-3 px-4">
                        {hasDiagnostic ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {client.couleurs && client.couleurs.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FBF4EB] border border-[#E7D7C6] text-[#704323] text-[10px] font-medium">
                                <Palette className="w-3 h-3 text-[#A66538]" />
                                <span>{client.couleurs.length} couleur{client.couleurs.length > 1 ? 's' : ''}</span>
                              </span>
                            )}
                            {client.styles && client.styles.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FBF4EB] border border-[#E7D7C6] text-[#704323] text-[10px] font-medium">
                                <Shirt className="w-3 h-3 text-[#A66538]" />
                                <span>{client.styles.length} style{client.styles.length > 1 ? 's' : ''}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9E8A7C] italic">Profil créé</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 hidden sm:table-cell text-[#756154]">
                        <span className="text-[11px] font-medium">{formattedDate}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Télécharger TXT */}
                          {hasDiagnostic && (
                            <button
                              onClick={() => handleDownloadTxt(client)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isDownloaded 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                  : 'bg-[#FFFCF7] text-[#756154] hover:text-[#352219] hover:bg-[#F3E2CC]/50 border-[#E7D7C6]'
                              }`}
                              title={isDownloaded ? 'Fiche téléchargée !' : 'Télécharger la fiche (.txt)'}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Ouvrir / Reprendre la séance */}
                          <button
                            onClick={() => handleStartDiagnostic(client)}
                            className="btn-caramel px-2.5 py-1 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title="Ouvrir le diagnostic pour cette cliente"
                          >
                            <span>Séance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. LIENS ET OUTILS DU CABINET */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Photothèque & Styles */}
        <div className="card-warm p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3E2CC] text-[#704323] flex items-center justify-center border border-[#E7D7C6]">
              <Images className="w-5 h-5 text-[#A66538]" />
            </div>
            <h3 className="font-bold text-[#352219] text-base">
              Photothèque & Planches de styles
            </h3>
            <p className="text-xs text-[#756154] leading-relaxed">
              Consultez l'ensemble des planches de colorimétrie et de style adaptées femme et homme, ou enrichissez votre photothèque avec vos propres supports visuels de conseil.
            </p>
          </div>
          <div className="pt-5 mt-4 border-t border-[#F0E5D8]">
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs font-bold text-[#A66538] hover:text-[#864A28] flex items-center gap-1"
            >
              <span>Accéder au catalogue d'images</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Personnalisation Marque */}
        <div className="card-warm p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3E2CC] text-[#704323] flex items-center justify-center border border-[#E7D7C6]">
              <Palette className="w-5 h-5 text-[#A66538]" />
            </div>
            <h3 className="font-bold text-[#352219] text-base">
              Personnalisation de votre Cabinet
            </h3>
            <p className="text-xs text-[#756154] leading-relaxed">
              Ajustez le nom affiché de votre atelier, vos teintes d'accent, votre message de bienvenue ou votre logo pour offrir à vos clientes une expérience sur-mesure.
            </p>
          </div>
          <div className="pt-5 mt-4 border-t border-[#F0E5D8]">
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-bold text-[#A66538] hover:text-[#864A28] flex items-center gap-1"
            >
              <span>Personnaliser l'identité du cabinet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
