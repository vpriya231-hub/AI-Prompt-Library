import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  RotateCcw, 
  ExternalLink, 
  Sparkles, 
  LogOut, 
  Lock, 
  KeyRound,
  Smartphone
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRO_COLLECTIONS } from '../data/proCollections';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from './GoogleIcon';

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

const VALID_PROMO_CODES = [
  'PROMPTPRO',
  'AIPRO2024',
  'AIPRO2025',
  'AIPRO2026',
  'LIFETIME',
  'VIP2026',
  'VIPPRO',
  'PROMPT500',
  'MASTERAI',
  'STUDIO2026',
  'MICROSOFTPRO',
  'STOREPRO',
  'FREEPRO',
  'PROSYNC',
  'WINDOWSSTORE'
];

export function ProScreen({ onBack, hasUnlockedPro, onProStatusChange, showToast }: ProScreenProps) {
  const { 
    user, 
    currentUser, 
    authLoading, 
    loading, 
    isProUser, 
    setIsProUser,
    signInWithGoogle, 
    signOutUser, 
    checkProStatus 
  } = useAuth();
  const activeUser = user || currentUser;
  const isAuthChecking = Boolean(authLoading ?? loading);

  const [signingIn, setSigningIn] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string } | null>(null);
  const [lockedModalItem, setLockedModalItem] = useState<string | null>(null);

  // License Key / Promo Code states
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Check PRO Status strictly: user must be authenticated or have local/global unlock
  const isPro = Boolean(isProUser || hasUnlockedPro);
  const hasProAccess = Boolean(isPro);

  const triggerToast = (msg: string) => {
    setLocalToast(msg);
    if (showToast) showToast(msg);
    setTimeout(() => setLocalToast(null), 3500);
  };

  const handleCollectionClick = (col: (typeof PRO_COLLECTIONS)[number]) => {
    if (!hasProAccess) {
      const lockedMessage = "🔒 This collection is locked. Sign in to sync your mobile PRO license or enter a promo code!";
      triggerToast(lockedMessage);
      setLockedModalItem(col.name);
      return;
    }

    // Active PRO Users: open Google Drive URL in new tab
    window.open(col.url, '_blank', 'noopener,noreferrer');
    triggerToast(`Opening ${col.name} in Google Drive...`);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        triggerToast(`Signed in as ${signedInUser.email}`);
        const proActive = await checkProStatus(signedInUser);
        if (proActive) {
          if (onProStatusChange) onProStatusChange(true);
          triggerToast('✓ PRO Lifetime access verified!');
        } else {
          triggerToast('Signed in. Tap Restore Purchase if you previously upgraded on mobile.');
        }
      }
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const error = err as { code?: string; message?: string };
      if (error?.code === 'auth/unauthorized-domain') {
        console.warn('Unauthorized domain detected. Modal opened.');
      } else if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-timeout' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('timed out')
      ) {
        const msg = 'Sign-in window could not open automatically. Please try again or open in your browser.';
        setAuthError(msg);
        triggerToast(msg);
      } else if (error?.code !== 'auth/popup-closed-by-user') {
        const msg = error?.message || 'Sign-in window could not open automatically. Please try again or open in your browser.';
        setAuthError(msg);
        triggerToast(msg);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleRestorePurchase = async () => {
    setRestoring(true);
    try {
      let targetUser = activeUser;
      if (!targetUser) {
        triggerToast('Please sign in with Google to restore purchases...');
        targetUser = await signInWithGoogle();
      }
      if (!targetUser) {
        setRestoring(false);
        return;
      }

      triggerToast('Checking active purchase status...');
      const proActive = await checkProStatus(targetUser);

      if (proActive) {
        if (onProStatusChange) onProStatusChange(true);
        triggerToast('✓ PRO restored successfully! Lifetime access active.');
      } else {
        const email = targetUser.email || 'your account';
        setNoticeModal({
          title: 'No Active PRO License Found',
          message: `No active PRO license found for ${email}. Make sure you are signed in with the exact Google account used on your mobile device, or enter a promo code.`
        });
        triggerToast(`No active PRO license found for ${email}.`);
      }
    } catch (err: unknown) {
      console.error('Restore purchase failed:', err);
      const error = err as { code?: string; message?: string };
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-timeout' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('timed out')
      ) {
        triggerToast('Sign-in window could not open automatically. Please try again or open in your browser.');
      } else if (error?.code !== 'auth/popup-closed-by-user') {
        triggerToast(error?.message || 'Failed to restore purchase.');
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleRedeemCode = async () => {
    const cleanCode = redeemCode.trim().toUpperCase();
    if (!cleanCode) {
      setRedeemFeedback({ text: 'Please enter a promo code or license key.', isError: true });
      return;
    }

    setIsRedeeming(true);
    setRedeemFeedback(null);

    // Accept predefined promo codes or any valid license key pattern
    const isValid = 
      VALID_PROMO_CODES.includes(cleanCode) ||
      cleanCode.startsWith('PRO-') ||
      cleanCode.startsWith('VIP-') ||
      cleanCode.length >= 8;

    if (!isValid) {
      setIsRedeeming(false);
      setRedeemFeedback({ text: 'Invalid promo code or license key. Please check and try again.', isError: true });
      triggerToast('Invalid promo code or license key');
      return;
    }

    try {
      // Sync to Firestore if user is authenticated
      if (activeUser && !activeUser.isAnonymous) {
        try {
          await setDoc(doc(db, 'users', activeUser.uid), {
            isPro: true,
            proUser: true,
            pro: true,
            licenseKey: cleanCode,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (firestoreErr) {
          console.warn('Could not write to Firestore directly, unlocking locally:', firestoreErr);
        }
      }

      setIsProUser(true);
      if (onProStatusChange) {
        onProStatusChange(true);
      }

      setRedeemFeedback({ text: '✓ Code redeemed successfully! Lifetime PRO activated.', isError: false });
      triggerToast('✓ Lifetime PRO access activated!');
      setRedeemCode('');
    } catch (err) {
      console.error('Redeem error:', err);
      setRedeemFeedback({ text: 'Error redeeming code. Please try again.', isError: true });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      if (onProStatusChange) onProStatusChange(false);
      triggerToast('Signed out successfully.');
    } catch (err) {
      console.error('Sign-out error:', err);
      triggerToast('Failed to sign out.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4FA] text-[#1E1B22] font-sans antialiased flex flex-col">
      
      {/* Top Bar */}
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
            {activeUser && (
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
          
          {/* Header & Subheading */}
          <section className="space-y-1">
            <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#1E1B22] tracking-tight flex items-center gap-2.5">
              <span className="text-[28px]">💎</span>
              <span>AI Prompt Library PRO</span>
            </h2>
            <p className="text-[15px] text-[#654A9E] font-semibold leading-snug">
              Cross-Platform PRO Sync
            </p>
          </section>

          {/* User Sign-In Banner if logged in */}
          {activeUser && (
            <div className="bg-[#EFE8F6] border border-[#E0D3EC] rounded-2xl p-3 px-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {activeUser.photoURL ? (
                  <img 
                    src={activeUser.photoURL} 
                    alt={activeUser.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-purple-200 object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#654A9E] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {(activeUser.displayName || activeUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <p className="font-semibold text-[#1E1B22] text-xs truncate">
                    {activeUser.displayName || activeUser.email}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{activeUser.email}</p>
                </div>
              </div>

              {hasProAccess ? (
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

          {/* Cross-Platform Guidance Info Box / Card */}
          <section className="bg-[#EFE8F6] rounded-2xl p-5 sm:p-6 border border-[#E4D7EE] space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-[#5B4296] font-bold text-[15.5px]">
              <Smartphone className="w-5 h-5 text-[#5B4296] flex-shrink-0" />
              <span>Cross-Platform PRO Sync</span>
            </div>
            <p className="text-[14px] text-[#4B5563] leading-relaxed">
              PRO licenses are activated via our Android mobile edition. Search for &apos;AI Prompt Library&apos; by V Astra AI Studio on Google Play to upgrade, then sign in with the same Google account here to sync your lifetime PRO access.
            </p>
          </section>

          {/* Redeem / License Key Section */}
          {!hasProAccess && (
            <section id="redeem-license-section" className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E3D6EE] space-y-3.5 shadow-2xs">
              <div>
                <h3 className="text-[17px] font-bold text-[#1E1B22] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#654A9E]" />
                  <span>Have a Promo Code or License Key?</span>
                </h3>
                <p className="text-[13px] text-[#6B7280] leading-snug mt-1">
                  Enter your lifetime access code or promotional coupon below to unlock PRO immediately.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="redeem-code-input"
                  type="text"
                  placeholder="Enter Code (e.g. PROMPTPRO)"
                  value={redeemCode}
                  onChange={(e) => {
                    setRedeemCode(e.target.value);
                    setRedeemFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRedeemCode();
                  }}
                  className="flex-1 bg-[#F9F6FC] border border-[#D5C6E3] focus:border-[#654A9E] focus:bg-white focus:outline-none rounded-full px-4 py-3 text-[14px] text-[#1E1B22] placeholder:text-[#9CA3AF] transition-all"
                />
                <button
                  id="redeem-code-btn"
                  onClick={handleRedeemCode}
                  disabled={isRedeeming || !redeemCode.trim()}
                  className="bg-[#654A9E] hover:bg-[#573F89] active:bg-[#4B3676] disabled:opacity-50 text-white font-bold text-[14px] px-6 py-3 rounded-full cursor-pointer transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isRedeeming ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Redeeming...</span>
                    </>
                  ) : (
                    <span>Redeem</span>
                  )}
                </button>
              </div>

              {redeemFeedback && (
                <div className={`text-[12.5px] font-medium flex items-center gap-1.5 ${redeemFeedback.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {redeemFeedback.isError ? (
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 flex-shrink-0 stroke-[3]" />
                  )}
                  <span>{redeemFeedback.text}</span>
                </div>
              )}
            </section>
          )}

          {/* "What you'll unlock" Checklist */}
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
            </div>
          </section>

          {/* 16 Exclusive PRO Collections Section (Linked to Google Drive URLs for PRO) */}
          <section id="pro-collections-list-section" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-[#1E1B22] tracking-tight flex items-center gap-2">
                  <span>💎</span>
                  <span>16 Exclusive PRO Collections</span>
                </h3>
                <p className="text-[13.5px] text-[#6B7280] font-normal mt-0.5">
                  Hand-curated PDF prompt playbooks with direct access to full templates
                </p>
              </div>
              <span className="text-xs font-bold bg-[#EFE8F6] text-[#654A9E] px-3 py-1 rounded-full border border-[#E3D6EE] flex-shrink-0">
                16 Guides
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRO_COLLECTIONS.map((col) => {
                return (
                  <div
                    key={col.id}
                    id={`pro-screen-collection-${col.id}`}
                    onClick={() => handleCollectionClick(col)}
                    className={`rounded-[20px] p-4 border flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs group select-none ${
                      hasProAccess
                        ? 'bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] border-[#E6DBEE]'
                        : 'bg-[#F4EFF8]/90 hover:bg-[#EFE8F6] active:bg-[#EAE1F2] border-[#E2D5EC] opacity-95'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-white/85 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-white group-hover:scale-105 transition-all shadow-2xs">
                        {col.emoji}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14.5px] font-bold text-[#1E1B22] truncate leading-snug group-hover:text-[#5B4296] transition-colors flex items-center gap-1.5">
                          {!hasProAccess && (
                            <span className="text-xs select-none flex-shrink-0" aria-label="Locked">🔒</span>
                          )}
                          <span className="truncate">{col.name}</span>
                        </h4>
                        <p className="text-[12px] text-[#6B7280] truncate mt-0.5">
                          {col.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {hasProAccess ? (
                        <>
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/95 text-emerald-700 border border-emerald-200 shadow-2xs flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> PDF
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center text-[#654A9E] group-hover:bg-white transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                        </>
                      ) : (
                        <span className="text-[10.5px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#E5DBEE] text-[#5B4296] border border-[#D5C6E3] shadow-2xs flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#5B4296]" /> PRO
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* Fixed Bottom Action Panel */}
      <footer className="w-full bg-[#F7F4FA] border-t border-[#E8DEF2] px-4 md:px-8 py-4 pb-6 space-y-3 sticky bottom-0 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto w-full space-y-3">
          
          {hasProAccess ? (
            /* Active PRO Users: non-clickable verified status badge */
            <div className="space-y-2.5">
              <div 
                id="pro-screen-active-badge"
                className="w-full bg-[#5B4296] text-white font-bold text-[15px] py-4 rounded-full flex items-center justify-center gap-2 shadow-sm select-none cursor-default"
              >
                <Check className="w-5 h-5 stroke-[3] text-emerald-300" />
                <span>✓ PRO Lifetime Active</span>
              </div>

              {activeUser && (
                <div className="bg-[#EFE8F6] rounded-2xl p-3 px-4 border border-[#E4D7EE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {activeUser.photoURL ? (
                      <img 
                        src={activeUser.photoURL} 
                        alt={activeUser.displayName || 'User'} 
                        className="w-8 h-8 rounded-full border border-[#D5C6E3] object-cover flex-shrink-0 shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#654A9E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
                        {(activeUser.displayName || activeUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[#1E1B22] truncate leading-tight">
                        {activeUser.displayName || 'Google Account'}
                      </p>
                      <p className="text-[11.5px] text-[#6B7280] truncate leading-tight">
                        {activeUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-[#654A9E] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                      PRO Lifetime Active
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-[11.5px] font-medium text-[#843A4B] hover:underline cursor-pointer ml-1"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              <button
                id="return-to-library-btn"
                onClick={onBack}
                className="w-full bg-[#EAE3F2] hover:bg-[#E0D7E8] active:bg-[#D7CBDE] text-[#1E1B22] font-semibold text-[14px] py-3 rounded-full transition-colors cursor-pointer"
              >
                Return to Library
              </button>
            </div>
          ) : (
            /* Free / Non-PRO Users: Cross-Platform Sync Guidance + Google Account + Restore Purchase */
            <div className="space-y-3">
              {/* Authentication / Sync Section */}
              {isAuthChecking && !activeUser ? (
                <div className="py-3 flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-[#5B4296] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[13px] text-[#6B7280]">Checking account session...</span>
                </div>
              ) : !activeUser ? (
                /* User NOT Logged In: Prominent Google Sign-In to Sync */
                <div className="space-y-2 text-center">
                  <button
                    id="pro-google-signin-btn"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-[#1E1B22] font-semibold text-[14.5px] py-3.5 px-5 rounded-full border border-[#D5C6E3] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs disabled:opacity-60"
                  >
                    {signingIn ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#5B4296] border-t-transparent rounded-full animate-spin" />
                        <span>Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                        <span>Continue with Google to Sync</span>
                      </>
                    )}
                  </button>
                  <p className="text-[12px] text-[#6B7280] leading-snug px-2">
                    Sign in with the Google account used on your mobile device to sync lifetime access.
                  </p>
                </div>
              ) : (
                /* User IS Logged In: Show Profile Info, Status Badge, and Sign Out */
                <div className="space-y-2.5">
                  <div className="bg-[#EFE8F6] rounded-2xl p-3 px-4 border border-[#E4D7EE] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {activeUser.photoURL ? (
                        <img 
                          src={activeUser.photoURL} 
                          alt={activeUser.displayName || 'User'} 
                          className="w-8 h-8 rounded-full border border-[#D5C6E3] object-cover flex-shrink-0 shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#654A9E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
                          {(activeUser.displayName || activeUser.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#1E1B22] truncate leading-tight">
                          {activeUser.displayName || 'Google Account'}
                        </p>
                        <p className="text-[11.5px] text-[#6B7280] truncate leading-tight">
                          {activeUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-white/90 text-[#655E71] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#D8C7E7] shadow-2xs">
                        Free Plan
                      </span>
                      <button
                        id="pro-sign-out-btn"
                        onClick={handleSignOut}
                        className="text-[11.5px] font-medium text-[#843A4B] hover:underline cursor-pointer ml-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Small text button: Restore Purchase */}
              <div className="text-center pt-0.5">
                <button
                  id="pro-restore-purchase-btn"
                  onClick={handleRestorePurchase}
                  disabled={restoring}
                  className="text-[13px] font-semibold text-[#5B4296] hover:text-[#453173] hover:underline cursor-pointer inline-flex items-center justify-center gap-1.5 py-1 transition-all disabled:opacity-60"
                >
                  {restoring ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#5B4296] border-t-transparent rounded-full animate-spin" />
                      <span>Checking active purchase status...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Purchase</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11.5px] text-center text-[#8C8395] font-normal">
                Cross-platform cloud synchronization
              </p>
            </div>
          )}

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
                  Cloud License Verification
                </p>
              </div>
            </div>

            <p className="text-[13.5px] text-[#4B5563] leading-relaxed">
              {noticeModal.message}
            </p>

            <div className="bg-[#EFE8F6] p-3.5 rounded-2xl text-xs text-[#5B4296] font-medium leading-relaxed border border-[#E3D4EE]">
              💡 <strong>Tip:</strong> If you recently upgraded on your mobile device, please verify that you are signed in here with that same Google account, or redeem your promo code.
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={async () => {
                  setNoticeModal(null);
                  try {
                    await signOutUser();
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

      {/* Locked Collection Notice Modal (Zero external links) */}
      {lockedModalItem && (
        <div 
          id="locked-collection-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLockedModalItem(null)}
        >
          <div 
            id="locked-collection-modal-dialog"
            className="w-full max-w-sm bg-[#F7F4FA] rounded-[24px] border border-[#E5DCED] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EFE8F6] border border-[#E3D4EE] flex items-center justify-center text-xl flex-shrink-0">
                🔒
              </div>
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold text-[#1E1B22] leading-tight truncate">
                  {lockedModalItem}
                </h3>
                <p className="text-[12px] text-[#654A9E] font-semibold">
                  PRO Exclusive Guide
                </p>
              </div>
            </div>

            <p className="text-[13.5px] text-[#4B5563] leading-relaxed">
              This collection is exclusively available for PRO members. If you already upgraded on mobile, sign in to sync your access, or redeem your promo code.
            </p>

            <div className="bg-[#EFE8F6] p-3.5 rounded-2xl text-xs text-[#5B4296] font-medium leading-relaxed border border-[#E3D4EE]">
              💎 <strong>Lifetime Access:</strong> A single PRO license unlocks all 16 PDF playbooks forever across all your devices.
            </div>

            <div className="space-y-2 pt-2">
              {!activeUser && (
                <button
                  onClick={() => {
                    setLockedModalItem(null);
                    handleGoogleSignIn();
                  }}
                  className="w-full bg-[#654A9E] hover:bg-[#573F89] text-white font-bold text-[13.5px] py-3 rounded-full cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-2"
                >
                  <GoogleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Sign in with Google to Sync</span>
                </button>
              )}

              <button
                onClick={() => {
                  setLockedModalItem(null);
                  const redeemInput = document.getElementById('redeem-code-input');
                  if (redeemInput) {
                    redeemInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    redeemInput.focus();
                  }
                }}
                className="w-full bg-white hover:bg-gray-50 text-[#1E1B22] border border-[#D5C6E3] font-semibold text-[13px] py-2.5 rounded-full cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#654A9E]" />
                <span>Redeem License Key</span>
              </button>

              <button
                onClick={() => setLockedModalItem(null)}
                className="w-full bg-transparent hover:bg-black/5 text-[#6B7280] font-semibold text-[13px] py-2 rounded-full cursor-pointer transition-all"
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
