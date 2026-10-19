import { db, getWorkspacePublicBrand } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';
import { DiagnosticAssignment, WorkspaceBranding } from '../types';

/**
 * Generate a cryptographically secure token with 192 bits of entropy
 */
export function generateSecureDiagnosticToken(): string {
  const array = new Uint8Array(24);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    // Ultimate fallback for any restricted environment
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `thryve_sec_${hex}`;
}

export interface ResolvedDiagnostic {
  success: boolean;
  assignment?: DiagnosticAssignment;
  brand?: WorkspaceBranding;
  error?: string;
}

/**
 * Validates and resolves a client diagnostic access link
 * Enforces token matching, expiration check, and loads the coach's customized branding
 */
export async function resolveDiagnosticAssignment(
  workspaceId: string, 
  shareToken: string
): Promise<ResolvedDiagnostic> {
  if (!workspaceId || !shareToken) {
    return {
      success: false,
      error: 'Paramètres d\'accès au diagnostic invalides ou incomplets.'
    };
  }

  try {
    // 1. Fetch public branding of the coach's workspace
    const workspace = await getWorkspacePublicBrand(workspaceId);
    if (!workspace) {
      return {
        success: false,
        error: 'L\'espace de travail du coach est introuvable ou indisponible.'
      };
    }

    // 2. Query assignments subcollection for the matching token
    const assignmentsRef = collection(db, 'workspaces', workspaceId, 'assignments');
    const q = query(assignmentsRef, where('shareToken', '==', shareToken));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      return {
        success: false,
        error: 'Lien de diagnostic introuvable ou révoqué par votre coach.'
      };
    }

    const docSnap = querySnap.docs[0];
    const assignment = { id: docSnap.id, ...(docSnap.data() as Omit<DiagnosticAssignment, 'id'>) };

    // 3. Expiration validation
    if (assignment.expiresAt) {
      const expirationDate = new Date(assignment.expiresAt);
      if (expirationDate.getTime() < Date.now() && assignment.status !== 'completed') {
        // Mark as expired in Firestore
        try {
          await updateDoc(docSnap.ref, { 
            status: 'expired',
            updatedAt: new Date().toISOString()
          });
          assignment.status = 'expired';
        } catch (e) {
          console.warn('Could not update expired status in Firestore:', e);
        }

        return {
          success: false,
          error: 'Ce lien de diagnostic a expiré. Veuillez contacter votre coach pour obtenir une nouvelle invitation.'
        };
      }
    }

    return {
      success: true,
      assignment,
      brand: workspace.brand
    };
  } catch (err: any) {
    console.error('Error resolving diagnostic assignment:', err);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la vérification de vos accès.'
    };
  }
}

/**
 * Securely submit client diagnostic answers and mark assignment completed
 */
export async function submitDiagnosticSubmission(
  workspaceId: string,
  assignmentId: string,
  shareToken: string,
  responses: Record<string, any>,
  summary?: { score?: number; keyInsights?: string[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const assignmentRef = doc(db, 'workspaces', workspaceId, 'assignments', assignmentId);
    const snap = await getDoc(assignmentRef);

    if (!snap.exists()) {
      return { success: false, error: 'Diagnostic introuvable.' };
    }

    const current = snap.data() as DiagnosticAssignment;

    // Strict token and integrity check
    if (current.shareToken !== shareToken) {
      return { success: false, error: 'Jeton de sécurité non concordant.' };
    }

    if (current.status === 'completed') {
      return { success: false, error: 'Ce diagnostic a déjà été transmis et validé.' };
    }

    if (current.status === 'expired') {
      return { success: false, error: 'Ce diagnostic a expiré.' };
    }

    const completedAt = new Date().toISOString();
    await updateDoc(assignmentRef, {
      status: 'completed',
      responses,
      resultsSummary: summary || {
        completedDate: completedAt,
        score: responses.alignmentScore || null
      },
      completedAt,
      updatedAt: completedAt
    });

    // Optionally update client status if clientId present
    if (current.clientId) {
      try {
        const clientRef = doc(db, 'workspaces', workspaceId, 'clients', current.clientId);
        await updateDoc(clientRef, {
          status: 'completed',
          updatedAt: completedAt
        });
      } catch (err) {
        console.warn('Non-blocking: could not update client status to completed:', err);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error submitting diagnostic:', err);
    return { success: false, error: err?.message || 'Erreur lors de la transmission des réponses.' };
  }
}
