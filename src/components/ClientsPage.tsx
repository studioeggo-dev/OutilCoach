import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspaceTheme } from '../context/WorkspaceThemeContext';
import { ClientProfile, DiagnosticAssignment } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Lock,
  ChevronRight,
  Eye,
  Info,
  Download
} from 'lucide-react';
import { SAAS_MODULES_REGISTRY } from '../modules/registry';
import { generateSecureDiagnosticToken } from '../services/diagnosticAccess';
import { 
  telechargerFiche, 
  telechargerFicheDepuisClient, 
  embellirTitre, 
  resoudreCheminDocument, 
  LudiClientProfil, 
  Genre 
} from '../services/ludiDiagnostic';

interface ClientsPageProps {
  onPreviewClientAssignment: (assignmentId: string, workspaceId: string, token?: string) => void;
  onStartDiagnosticForClient?: (client: ClientProfile) => void;
}

interface ClientWithAssignment {
  client: ClientProfile;
  assignment?: DiagnosticAssignment;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ 
  onPreviewClientAssignment,
  onStartDiagnosticForClient
}) => {
  const { user, workspace } = useAuth();
  const { brand } = useWorkspaceTheme();

  const [clientItems, setClientItems] = useState<ClientWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [apercuImageModal, setApercuImageModal] = useState<{ chemin: string; titre: string } | null>(null);

  // Selected assignment for coach review modal
  const [selectedReviewAssignment, setSelectedReviewAssignment] = useState<{
    assignment: DiagnosticAssignment;
    client: ClientProfile;
  } | null>(null);

  // New Client Form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState(SAAS_MODULES_REGISTRY[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadClientsAndAssignments();
  }, [workspace?.id]);

  const loadClientsAndAssignments = async () => {
    if (!workspace?.id) return;
    try {
      setLoading(true);
      // Fetch clients of this coach
      const clientsRef = collection(db, 'workspaces', workspace.id, 'clients');
      const snap = await getDocs(query(clientsRef, orderBy('createdAt', 'desc')));
      const loadedClients: ClientProfile[] = [];
      snap.forEach((doc) => {
        loadedClients.push({ id: doc.id, ...(doc.data() as Omit<ClientProfile, 'id'>) });
      });

      // Fetch diagnostic assignments
      const assignmentsRef = collection(db, 'workspaces', workspace.id, 'assignments');
      const assignSnap = await getDocs(assignmentsRef);
      const assignmentsMap = new Map<string, DiagnosticAssignment>();
      assignSnap.forEach((doc) => {
        const data = { id: doc.id, ...(doc.data() as Omit<DiagnosticAssignment, 'id'>) };
        if (data.clientId) {
          assignmentsMap.set(data.clientId, data);
        }
      });

      const combined: ClientWithAssignment[] = loadedClients.map(c => ({
        client: c,
        assignment: assignmentsMap.get(c.id)
      }));

      setClientItems(combined);
    } catch (err: any) {
      console.error('Error fetching clients and assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.id || !user?.uid) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const clientData: Omit<ClientProfile, 'id'> = {
        workspaceId: workspace.id,
        coachId: user.uid,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        status: 'invited',
        createdAt: new Date().toISOString()
      };

      const clientsRef = collection(db, 'workspaces', workspace.id, 'clients');
      const docRef = await addDoc(clientsRef, clientData);

      // Create cryptographically secure token & 30-day expiration
      const secureToken = generateSecureDiagnosticToken();
      const expiresAtDate = new Date();
      expiresAtDate.setDate(expiresAtDate.getDate() + 30);

      const selectedMod = SAAS_MODULES_REGISTRY.find(m => m.id === selectedModuleId);
      const assignmentsRef = collection(db, 'workspaces', workspace.id, 'assignments');

      await addDoc(assignmentsRef, {
        workspaceId: workspace.id,
        coachId: user.uid,
        clientId: docRef.id,
        clientName: `${newFirstName.trim()} ${newLastName.trim()}`,
        moduleId: selectedModuleId,
        title: selectedMod?.name || 'Diagnostic Initial',
        status: 'pending',
        shareToken: secureToken,
        expiresAt: expiresAtDate.toISOString(),
        createdAt: new Date().toISOString()
      });

      // Reset and reload
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPhone('');
      setShowAddModal(false);
      await loadClientsAndAssignments();
    } catch (err: any) {
      console.error('Error adding client:', err);
      setFormError('Impossible d\'enregistrer la fiche cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyShareLink = (token?: string) => {
    if (!token || !workspace?.id) return;
    const fullUrl = `${window.location.origin}/?token=${token}&ws=${workspace.id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filteredItems = clientItems.filter(({ client }) => {
    const term = searchQuery.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(term) ||
      client.lastName.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#352219] font-serif">
            Gestion des Clientes & Fiches de Diagnostic
          </h2>
          <p className="mt-1 text-sm text-[#756154]">
            Créez vos fiches clientes, consultez leurs diagnostics réalisés en atelier et téléchargez leurs bilans personnalisés.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-caramel px-4 py-2.5 text-xs inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#FFFDF9]" />
          <span>Ajouter une cliente</span>
        </button>
      </div>

      {/* Info notice about client access model */}
      <div className="bg-[#FBF4EB] border border-[#E7D7C6] rounded-2xl p-4 flex items-center gap-3 text-xs text-[#756154]">
        <Info className="w-4 h-4 text-[#A66538] shrink-0" />
        <p>
          <strong className="text-[#352219]">Accompagnement en cabinet :</strong> les fiches clientes centralisent les coordonnées et l'historique des sélections de couleurs et de styles pour chaque séance de conseil en image.
        </p>
      </div>

      {/* Controls / Search */}
      <div className="card-warm p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8A7C]" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#E7D7C6] bg-[#FFFCF7] rounded-xl text-[#352219] placeholder:text-[#9E8A7C] focus:outline-hidden focus:ring-2 focus:ring-[#A66538]/30 focus:border-[#A66538]"
          />
        </div>

        <div className="text-xs text-[#756154] font-semibold">
          {filteredItems.length} {filteredItems.length > 1 ? 'fiches clientes' : 'fiche cliente'}
        </div>
      </div>

      {/* Clients Table */}
      <div className="card-warm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            Chargement des dossiers clientes et des assignations Firestore...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6 text-stone-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-stone-900">
                Aucune cliente enregistrée
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Ajoutez votre première cliente pour générer un lien public de diagnostic sécurisé aux couleurs de votre cabinet.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer la première fiche</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Coordonnées</th>
                  <th className="py-3 px-4">Diagnostic Assigné</th>
                  <th className="py-3 px-4">Statut & Échéance</th>
                  <th className="py-3 px-4 text-right">Lien Public & Actions Coach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map(({ client, assignment }) => {
                  const isCompleted = assignment?.status === 'completed';
                  const isExpired = assignment?.status === 'expired' || (
                    assignment?.expiresAt && new Date(assignment.expiresAt).getTime() < Date.now() && !isCompleted
                  );

                  return (
                    <tr key={client.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[11px]">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <span>{client.firstName} {client.lastName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                              <Phone className="w-3 h-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">
                          {assignment?.title || 'Diagnostic Holistique'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Réponses transmises</span>
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-800 border border-red-200">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span>Lien expiré</span>
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                              <Clock className="w-3 h-3" />
                              <span>En attente de réponse</span>
                            </span>
                            {assignment?.expiresAt && (
                              <div className="text-[10px] text-stone-400">
                                Valide 30 jours
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Launch / Re-run 4-step Diagnostic */}
                          {onStartDiagnosticForClient && (
                            <button
                              onClick={() => onStartDiagnosticForClient(client)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:border-stone-800 hover:text-stone-900 bg-white font-medium transition-colors shadow-2xs"
                              title="Lancer le diagnostic d'image en 4 étapes pour ce client"
                            >
                              <Sparkles className="w-3 h-3 text-stone-500" />
                              <span>Diagnostic</span>
                            </button>
                          )}

                          {/* Direct download of text sheet if completed */}
                          {(client.couleurs?.length || client.styles?.length || isCompleted) && (
                            <button
                              onClick={() => telechargerFicheDepuisClient(client)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 font-medium transition-colors"
                              title="Télécharger la fiche diagnostic (.txt)"
                            >
                              <Download className="w-3 h-3 text-stone-500" />
                            </button>
                          )}

                          {/* If completed: Coach can view answers */}
                          {(isCompleted || client.couleurs?.length || client.styles?.length) && (
                            <button
                              onClick={() => setSelectedReviewAssignment({ 
                                assignment: assignment || {
                                  id: `asg_${client.id}`,
                                  workspaceId: client.workspaceId,
                                  coachId: client.coachId,
                                  clientId: client.id,
                                  clientName: `${client.firstName} ${client.lastName}`,
                                  moduleId: 'mod_diagnostic_image_ludidiag',
                                  title: 'Diagnostic Image & Styles',
                                  status: 'completed',
                                  shareToken: '',
                                  expiresAt: '',
                                  responses: {
                                    couleurs: client.couleurs || [],
                                    styles: client.styles || []
                                  },
                                  completedAt: client.createdAt,
                                  createdAt: client.createdAt
                                }, 
                                client 
                              })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-semibold transition-colors shadow-2xs"
                              title="Consulter les planches et la synthèse de la cliente"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Consulter la fiche</span>
                            </button>
                          )}

                          {/* Copy Public Link */}
                          {assignment?.shareToken && !isCompleted && (
                            <button
                              onClick={() => copyShareLink(assignment.shareToken)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 font-medium transition-colors"
                              title="Copier le lien public sécurisé pour la cliente"
                            >
                              {copiedToken === assignment.shareToken ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Lien copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-stone-500" />
                                  <span>Copier le lien</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Test Form Preview */}
                          <button
                            onClick={() => onPreviewClientAssignment(
                              assignment?.id || client.id, 
                              workspace?.id || '', 
                              assignment?.shareToken
                            )}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 font-medium transition-colors"
                            title="Tester le questionnaire public en tant que coach"
                          >
                            <ExternalLink className="w-3 h-3 text-stone-400" />
                            <span>Tester</span>
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
      </div>

      {/* Modal: Coach Consults Client Answers & Results */}
      {selectedReviewAssignment && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-stone-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base font-serif">
                    Réponses au Diagnostic — {selectedReviewAssignment.client.firstName} {selectedReviewAssignment.client.lastName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {selectedReviewAssignment.assignment.title} • Complété le{' '}
                    {selectedReviewAssignment.assignment.completedAt
                      ? new Date(selectedReviewAssignment.assignment.completedAt).toLocaleString('fr-FR')
                      : 'Date non renseignée'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReviewAssignment(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Answers Detail */}
            {(() => {
              const client = selectedReviewAssignment.client;
              const responses = selectedReviewAssignment.assignment.responses || {};
              const couleurs: string[] = responses.couleurs || client.couleurs || [];
              const styles: string[] = responses.styles || client.styles || [];
              const isImageDiag = couleurs.length > 0 || styles.length > 0 || selectedReviewAssignment.assignment.moduleId === 'mod_diagnostic_image_ludidiag';

              if (isImageDiag) {
                const genre = client.genre || responses.genre || 'femme';
                return (
                  <div className="space-y-6">
                    {/* Coordonnées & Genre */}
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-stone-400 block">Genre</span>
                        <span className="font-semibold text-stone-800 capitalize">{genre}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-stone-400 block">Âge</span>
                        <span className="font-semibold text-stone-800">{client.age || responses.age || '—'} ans</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-stone-400 block">Téléphone</span>
                        <span className="font-semibold text-stone-800">{client.phone || responses.telephone || '—'}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[10px] font-semibold uppercase text-stone-400 block">Adresse & Ville</span>
                        <span className="font-semibold text-stone-800">
                          {[client.adresse || responses.adresse, client.codePostal || responses.codePostal, client.ville || responses.ville].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Associations de Couleur */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
                          <span>Associations de Couleur</span>
                        </h4>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {couleurs.length} planche{couleurs.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {couleurs.length === 0 ? (
                        <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-100">
                          Aucune association de couleur sélectionnée.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {couleurs.map((fichier) => {
                            const chemin = resoudreCheminDocument('assocolor', genre, fichier);
                            const titre = embellirTitre(fichier);
                            return (
                              <div
                                key={fichier}
                                className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-colors"
                              >
                                <img
                                  src={chemin}
                                  alt={titre}
                                  className="w-12 h-10 rounded-lg object-cover bg-stone-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setApercuImageModal({ chemin, titre })}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-stone-800 truncate">{titre}</p>
                                  <p className="text-[10px] text-stone-400 truncate">{fichier}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setApercuImageModal({ chemin, titre })}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 underline font-medium px-1"
                                >
                                  Agrandir
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recettes de Style */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
                          <span>Recettes de Style</span>
                        </h4>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {styles.length} recette{styles.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {styles.length === 0 ? (
                        <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-100">
                          Aucune recette de style sélectionnée.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {styles.map((fichier) => {
                            const chemin = resoudreCheminDocument('style', genre, fichier);
                            const titre = embellirTitre(fichier);
                            return (
                              <div
                                key={fichier}
                                className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-colors"
                              >
                                <img
                                  src={chemin}
                                  alt={titre}
                                  className="w-12 h-10 rounded-lg object-cover bg-stone-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setApercuImageModal({ chemin, titre })}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-stone-800 truncate">{titre}</p>
                                  <p className="text-[10px] text-stone-400 truncate">{fichier}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setApercuImageModal({ chemin, titre })}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 underline font-medium px-1"
                                >
                                  Agrandir
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions de téléchargement & nouveau diagnostic */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => telechargerFicheDepuisClient(client)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger la fiche (.txt)</span>
                      </button>

                      {onStartDiagnosticForClient && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReviewAssignment(null);
                            onStartDiagnosticForClient(client);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                          <span>Relancer un diagnostic</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Default questionnaire rendering
              return (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-700">
                        1. Niveau d'alignement avec les objectifs
                      </span>
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        {responses?.alignmentScore || selectedReviewAssignment.assignment.resultsSummary?.score || 'N/A'} / 5
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700">
                      2. Enjeu prioritaire identifié par la cliente
                    </span>
                    <p className="text-xs text-stone-900 font-medium">
                      {responses?.primaryFocus || 'Non précisé'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <span className="text-xs font-semibold text-stone-700">
                      3. Facteurs de drainage d'énergie déclarés
                    </span>
                    {Array.isArray(responses?.energyDrains) && responses.energyDrains.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {responses.energyDrains.map((drain: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-white border border-stone-200 text-stone-800 font-medium">
                            • {drain}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500">Aucun facteur particulier coché.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                    <span className="text-xs font-semibold text-stone-700">
                      4. Note ou attentes confidentielles pour le coach
                    </span>
                    <p className="text-xs text-stone-800 italic bg-white p-3 rounded-lg border border-stone-200">
                      "{responses?.notes || 'Aucun commentaire additionnel.'}"
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Données strictement confidentielles réservées à votre cabinet</span>
              </span>
              <button
                onClick={() => setSelectedReviewAssignment(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Fermer la consultation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-stone-800" />
                <h3 className="font-semibold text-stone-900 text-base">
                  Créer une fiche cliente & générer son lien
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="ex. Sophie"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="ex. Martin"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Email de la cliente *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sophie.martin@example.com"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Questionnaire initial à assigner *
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white"
                >
                  {SAAS_MODULES_REGISTRY.filter(m => m.isAvailable).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.estimatedDuration})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-stone-500">
                  Génère un lien public sécurisé, direct et sans création de compte pour la cliente.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {submitting ? 'Création...' : 'Créer & Générer le lien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal for boards */}
      {apercuImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setApercuImageModal(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl p-2"
          >
            <div className="flex items-center justify-between p-3 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 font-serif">
                {apercuImageModal.titre}
              </h4>
              <button
                type="button"
                onClick={() => setApercuImageModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                ✕
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh]">
              <img
                src={apercuImageModal.chemin}
                alt={apercuImageModal.titre}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
