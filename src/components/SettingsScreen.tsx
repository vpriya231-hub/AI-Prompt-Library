import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  deleteUser, 
  User 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

interface SettingsScreenProps {
  onBack: () => void;
  showToast: (message: string) => void;
  hasUnlockedPro: boolean;
  onProStatusChange?: (isPro: boolean) => void;
}

export function SettingsScreen({ 
  onBack, 
  showToast, 
  hasUnlockedPro, 
  onProStatusChange 
}: SettingsScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isProUser, setIsProUser] = useState(hasUnlockedPro);
  const [signingIn, setSigningIn] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Listen to Auth state and fetch Pro status from Firestore (strictly read-only)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Exact read-only check for users/{uid}
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const data = userDoc.exists() ? userDoc.data() : null;
          const proActive = Boolean(data?.isPro === true || data?.pro === true);
          setIsProUser(proActive);
          if (onProStatusChange) onProStatusChange(proActive);
        } catch (err) {
          console.warn('Firestore read-only PRO status check error:', err);
          setIsProUser(hasUnlockedPro);
        }
      } else {
        setIsProUser(false);
        if (onProStatusChange) onProStatusChange(false);
      }
    });

    return () => unsubscribe();
  }, [hasUnlockedPro, onProStatusChange]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      setUser(signedInUser);
      
      // Exact read-only query upon login
      try {
        const userDoc = await getDoc(doc(db, 'users', signedInUser.uid));
        const data = userDoc.exists() ? userDoc.data() : null;
        const proActive = Boolean(data?.isPro === true || data?.pro === true);
        setIsProUser(proActive);
        if (onProStatusChange) onProStatusChange(proActive);
      } catch (err) {
        console.warn('Firestore read-only PRO check error:', err);
      }

      showToast('Signed in successfully!');
    } catch (err: unknown) {
      console.error('Sign-in failed:', err);
      const error = err as { code?: string; message?: string };
      if (error?.code !== 'auth/popup-closed-by-user') {
        showToast(error?.message || 'Google Sign-In failed.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsProUser(hasUnlockedPro);
      showToast('Signed out');
    } catch (err) {
      console.error('Sign out error:', err);
      showToast('Error signing out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (isProUser) {
      showToast('Pro account cannot be deleted while premium access is active.');
      setShowDeleteConfirm(false);
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteUser(user);
      setUser(null);
      setShowDeleteConfirm(false);
      showToast('Account deleted successfully');
    } catch (err: unknown) {
      console.error('Delete user error:', err);
      const error = err as { code?: string; message?: string };
      if (error?.code === 'auth/requires-recent-login') {
        showToast('Please sign in again before deleting your account.');
      } else {
        showToast(error?.message || 'Failed to delete account.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4FA] text-[#1E1B22] font-sans antialiased flex flex-col selection:bg-purple-200">
      
      {/* Top Bar matching Screenshot 1 */}
      <header className="w-full bg-[#F3EDF7] py-3.5 px-4 border-b border-[#E8DEF2] sticky top-0 z-20 flex-shrink-0">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <button 
            id="settings-back-btn"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-[#E5DCEF] active:bg-[#D7CBDE] text-[#1E1B22] transition-colors cursor-pointer flex items-center justify-center"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-[#1E1B22] stroke-[2.4]" />
          </button>

          <h1 className="text-[17px] font-semibold text-[#1E1B22] tracking-tight">
            Settings
          </h1>

          {/* Balance layout spacer */}
          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 md:px-8 py-6 space-y-4 pb-16">
          
          {/* Header Title Section matching Screenshot 1 */}
          <section aria-label="Settings Header" className="space-y-0.5 pb-1">
            <h2 className="text-[32px] font-extrabold text-[#1E1B22] tracking-tight">
              Settings
            </h2>
            <p className="text-[14px] text-[#655E71] font-normal">
              AI Prompt Library
            </p>
          </section>

          {/* 1. Dynamic Account Card matching Screenshot 1 */}
          <div 
            id="settings-account-card"
            className="bg-[#EFE8F6] rounded-[22px] p-5 border border-[#E6DBEE] space-y-3.5 shadow-2xs transition-all"
          >
            {/* Not Signed In State (Screenshot 1: Account -> Not Signed In -> FREE) */}
            {!user ? (
              <div 
                onClick={handleGoogleSignIn}
                className="cursor-pointer space-y-3 group"
                title="Tap to sign in with Google"
              >
                <div>
                  <h3 className="text-[17px] font-bold text-[#1E1B22] tracking-tight">
                    Account
                  </h3>
                  <p className="text-[15px] font-bold text-[#1E1B22] mt-2 group-hover:text-[#654A9E] transition-colors">
                    {signingIn ? 'Opening Google Sign-In...' : 'Not Signed In'}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[13.5px] font-medium text-[#595364] tracking-wide">
                    FREE
                  </span>
                  <span className="text-xs text-[#654A9E] font-semibold underline underline-offset-2">
                    Sign in with Google
                  </span>
                </div>
              </div>
            ) : (
              /* Signed In State (Free Tier or PRO Tier) */
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[17px] font-bold text-[#1E1B22] tracking-tight">
                      Account
                    </h3>
                    <p className="text-[15px] font-bold text-[#1E1B22] mt-1.5 break-all">
                      {user.displayName || user.email || 'Signed In'}
                    </p>
                    {user.displayName && user.email && (
                      <p className="text-[12.5px] text-[#6B7280] break-all">{user.email}</p>
                    )}
                  </div>

                  {/* Tier Badge */}
                  <div className="pt-0.5 flex-shrink-0">
                    {isProUser ? (
                      <span className="bg-[#654A9E] text-white font-bold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                        💎 PRO
                      </span>
                    ) : (
                      <span className="text-[13.5px] font-medium text-[#595364] tracking-wide">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                {/* Signed In Action Buttons: Sign Out and Delete Account */}
                <div className="pt-3 border-t border-[#E3D6ED] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      id="settings-signout-btn"
                      onClick={handleSignOut}
                      className="text-xs font-semibold text-[#4B5563] hover:text-[#1E1B22] bg-white/70 hover:bg-white px-3.5 py-1.5 rounded-xl border border-[#D8C7E7] transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>

                    {isProUser ? (
                      <button
                        id="settings-delete-account-disabled"
                        onClick={() => showToast('Active PRO lifetime accounts require support verification for deletion. Please refer to our Account Deletion Policy.')}
                        className="text-xs font-semibold text-gray-600 bg-gray-100/90 hover:bg-gray-200/80 px-3.5 py-1.5 rounded-xl border border-gray-300 transition-colors cursor-pointer select-none"
                        title="Active PRO lifetime accounts require support verification for deletion."
                      >
                        Delete Account (Disabled for PRO)
                      </button>
                    ) : (
                      <button
                        id="settings-delete-account-btn"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Delete Account
                      </button>
                    )}
                  </div>

                  {isProUser && (
                    <p className="text-[11.5px] text-[#655E71] leading-relaxed pt-1">
                      PRO accounts cannot be self-deleted to protect active lifetime licenses. Click &apos;Account Deletion Policy&apos; below for support instructions.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu Items matching Screenshot 1 */}
          <div className="space-y-3">
            
            {/* PWA Install / Status */}
            <PWAInstallButton variant="menu" />

            {/* 1. App Version */}
            <div 
              id="menu-app-version"
              onClick={() => showToast('App is up to date')}
              className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[24px] select-none flex-shrink-0 leading-none">
                  📱
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight">
                    App Version
                  </h4>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    Version 1.0.0 (Build 1)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </div>

            {/* 2. Privacy Policy */}
            <a 
              id="menu-privacy-policy"
              href="https://sites.google.com/view/ai-prompt-library-v-astra-ai/home"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs block text-inherit"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[24px] select-none flex-shrink-0 leading-none">
                  🔒
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight">
                    Privacy Policy
                  </h4>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    Read our privacy policy
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </a>

            {/* 3. Account Deletion Policy */}
            <a 
              id="menu-account-deletion-policy"
              href="https://sites.google.com/view/ai-prompt-library-delete-data/home?pli=1&authuser=0"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs block text-inherit"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[24px] select-none flex-shrink-0 leading-none">
                  🗑️
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight">
                    Account Deletion Policy
                  </h4>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    Rules for Free & PRO account data removal
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </a>

            {/* 4. Disclaimer */}
            <div 
              id="menu-disclaimer"
              onClick={() => setShowDisclaimer(true)}
              className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[24px] select-none flex-shrink-0 leading-none">
                  📄
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight">
                    Disclaimer
                  </h4>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    Third-party trademarks
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </div>

            {/* 5. About Developer */}
            <div 
              id="menu-about-developer"
              onClick={() => showToast('Created by V Astra AI Studio')}
              className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-6 h-6 rounded-md bg-[#26A69A] flex items-center justify-center text-white font-bold text-[13px] leading-none select-none flex-shrink-0 shadow-2xs">
                  i
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight">
                    About Developer
                  </h4>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    V Astra AI Studio
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </div>

            {/* 6. Rate App */}
            <a 
              id="menu-rate-app"
              href="https://play.google.com/store/apps/details?id=com.aipromptlibrary.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs block text-inherit"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[24px] select-none flex-shrink-0 leading-none">
                  ⭐
                </span>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight">
                    Rate App
                  </h4>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    Review on Google Play Store
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            </a>

          </div>

        </div>
      </main>

      {/* Disclaimer Modal Dialog matching Screenshot 2 exactly */}
      {showDisclaimer && (
        <div 
          id="disclaimer-dialog-backdrop"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5"
          onClick={() => setShowDisclaimer(false)}
        >
          <div 
            id="disclaimer-dialog-box"
            className="w-full max-w-[360px] bg-white rounded-[24px] shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[20px] font-bold text-[#1E1B22] tracking-tight">
              Disclaimer
            </h3>

            <div className="text-[13.5px] text-[#374151] leading-relaxed space-y-3.5">
              <p>
                ChatGPT, Gemini, Claude, Grok, Perplexity, and Microsoft Copilot names, logos, and trademarks are the property of their respective owners.
              </p>
              <p>
                AI Prompt Library is an independent application created by V Astra AI Studio to help users discover and organize AI prompt collections.
              </p>
              <p>
                This application is not affiliated with, endorsed by, sponsored by, or officially associated with OpenAI, Google, Anthropic, xAI, Perplexity AI, Microsoft, or any of their affiliates.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="disclaimer-ok-btn"
                onClick={() => setShowDisclaimer(false)}
                className="text-[15px] font-bold text-[#654A9E] hover:text-[#523A82] active:text-[#432F6E] px-4 py-2 rounded-xl hover:bg-[#F3EDF7] transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Dialog */}
      {showDeleteConfirm && (
        <div 
          id="delete-account-backdrop"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            id="delete-account-dialog"
            className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-bold text-rose-600 tracking-tight">
              Delete Account?
            </h3>

            <p className="text-[14px] text-[#4B5563] leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="text-[13px] font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingAccount ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
