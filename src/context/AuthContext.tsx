import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  getOrCreateUserProfile, 
  signInWithPopup, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  firebaseSignOut,
  onAuthStateChanged,
  type FirebaseUser
} from '../services/firebase';
import { UserProfile, Workspace } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateWorkspaceBrandData: (brand: Workspace['brand']) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Translate technical Firebase error codes into helpful, professional French messages
function formatAuthErrorMessage(error: any): string {
  if (!error) return 'Une erreur inattendue est survenue.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Adresse email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà enregistrée. Veuillez vous connecter.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/invalid-email':
      return 'Le format de l\'adresse email est invalide.';
    case 'auth/user-disabled':
      return 'Ce compte a été suspendu par un administrateur.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter avant de réessayer.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée avant la validation.';
    case 'auth/cancelled-popup-request':
      return 'Une autre demande de connexion est déjà en cours.';
    case 'auth/popup-blocked':
      return 'La fenêtre de connexion a été bloquée par votre navigateur. Autorisez les popups pour continuer.';
    case 'auth/network-request-failed':
      return 'Problème de connexion réseau. Vérifiez votre accès internet.';
    case 'auth/operation-not-allowed':
      return 'Ce mode d\'authentification n\'est pas encore activé dans la console Firebase.';
    default:
      return error.message || 'Échec de l\'authentification.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      if (currentUser) {
        setUser(currentUser);
        try {
          const { profile: userProfile, workspace: userWs } = await getOrCreateUserProfile(currentUser);
          setProfile(userProfile);
          setWorkspace(userWs);
        } catch (err: any) {
          console.error('Error fetching user profile:', err);
          setError(formatAuthErrorMessage(err));
        }
      } else {
        setUser(null);
        setProfile(null);
        setWorkspace(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred?.user) {
        const { profile: userProfile, workspace: userWs } = await getOrCreateUserProfile(cred.user);
        setProfile(userProfile);
        setWorkspace(userWs);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      // If user closed popup intentionally, don't show persistent blocker error
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(formatAuthErrorMessage(err));
      }
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred?.user) {
        const { profile: userProfile, workspace: userWs } = await getOrCreateUserProfile(cred.user);
        setProfile(userProfile);
        setWorkspace(userWs);
      }
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      const friendlyMsg = formatAuthErrorMessage(err);
      setError(friendlyMsg);
      setLoading(false);
      throw new Error(friendlyMsg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && cred.user) {
        try {
          await updateProfile(cred.user, { displayName });
        } catch (e) {
          console.warn('Could not update Firebase auth profile displayName:', e);
        }
      }
      // Bootstrap Firestore profile with explicit displayName
      const { profile: userProfile, workspace: userWs } = await getOrCreateUserProfile(cred.user, displayName);
      setProfile(userProfile);
      setWorkspace(userWs);
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      const friendlyMsg = formatAuthErrorMessage(err);
      setError(friendlyMsg);
      setLoading(false);
      throw new Error(friendlyMsg);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setWorkspace(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setError(err?.message || 'Erreur lors de la déconnexion.');
    }
  };

  const updateWorkspaceBrandData = async (newBrand: Workspace['brand']) => {
    if (!workspace) return;
    try {
      const wsRef = doc(db, 'workspaces', workspace.id);
      await updateDoc(wsRef, {
        brand: newBrand,
        updatedAt: new Date().toISOString()
      });
      setWorkspace(prev => prev ? { ...prev, brand: newBrand } : null);
    } catch (err: any) {
      console.error('Failed to update workspace branding:', err);
      throw err;
    }
  };

  const refreshWorkspace = async () => {
    if (user) {
      const { profile: userProfile, workspace: userWs } = await getOrCreateUserProfile(user);
      setProfile(userProfile);
      setWorkspace(userWs);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        workspace,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateWorkspaceBrandData,
        refreshWorkspace
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
