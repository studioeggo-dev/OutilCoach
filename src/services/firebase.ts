import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Workspace } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Set persistence explicitly to browserLocalPersistence
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('Firebase persistence init error:', err);
  });
}

// Connect to Firestore with specific database ID if provided
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Storage
export const storage = getStorage(app, firebaseConfig.storageBucket || undefined);

export {
  signInWithPopup,
  firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  type FirebaseUser,
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};

/**
 * Fetch or bootstrap user profile with multi-tenant default workspace
 */
export async function getOrCreateUserProfile(
  user: FirebaseUser, 
  fallbackDisplayName?: string
): Promise<{ profile: UserProfile; workspace: Workspace }> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const effectiveName = user.displayName || fallbackDisplayName || 'Coach THRYVE';

  if (snap.exists()) {
    const profile = snap.data() as UserProfile;
    // If displayName was previously generic but we now have an explicit name, update it
    if (effectiveName !== 'Coach THRYVE' && profile.displayName === 'Coach THRYVE') {
      try {
        await updateDoc(userRef, { displayName: effectiveName, updatedAt: new Date().toISOString() });
        profile.displayName = effectiveName;
      } catch (e) {
        console.warn('Could not update profile displayName:', e);
      }
    }

    // Load active workspace
    const wsRef = doc(db, 'workspaces', profile.activeWorkspaceId || `ws_${user.uid}`);
    const wsSnap = await getDoc(wsRef);
    if (wsSnap.exists()) {
      return { profile, workspace: wsSnap.data() as Workspace };
    }
  }

  // Create default initial workspace for new coach
  const defaultWorkspaceId = `ws_${user.uid}`;
  const defaultWorkspace: Workspace = {
    id: defaultWorkspaceId,
    name: effectiveName !== 'Coach THRYVE' ? `Espace ${effectiveName}` : 'Mon Espace Coaching',
    slug: effectiveName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    ownerId: user.uid,
    brand: {
      displayName: effectiveName !== 'Coach THRYVE' ? `Cabinet de Coaching — ${effectiveName}` : 'Mon Espace Coaching',
      tagline: 'Accompagnement & Révélation du Potentiel',
      primaryColor: '#0F766E', // Refined teal
      secondaryColor: '#F0FDFA', // Soft tinted background
      accentColor: '#D97706',
      clientWelcomeMessage: 'Bienvenue dans votre espace personnel d\'accompagnement. Complétez vos diagnostics en toute sérénité.'
    },
    enabledModuleIds: ['mod_diagnostic_holistique', 'mod_plan_action'],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: effectiveName,
    photoURL: user.photoURL || undefined,
    role: 'coach',
    activeWorkspaceId: defaultWorkspaceId,
    createdAt: new Date().toISOString()
  };

  // Save to Firestore
  await setDoc(userRef, newProfile);
  await setDoc(doc(db, 'workspaces', defaultWorkspaceId), defaultWorkspace);

  return { profile: newProfile, workspace: defaultWorkspace };
}

/**
 * Fetch public workspace branding for Client Portal
 */
export async function getWorkspacePublicBrand(workspaceId: string): Promise<Workspace | null> {
  try {
    const wsRef = doc(db, 'workspaces', workspaceId);
    const snap = await getDoc(wsRef);
    if (snap.exists()) {
      return snap.data() as Workspace;
    }
    return null;
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return null;
  }
}
