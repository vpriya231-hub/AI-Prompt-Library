import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, AlertCircle, LogOut } from 'lucide-react';
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

export function ProScreen({ onBack, hasUnlockedPro, onProStatusChange }: ProScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [isProUser, setIsProUser] = useState(hasUnlockedPro);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleOpenPlayStore = () => {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
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

              {!user ? (
                <div className="pt-1 border-t border-[#E8DEF2]">
                  <button
                    id="pro-google-signin-btn"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full bg-white hover:bg-[#F3EDF8] text-[#654A9E] border border-[#D5C6E3] font-semibold text-[14px] py-3 px-5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 shadow-2xs"
                  >
                    {signingIn ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#654A9E] border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      'Already upgraded? Sign in with Google to sync'
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[12px] text-[#6B7280] pt-1">
                  <span>Signed in as <strong className="text-[#1E1B22]">{user.email}</strong></span>
                  <button
                    id="pro-refresh-status-btn"
                    onClick={async () => {
                      try {
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        const data = userDoc.exists() ? userDoc.data() : null;
                        const proActive = Boolean(data?.isPro === true || data?.pro === true);
                        if (proActive) {
                          setIsProUser(true);
                          if (onProStatusChange) onProStatusChange(true);
                        } else {
                          setAuthError('PRO status not yet found. If you recently purchased on Android, please allow a few moments for Google Play to sync.');
                        }
                      } catch (err) {
                        console.warn(err);
                      }
                    }}
                    className="text-[#654A9E] font-semibold hover:underline cursor-pointer"
                  >
                    Sync Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer note matching screenshot */}
          <p className="text-[12px] text-center text-[#6B7280] font-normal pt-0.5">
            Secure purchase powered by Google Play
          </p>
        </div>
      </footer>

    </div>
  );
}
