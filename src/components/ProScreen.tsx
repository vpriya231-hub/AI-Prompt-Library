import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, AlertCircle, LogOut, RotateCcw } from 'lucide-react';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

interface ProScreenProps {
  onBack: () => void;
  hasUnlockedPro: boolean;
  onProStatusChange?: (isPro: boolean) => void;
  showToast?: (message: string) => void;
}

const UNLOCK_ITEMS = [
  { emoji: '✨', label: 'Business Startup' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '📈', label: 'Marketing' },
  { emoji: '🎨', label: 'Design' },
  { emoji: '📝', label: 'Writing' },
  { emoji: '🤖', label: 'AI Agents' },
  { emoji: '📚', label: 'Research' },
  { emoji: '🎬', label: 'YouTube' },
  { emoji: '☁️', label: 'DevOps & Cloud' },
  { emoji: '🛡️', label: 'Cybersecurity & Ethical Hacking' },
  { emoji: '🗄️', label: 'SQL & Database Optimization' },
  { emoji: '🔌', label: 'API Development & Integration' },
  { emoji: '📄', label: 'Resume & Cover Letter Building' },
  { emoji: '🎯', label: 'Job Interview Preparation & Mock Interviews' },
  { emoji: '⏱️', label: 'Time Management & Productivity Systems' },
  { emoji: '📝', label: 'Meeting Summaries & Action Items' },
];

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.aipromptlibrary.app';

