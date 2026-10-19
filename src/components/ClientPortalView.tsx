import React, { useState, useEffect } from 'react';
import { useWorkspaceTheme, DEFAULT_THRYVE_BRAND } from '../context/WorkspaceThemeContext';
import { 
  resolveDiagnosticAssignment, 
  submitDiagnosticSubmission,
  ResolvedDiagnostic 
} from '../services/diagnosticAccess';
import { DiagnosticAssignment, WorkspaceBranding } from '../types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Send,
  Lock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';

interface ClientPortalViewProps {
  token?: string;
  workspaceId?: string;
  onBackToDashboard?: () => void;
  assignmentTitle?: string;
  clientName?: string;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  token: initialToken,
  workspaceId: initialWsId,
  onBackToDashboard,
  assignmentTitle: defaultTitle = 'Diagnostic Holistique & Alignement',
  clientName: defaultClientName = 'Cliente / Client'
}) => {
  const globalTheme = useWorkspaceTheme();

  // URL extraction if not passed via props
  const [token, setToken] = useState<string | null>(() => {
    if (initialToken) return initialToken;
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  });

  const [wsId, setWsId] = useState<string | null>(() => {
    if (initialWsId) return initialWsId;
    const params = new URLSearchParams(window.location.search);
    return params.get('ws') || globalTheme.workspace?.id || null;
  });

  // State for resolved assignment & branding
  const [loading, setLoading] = useState<boolean>(Boolean(token && wsId));
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<DiagnosticAssignment | null>(null);
  const [localBrand, setLocalBrand] = useState<WorkspaceBranding>(globalTheme.brand || DEFAULT_THRYVE_BRAND);

  // Diagnostic form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [q1Value, setQ1Value] = useState<number>(4);
  const [q2Value, setQ2Value] = useState<string>('Clarté d\'alignement et dynamisation des projets');
  const [selectedEnergyDrains, setSelectedEnergyDrains] = useState<string[]>([
    'Surcharge mentale et dispersion',
    'Rythme de travail et manque de récupération'
  ]);
  const [clientNotes, setClientNotes] = useState<string>('');
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Load and validate token against Cloud Firestore
  useEffect(() => {
    async function loadAssignment() {
      if (!token || !wsId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setResolveError(null);

      const res: ResolvedDiagnostic = await resolveDiagnosticAssignment(wsId, token);

      if (!res.success || !res.assignment) {
        setResolveError(res.error || 'Accès invalide ou expiré.');
        setLoading(false);
        return;
      }

      setAssignment(res.assignment);
      if (res.brand) {
        setLocalBrand(res.brand);
      }

      if (res.assignment.status === 'completed') {
        setIsCompleted(true);
      }

      setLoading(false);
    }

    loadAssignment();
  }, [token, wsId]);

  const effectiveBrand = localBrand || globalTheme.brand;
  const displayTitle = assignment?.title || defaultTitle;
  const displayClientName = assignment?.clientName || defaultClientName;

  const toggleEnergyDrain = (opt: string) => {
    setSelectedEnergyDrains(prev => 
      prev.includes(opt) ? prev.filter(item => item !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async () => {
    if (!token || !wsId || !assignment) {
      // In simulation mode without Firestore doc
      setIsCompleted(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const responses = {
      alignmentScore: q1Value,
      primaryFocus: q2Value,
      energyDrains: selectedEnergyDrains,
      notes: clientNotes,
      submittedAt: new Date().toISOString()
    };

    const summary = {
      score: q1Value,
      completedDate: new Date().toISOString(),
      keyInsights: [
        `Niveau d'alignement perçu : ${q1Value}/5`,
        `Priorité : ${q2Value}`,
        `Facteurs d'épuisement identifiés : ${selectedEnergyDrains.length}`
      ]
    };

    const res = await submitDiagnosticSubmission(
      wsId,
      assignment.id,
      token,
      responses,
      summary
    );

    setSubmitting(false);

    if (res.success) {
      setIsCompleted(true);
    } else {
      setSubmitError(res.error || 'Erreur lors de la transmission. Veuillez réessayer.');
    }
  };

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
          style={{ backgroundColor: effectiveBrand.primaryColor }}
        >
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-800">
            Vérification sécurisée de votre accès...
          </p>
          <p className="text-xs text-stone-500">
            Chargement de l'espace de diagnostic préparé par votre coach.
          </p>
        </div>
      </div>
    );
  }

  // 2. Error state (Expired or Invalid token)
  if (resolveError) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-6">
        <div className="max-w-md w-full mx-auto my-auto bg-white rounded-2xl border border-stone-200 p-8 shadow-xs text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center border border-amber-200/60">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              Lien de diagnostic inaccessible
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {resolveError}
            </p>
          </div>

          <div className="pt-2">
            {onBackToDashboard ? (
              <button
                onClick={onBackToDashboard}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Retour au tableau de bord
              </button>
            ) : (
              <p className="text-[11px] text-stone-400">
                Veuillez vous rapprocher de votre coach pour obtenir un nouveau lien valide.
              </p>
            )}
          </div>
        </div>

        <footer className="text-center text-xs text-stone-400 py-4">
          THRYVE — Plateforme SaaS de coaching et de transformation individuelle.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between font-sans selection:bg-stone-200">
      {/* Top Banner with Coach Customized Branding */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Coach's customized logo & title */}
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-xs transition-colors"
              style={{ backgroundColor: effectiveBrand.primaryColor }}
            >
              {effectiveBrand.displayName ? effectiveBrand.displayName[0].toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-stone-900 leading-tight">
                {effectiveBrand.displayName}
              </h1>
              {effectiveBrand.tagline && (
                <p className="text-[11px] text-stone-500 leading-tight">{effectiveBrand.tagline}</p>
              )}
            </div>
          </div>

          {/* Preview indicator or clean client view */}
          <div className="flex items-center gap-3">
            {onBackToDashboard ? (
              <button
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs"
                title="Quitter la prévisualisation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Fermer la prévisualisation coach</span>
              </button>
            ) : (
              <span className="text-[11px] text-stone-400 font-medium">
                Questionnaire confidentiel
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Diagnostic Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress tracker */}
        {!isCompleted && (
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span className="uppercase tracking-wider font-semibold">
                Étape {currentStep} sur {totalSteps}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% complété</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300 rounded-full"
                style={{ 
                  width: `${(currentStep / totalSteps) * 100}%`,
                  backgroundColor: effectiveBrand.primaryColor 
                }}
              />
            </div>
          </div>
        )}

        {/* Diagnostic Content Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-10 shadow-xs relative">
          {/* Welcome Message from Coach */}
          {effectiveBrand.clientWelcomeMessage && currentStep === 1 && !isCompleted && (
            <div 
              className="mb-8 p-4 rounded-xl border text-xs leading-relaxed"
              style={{ 
                backgroundColor: effectiveBrand.secondaryColor, 
                borderColor: `${effectiveBrand.primaryColor}25`,
                color: effectiveBrand.primaryColor 
              }}
            >
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Message d'accueil de votre coach :</span>
              </div>
              <p className="text-stone-700">{effectiveBrand.clientWelcomeMessage}</p>
            </div>
          )}

          {!isCompleted ? (
            <div className="space-y-8">
              {/* Diagnostic Header */}
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                  Questionnaire d'évaluation personnalisé
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-serif mt-1">
                  {displayTitle}
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  Dossier préparé pour <strong className="text-stone-800">{displayClientName}</strong>. Vos réponses sont strictement confidentielles et transmises à votre coach.
                </p>
              </div>

              {/* Step 1 Questions */}
              {currentStep === 1 && (
                <div className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-stone-900">
                      1. Sur une échelle de 1 à 5, comment évaluez-vous votre niveau actuel d'alignement avec vos objectifs ?
                    </label>
                    <div className="grid grid-cols-5 gap-2 sm:gap-4">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setQ1Value(val)}
                          className={`
                            py-3 rounded-xl border text-center font-semibold text-sm transition-all
                            ${q1Value === val
                              ? 'text-white shadow-xs'
                              : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-stone-50/50'
                            }
                          `}
                          style={q1Value === val ? { backgroundColor: effectiveBrand.primaryColor } : {}}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-400">
                      <span>Désalignement sensible (1)</span>
                      <span>Alignement optimal (5)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-stone-900">
                      2. Quel est l'enjeu prioritaire que vous souhaitez aborder lors de vos prochaines séances ?
                    </label>
                    <input
                      type="text"
                      value={q2Value}
                      onChange={(e) => setQ2Value(e.target.value)}
                      placeholder="Votre priorité majeure..."
                      className="w-full px-4 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 Questions */}
              {currentStep === 2 && (
                <div className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-stone-900">
                      3. Quelles sont les sources principales qui drainent actuellement votre énergie ? (Plusieurs choix possibles)
                    </label>
                    <div className="space-y-2.5">
                      {[
                        'Surcharge mentale et dispersion',
                        'Manque de clarté sur les priorités et prises de décision',
                        'Tensions relationnelles ou environnement inadapté',
                        'Rythme de travail et manque de récupération',
                        'Doute sur la légitimité ou perte de motivation'
                      ].map((opt) => {
                        const isChecked = selectedEnergyDrains.includes(opt);
                        return (
                          <label 
                            key={opt}
                            onClick={() => toggleEnergyDrain(opt)}
                            className={`
                              flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-xs sm:text-sm transition-all
                              ${isChecked 
                                ? 'border-stone-800 bg-stone-50/80 font-medium text-stone-900' 
                                : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                              }
                            `}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-stone-900 focus:ring-stone-800" 
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Questions */}
              {currentStep === 3 && (
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-stone-900">
                      4. Note complémentaire ou attentes particulières pour votre coach
                    </label>
                    <textarea
                      rows={4}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Partagez tout élément utile pour préparer votre entretien..."
                      className="w-full px-4 py-3 text-xs sm:text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 space-y-1">
                    <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-stone-500" />
                      <span>Confidentialité garantie</span>
                    </div>
                    <p>
                      Vos réponses seront transmises directement à l'espace de votre coach {effectiveBrand.displayName}.
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {submitError}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>
                ) : <div />}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-95"
                    style={{ backgroundColor: effectiveBrand.primaryColor }}
                  >
                    <span>Continuer</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-opacity hover:opacity-95"
                    style={{ backgroundColor: effectiveBrand.primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Transmettre mes réponses</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Submission Success State (Session closes completely for client) */
            <div className="py-8 text-center space-y-5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto shadow-sm"
                style={{ backgroundColor: effectiveBrand.primaryColor }}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-stone-900 font-serif">
                  Merci {displayClientName}, vos réponses ont bien été transmises
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                  Votre questionnaire a été envoyé directement à votre coach <strong>{effectiveBrand.displayName}</strong>. Vous explorerez ces éléments ensemble lors de votre prochain entretien.
                </p>
                <p className="text-[11px] text-stone-400 pt-2">
                  Cette session est terminée. Vous pouvez fermer cet onglet en toute sérénité.
                </p>
              </div>

              {onBackToDashboard && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={onBackToDashboard}
                    className="px-5 py-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Fermer la prévisualisation coach
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding for THRYVE platform */}
      <footer className="py-6 border-t border-stone-200/80 bg-white text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
          <span>Propulsé par</span>
          <span className="font-bold tracking-wider text-stone-700 font-serif">THRYVE</span>
          <span>— Grow beyond limits</span>
        </div>
      </footer>
    </div>
  );
};
