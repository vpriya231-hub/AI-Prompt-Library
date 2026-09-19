import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UnauthorizedDomainModal } from '../components/UnauthorizedDomainModal';

interface AuthContextType {
  currentUser: User | null;
  isProUser: boolean;
  authLoading: boolean;
  showUnauthorizedModal: boolean;
  setShowUnauthorizedModal: (show: boolean) => void;
  signInWithGoogle: () => Promise<User | null>;
  signInAsPreviewUser: (email?: string, pro?: boolean) => void;
  signOutUser: () => Promise<void>;
  checkProStatus: (userToCheck?: User | null) => Promise<boolean>;
  setIsProUser: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isProUser: false,
  authLoading: true,
  showUnauthorizedModal: false,
  setShowUnauthorizedModal: () => {},
  signInWithGoogle: async () => null,
  signInAsPreviewUser: () => {},
  signOutUser: async () => {},
  checkProStatus: async () => false,
  setIsProUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);

  // Check Firestore users/{uid} for PRO status matching Android schema
  const checkProStatus = async (userToCheck?: User | null): Promise<boolean> => {
    const targetUser = userToCheck !== undefined ? userToCheck : currentUser;
    if (!targetUser) {
      setIsProUser(false);
      return false;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', targetUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const pro = Boolean(data?.isPro === true || data?.proUser === true || data?.pro === true);
        setIsProUser(pro);
        return pro;
      }
      setIsProUser(false);
      return false;
    } catch (err) {
      console.warn('Firestore PRO status check warning (failed gracefully):', err);
      setIsProUser(false);
      return false;
    }
  };

  // Sync auth state across whole app
  useEffect(() => {
    // Check if a preview user is saved in sessionStorage
    const savedPreview = sessionStorage.getItem('ai_prompt_preview_user');
    if (savedPreview) {
      try {
        const parsed = JSON.parse(savedPreview);
        setCurrentUser(parsed.user as User);
        setIsProUser(Boolean(parsed.isPro));
        setAuthLoading(false);
      } catch (e) {
        console.warn('Failed to parse preview user', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        sessionStorage.removeItem('ai_prompt_preview_user');
        setCurrentUser(user);
        await checkProStatus(user);
      } else if (!sessionStorage.getItem('ai_prompt_preview_user')) {
        setCurrentUser(null);
        setIsProUser(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      console.log('Initiating Google Sign-In with popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google Sign-In successful for:', user.email);
      sessionStorage.removeItem('ai_prompt_preview_user');
      setCurrentUser(user);
      await checkProStatus(user);
      return user;
    } catch (error: unknown) {
      console.error('Sign-in failed:', error);
      const err = error as { code?: string; message?: string };
      if (err?.code === 'auth/unauthorized-domain') {
        console.warn('Firebase error: auth/unauthorized-domain. Showing authorization modal.');
        setShowUnauthorizedModal(true);
      }
      throw error;
    }
  };

  const signInAsPreviewUser = (email = 'vpriya231@gmail.com', pro = false) => {
    const mockUser: Partial<User> = {
      uid: 'preview-user-uid-12345',
      email,
      displayName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
      emailVerified: true,
    };
    setCurrentUser(mockUser as User);
    setIsProUser(pro);
    sessionStorage.setItem('ai_prompt_preview_user', JSON.stringify({ user: mockUser, isPro: pro }));
    setShowUnauthorizedModal(false);
  };

  const signOutUser = async () => {
    try {
      sessionStorage.removeItem('ai_prompt_preview_user');
      await signOut(auth);
      setCurrentUser(null);
      setIsProUser(false);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isProUser,
        authLoading,
        showUnauthorizedModal,
        setShowUnauthorizedModal,
        signInWithGoogle,
        signInAsPreviewUser,
        signOutUser,
        checkProStatus,
        setIsProUser,
      }}
    >
      {children}
      <UnauthorizedDomainModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
        onContinueAsPreview={() => signInAsPreviewUser('vpriya231@gmail.com', false)}
      />
    </AuthContext.Provider>
  );
};