export function ProScreen({ onBack, hasUnlockedPro, onProStatusChange, showToast }: ProScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isProUser, setIsProUser] = useState(hasUnlockedPro);
  const [authError, setAuthError] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string } | null>(null);

  const triggerToast = (msg: string) => {
    setLocalToast(msg);
    if (showToast) showToast(msg);
    setTimeout(() => setLocalToast(null), 3500);
  };

  const handleOpenPlayStore = () => {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleRestorePurchase = async () => {
    setRestoring(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        // If the user is NOT signed in: Trigger Google Sign-in popup first
        const result = await signInWithPopup(auth, googleProvider);
        currentUser = result.user;
        setUser(currentUser);
      }

      // Show a brief loading spinner / toast
      triggerToast('Checking active purchase status...');

      // Re-query Firestore users/{uid} to fetch latest isPro field
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const data = userDoc.exists() ? userDoc.data() : null;
      const isPro = Boolean(data?.isPro === true || data?.pro === true);

      if (isPro) {
        setIsProUser(true);
        if (onProStatusChange) onProStatusChange(true);
        triggerToast('✓ PRO restored successfully! Lifetime access active.');
      } else {
        const email = currentUser.email || 'your account';
        setNoticeModal({
          title: 'No Active PRO License Found',
          message: `No active PRO license found for ${email}. Make sure you are signed in with the exact Google account used on Google Play Store.`
        });
        triggerToast(`No active PRO license found for ${email}.`);
      }
    } catch (err: unknown) {
      console.error('Restore purchase failed:', err);
      const error = err as { code?: string; message?: string };
      if (error?.code !== 'auth/popup-closed-by-user') {
        triggerToast(error?.message || 'Failed to restore purchase.');
      }
    } finally {
      setRestoring(false);
    }
  };

  // Monitor auth state changes and sync PRO status from Firestore (strictly read-only)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Strictly read-only Firestore query on users/{uid}
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const data = userDoc.exists() ? userDoc.data() : null;
          const proActive = Boolean(data?.isPro === true || data?.pro === true);
          setIsProUser(proActive);
          if (onProStatusChange) onProStatusChange(proActive);
        } catch (err) {
          console.warn('Error reading PRO status from Firestore:', err);
          setIsProUser(hasUnlockedPro);
        }
      } else {
        setIsProUser(false);
        if (onProStatusChange) onProStatusChange(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hasUnlockedPro, onProStatusChange]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      setUser(signedInUser);

      // Strictly read-only check upon login
      try {
        const userDoc = await getDoc(doc(db, "users", signedInUser.uid));
        const data = userDoc.exists() ? userDoc.data() : null;
        const proActive = Boolean(data?.isPro === true || data?.pro === true);
        setIsProUser(proActive);
        if (onProStatusChange) onProStatusChange(proActive);
      } catch (err) {
        console.warn('Error reading PRO status from Firestore:', err);
      }
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const error = err as { code?: string; message?: string };
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError(error?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsProUser(false);
      if (onProStatusChange) onProStatusChange(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4FA] text-[#1E1B22] font-sans antialiased flex flex-col">
      
      {/* Top Bar matching screenshot */}
      <header className="w-full bg-[#F3EDF7] py-3.5 px-4 border-b border-[#E8DEF2] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <button 
            id="pro-back-btn"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-[#E5DCEF] active:bg-[#D7CBDE] text-[#1E1B22] transition-colors cursor-pointer flex items-center justify-center"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-[#1E1B22] stroke-[2.4]" />
          </button>

          <h1 className="text-[17px] font-semibold text-[#1E1B22] tracking-tight">
            AI Prompt Library PRO
          </h1>

          <div className="w-8 flex justify-end" aria-hidden="true">
            {user && (
              <button
                onClick={handleSignOut}
                className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-[#E5DCEF] transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 md:px-8 py-6 space-y-6 pb-36">
          
          {/* Hero Section */}
          <section className="space-y-1">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#1E1B22] tracking-tight flex items-center gap-2.5">
              <span className="text-[28px]">💎</span>
              <span>AI Prompt Library PRO</span>
            </h2>
            <p className="text-[15px] text-[#4B5563] font-normal leading-snug">
              Unlock the complete AI Prompt Library experience.
            </p>
          </section>

          {/* User Sign-In Banner if logged in */}
          {user && (
            <div className="bg-[#EFE8F6] border border-[#E0D3EC] rounded-2xl p-3 px-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-purple-200 object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#654A9E] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <p className="font-semibold text-[#1E1B22] text-xs truncate">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              {isProUser ? (
                <span className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" /> PRO
                </span>
              ) : (
                <span className="text-[11px] text-[#654A9E] font-medium flex-shrink-0">
                  Free Account
                </span>
              )}
            </div>
          )}

          {authError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Price Card matching exact screenshot (soft lavender rounded-2xl card) */}
          <section className="bg-[#EFE8F6] rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xs border border-[#E6DBEE]">
            <div>
              <h3 className="text-[22px] font-bold text-[#1E1B22] tracking-tight">
                Lifetime Access
              </h3>
              <p className="text-[14px] text-[#4B5563] font-normal mt-0.5">
                Pay once. Unlock forever.
              </p>
            </div>

            <div className="pt-2">
              <div className="text-[44px] sm:text-[48px] font-extrabold text-[#1E1B22] leading-none tracking-tight">
                ₹599
              </div>
              <p className="text-[14px] text-[#4B5563] font-normal mt-1.5">
                One-time payment
              </p>
            </div>
          </section>

          {/* "What you'll unlock" Checklist matching screenshot */}
          <section className="space-y-3 pt-1">
            <h3 className="text-[20px] font-bold text-[#1E1B22] tracking-tight">
              What you&apos;ll unlock
            </h3>

            <div className="space-y-2.5 text-[15px] text-[#1E1B22] font-normal">
              {UNLOCK_ITEMS.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="text-[17px] w-5 select-none flex justify-center flex-shrink-0">
                    {item.emoji}
                  </span>
                  <span className="text-[#1E1B22] font-normal leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
              
              <div className="pt-1 text-[#6B7280] font-normal text-[14px]">
                + More collections coming soon...
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Fixed Bottom Action Panel matching Screenshots */}
      <footer className="w-full bg-[#F7F4FA] border-t border-[#E8DEF2] px-4 md:px-8 py-4 pb-6 space-y-3 sticky bottom-0 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto w-full space-y-2.5">
          
          {isProUser ? (
            /* Active PRO Users: non-clickable verified status badge */
            <div className="space-y-2">
              <div 
                id="pro-screen-active-badge"
                className="w-full bg-[#5B4296] text-white font-bold text-[15px] py-4 rounded-full flex items-center justify-center gap-2 shadow-sm select-none cursor-default"
              >
                <Check className="w-5 h-5 stroke-[3] text-emerald-300" />
                <span>✓ PRO Lifetime Active</span>
              </div>
              <button
                id="return-to-library-btn"
                onClick={onBack}
                className="w-full bg-[#EAE3F2] hover:bg-[#E0D7E8] text-[#1E1B22] font-semibold text-[14px] py-3 rounded-full transition-colors cursor-pointer"
              >
                Return to Library
              </button>
            </div>
          ) : (
            /* Free / Non-PRO Users: Redirect to Play Store */
            <div className="space-y-3">
              <button
                id="pro-screen-purchase-btn"
                onClick={handleOpenPlayStore}
                className="w-full bg-[#654A9E] hover:bg-[#573F89] active:bg-[#4B3676] text-white font-bold text-[15px] py-4 px-6 rounded-full shadow-sm transition-all transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                Unlock PRO on Google Play • ₹599
              </button>

              <p className="text-[12px] text-center text-[#6B7280] leading-relaxed">
                PRO purchases are managed securely via Google Play. Once upgraded in the Android app, sign in here with the same Google account to instantly unlock PRO on Web &amp; Windows.
              </p>

              {/* Restore Purchase secondary action */}
              <div className="pt-2 border-t border-[#E8DEF2] space-y-2 text-center">
                <button
                  id="pro-restore-purchase-btn"
                  onClick={handleRestorePurchase}
                  disabled={restoring}
                  className="w-full bg-[#EFE8F6] hover:bg-[#E7DDF0] active:bg-[#DFD3EA] text-[#5B4296] font-bold text-[14.5px] py-3.5 px-5 rounded-full border border-[#DFD1EC] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 shadow-2xs"
                >
                  {restoring ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#5B4296] border-t-transparent rounded-full animate-spin" />
                      <span>Checking active purchase status...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Restore Purchase</span>
                    </>
                  )}
                </button>
                <p className="text-[12px] text-[#6B7280] leading-snug px-2">
                  Already bought PRO on Google Play? Sign in with your purchasing Google account to restore.
                </p>

                {user && (
                  <div className="flex items-center justify-between text-[11.5px] text-[#6B7280] px-1 pt-1">
                    <span className="truncate max-w-[200px] sm:max-w-xs">
                      Signed in as <strong className="text-[#1E1B22]">{user.email}</strong>
                    </span>
                    <button
                      id="pro-sign-out-btn"
                      onClick={handleSignOut}
                      className="text-[#843A4B] hover:underline cursor-pointer flex-shrink-0 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer note matching screenshot */}
          <p className="text-[12px] text-center text-[#6B7280] font-normal pt-0.5">
            Secure purchase powered by Google Play
          </p>
        </div>
      </footer>

      {/* Restore Notice Modal */}
      {noticeModal && (
        <div 
          id="restore-notice-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setNoticeModal(null)}
        >
          <div 
            id="restore-notice-dialog"
            className="w-full max-w-sm bg-[#F7F4FA] rounded-[24px] border border-[#E5DCED] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFE8F6] flex items-center justify-center text-xl flex-shrink-0">
                🔍
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1E1B22] leading-tight">
                  {noticeModal.title}
                </h3>
                <p className="text-[12px] text-[#6B7280]">
                  Google Play License Check
                </p>
              </div>
            </div>

            <p className="text-[13.5px] text-[#4B5563] leading-relaxed">
              {noticeModal.message}
            </p>

            <div className="bg-[#EFE8F6] p-3.5 rounded-2xl text-xs text-[#5B4296] font-medium leading-relaxed border border-[#E3D4EE]">
              💡 <strong>Tip:</strong> If you recently upgraded in the Google Play Android app, please verify that you are signed in here with that same Google account.
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  setNoticeModal(null);
                  try {
                    await signOut(auth);
                    setUser(null);
                    handleRestorePurchase();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full bg-[#654A9E] hover:bg-[#573F89] text-white font-bold text-[13.5px] py-3 rounded-full cursor-pointer transition-all shadow-2xs"
              >
                Sign in with Another Account
              </button>
              <button
                onClick={() => setNoticeModal(null)}
                className="w-full bg-white hover:bg-gray-50 text-[#4B5563] border border-[#D5C6E3] font-semibold text-[13px] py-2.5 rounded-full cursor-pointer transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local Screen Toast */}
      {localToast && (
        <div 
          id="pro-screen-toast"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#2D2438] text-white text-[13px] font-medium py-3 px-5 rounded-full shadow-xl border border-[#483B59] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none max-w-[90vw] text-center"
        >
          <span>{localToast}</span>
        </div>
      )}

    </div>
  );
}
