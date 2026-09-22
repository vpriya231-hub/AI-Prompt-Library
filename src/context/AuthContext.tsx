import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UnauthorizedDomainModal } from '../components/UnauthorizedDomainModal';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  authLoading: boolean;
  isLoggingIn: boolean;
  isProUser: boolean;
  showUnauthorizedModal: boolean;
  setShowUnauthorizedModal: (show: boolean) => void;
  signInWithGoogle: () => Promise<User | null>;
  signInAsPreviewUser: (email?: string, pro?: boolean) => void;
  signOutUser: () => Promise<void>;
  checkProStatus: (userToCheck?: User | null) => Promise<boolean>;
  setIsProUser: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  isLoggedIn: false,
  loading: true,
  authLoading: true,
  isLoggingIn: false,
  isProUser: false,
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
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Boolean(auth.currentUser));
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(!auth.currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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

  // Sync auth state across whole app and handle redirect result
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

    // Handle redirect result on app load (critical for WebView2 / Windows Store PWA redirect flow)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          console.log('Redirect sign-in successful for:', result.user.email);
          sessionStorage.removeItem('ai_prompt_preview_user');
          setCurrentUser(result.user);
          await checkProStatus(result.user);
        }
      })
      .catch((error) => {
        console.warn('Redirect sign-in check notice:', error);
        const err = error as { code?: string; message?: string };
        if (err?.code === 'auth/unauthorized-domain') {
          console.warn('Firebase error: auth/unauthorized-domain. Showing authorization modal.');
          setShowUnauthorizedModal(true);
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Firebase onAuthStateChanged triggered:', user ? user.email : 'No user');
      if (user) {
        // User is signed in!
        sessionStorage.removeItem('ai_prompt_preview_user');
        setCurrentUser(user);
        setIsLoggedIn(true);
        try {
          await checkProStatus(user);
        } catch (e) {
          console.warn('PRO check error:', e);
        }
      } else {
        const savedPreview = sessionStorage.getItem('ai_prompt_preview_user');
        if (savedPreview) {
          try {
            const parsed = JSON.parse(savedPreview);
            setCurrentUser(parsed.user as User);
            setIsLoggedIn(true);
            setIsProUser(Boolean(parsed.isPro));
          } catch {
            setCurrentUser(null);
            setIsLoggedIn(false);
            setIsProUser(false);
          }
        } else {
          // User is signed out
          setCurrentUser(null);
          setIsLoggedIn(false);
          setIsProUser(false);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setIsLoggingIn(true);
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      console.log('Initiating Google Sign-In with 12s timeout failsafe...');

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutTimer = setTimeout(() => {
          const timeoutErr = new Error('Sign-in popup timed out after 12 seconds');
          (timeoutErr as { code?: string }).code = 'auth/popup-timeout';
          reject(timeoutErr);
        }, 12000);
      });

      // Race signInWithPopup against a strict 12-second timeout
      const result = await Promise.race([
        signInWithPopup(auth, googleProvider),
        timeoutPromise
      ]);

      if (timeoutTimer) clearTimeout(timeoutTimer);

      const user = result.user;
      console.log('Google Sign-In successful for:', user.email);
      sessionStorage.removeItem('ai_prompt_preview_user');
      setCurrentUser(user);
      setIsLoggedIn(true);
      setAuthLoading(false);
      await checkProStatus(user);
      return user;
    } catch (error: unknown) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      console.error('Sign-in attempt failed or timed out:', error);
      const err = error as { code?: string; message?: string };

      if (err?.code === 'auth/unauthorized-domain') {
        console.warn('Firebase error: auth/unauthorized-domain. Showing authorization modal.');
        setShowUnauthorizedModal(true);
        throw error;
      }

      // If popup takes >12s, or throws auth/popup-blocked, auth/cancelled-popup-request, or auth/popup-timeout:
      const isPopupFailure =
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-timeout' ||
        err?.message?.includes('timed out');

      if (isPopupFailure) {
        console.warn('Popup blocked/timed out in WebView2/PWA. Attempting fallback or redirect...');
        try {
          // Attempt signInWithRedirect as fallback
          await signInWithRedirect(auth, googleProvider);
          return null;
        } catch (redirectErr) {
          console.warn('signInWithRedirect fallback could not proceed in this container:', redirectErr);
          const fallbackToastError = new Error('Sign-in window could not open automatically. Please try again or open in your browser.');
          (fallbackToastError as { code?: string }).code = 'auth/popup-blocked';
          throw fallbackToastError;
        }
      }

      throw error;
    } finally {
      // Immediately reset loading state so the button never stays stuck
      setIsLoggingIn(false);
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
      setIsLoggedIn(false);
      setIsProUser(false);
      setAuthLoading(false);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentUser,
        isLoggedIn,
        loading: authLoading,
        authLoading,
        isLoggingIn,
        isProUser,
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
