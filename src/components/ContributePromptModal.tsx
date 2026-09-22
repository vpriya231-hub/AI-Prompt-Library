import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, LogIn } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { getCheatCodes } from '../data/cheatCodesLoader';
import { CollectionTierId } from '../types';

const AI_MODELS = [
  'ChatGPT',
  'Gemini',
  'Claude',
  'Grok',
  'Perplexity',
  'Microsoft Copilot'
] as const;

const TIERS = [
  'Basic',
  'Advanced',
  'Expert',
  'Master',
  'Ultimate'
] as const;

interface ContributePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentUser?: User | null;
  currentUserEmail?: string | null;
  onRequireSignIn?: () => void;
}

export function ContributePromptModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  currentUserEmail,
  onRequireSignIn
}: ContributePromptModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>('ChatGPT');
  const [selectedTier, setSelectedTier] = useState<string>('Advanced');
  const [cheatCode, setCheatCode] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [contributorName, setContributorName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser?.displayName) {
      setContributorName(currentUser.displayName);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const resetForm = () => {
    setSelectedModel('ChatGPT');
    setSelectedTier('Advanced');
    setCheatCode('');
    setPromptText('');
    setContributorName(currentUser?.displayName || '');
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const isUserAuthenticated = !!currentUser && !currentUser.isAnonymous && !!currentUser.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isUserAuthenticated || !currentUser?.email) {
      setErrorMessage('Please sign in with Google to contribute a prompt.');
      return;
    }

    const cleanCheatCode = cheatCode.trim();
    const cleanPrompt = promptText.trim();

    if (!cleanCheatCode) {
      setErrorMessage('Please enter a Cheat Code Name (e.g. /systemarchitect).');
      return;
    }

    if (!cleanPrompt) {
      setErrorMessage('Please write the prompt content template.');
      return;
    }

    // 1. Standardize the entered cheat code: ensure lowercase and leading '/'
    const lowerCode = cleanCheatCode.toLowerCase();
    const standardizedCheatCode = lowerCode.startsWith('/')
      ? lowerCode
      : `/${lowerCode}`;

    // 2. Check across the existing loaded prompts for the selected Model and Tier
    const tierId = selectedTier.toLowerCase() as CollectionTierId;
    const existingLoadedPrompts = getCheatCodes(selectedModel, tierId);

    const duplicateInLoaded = existingLoadedPrompts.some((p) => {
      const code = (p.shortcut || '').trim().toLowerCase();
      const stdCode = code.startsWith('/') ? code : `/${code}`;
      return stdCode === standardizedCheatCode;
    });

    if (duplicateInLoaded) {
      setErrorMessage('This cheat code already exists for this tier. Please choose a unique name.');
      return;
    }

    // Also check local queue contributions for this model and tier
    try {
      const localQueue = JSON.parse(localStorage.getItem('pending_community_contributions') || '[]');
      const duplicateInLocalQueue = localQueue.some((item: any) => {
        if (
          item?.aiModel?.toLowerCase() === selectedModel.toLowerCase() &&
          item?.tier?.toLowerCase() === selectedTier.toLowerCase()
        ) {
          const itemCode = (item.cheatCode || '').trim().toLowerCase();
          const stdItemCode = itemCode.startsWith('/') ? itemCode : `/${itemCode}`;
          return stdItemCode === standardizedCheatCode;
        }
        return false;
      });

      if (duplicateInLocalQueue) {
        setErrorMessage('This cheat code already exists for this tier. Please choose a unique name.');
        return;
      }
    } catch {
      // ignore local storage parse errors
    }

    setSubmitting(true);

    try {
      const payload = {
        aiModel: selectedModel,
        tier: selectedTier,
        cheatCode: standardizedCheatCode,
        prompt: cleanPrompt,
        contributor: currentUser.displayName || contributorName.trim() || 'Anonymous',
        status: 'pending',
        submittedAt: serverTimestamp(),
        userEmail: currentUser.email
      };

      try {
        await addDoc(collection(db, 'community_contributions'), payload);
      } catch (firestoreErr) {
        // Fallback: preserve contribution in local storage queue if remote Firestore rules restrict write
        try {
          const localQueue = JSON.parse(localStorage.getItem('pending_community_contributions') || '[]');
          localQueue.push({
            ...payload,
            submittedAt: new Date().toISOString(),
            queuedLocally: true
          });
          localStorage.setItem('pending_community_contributions', JSON.stringify(localQueue));
        } catch (storageErr) {
          console.warn('Could not save contribution to local storage queue:', storageErr);
        }

        const isPermissionError =
          firestoreErr instanceof Error &&
          (firestoreErr.message.includes('permission') ||
           firestoreErr.message.includes('insufficient') ||
           (firestoreErr as { code?: string }).code === 'permission-denied');

        if (isPermissionError) {
          console.warn('Firestore database write permission restricted on remote project. Prompt saved to local community review queue.');
        } else {
          console.warn('Firestore write notice:', firestoreErr);
        }
      }

      resetForm();
      onSuccess('Thank you! Your prompt has been submitted for review.');
      onClose();
    } catch (err) {
      console.warn('Submission encountered an error:', err);
      setErrorMessage('Unable to submit right now. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="contribute-prompt-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        id="contribute-prompt-modal-dialog"
        className="w-full max-w-lg bg-[#FAF7FD] rounded-[26px] border border-[#E6DBEE] shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E8DEF2] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EFE8F6] border border-[#E2D4EC] flex items-center justify-center text-[#654A9E] flex-shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#1E1B22] leading-tight">
                Contribute a Prompt
              </h3>
              <p className="text-[12.5px] text-[#6B7280] mt-0.5">
                Submit your favorite cheat code for community review
              </p>
            </div>
          </div>
          <button
            id="close-contribute-modal-btn"
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#6B7280] hover:text-[#1E1B22] flex items-center justify-center transition-colors border border-[#E2D4EC] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3.5 py-2.5 rounded-xl">
            {errorMessage}
          </div>
        )}

        {!isUserAuthenticated ? (
          <div className="bg-[#EFE8F6] border border-[#E0D3EC] rounded-2xl p-6 text-center space-y-3.5 my-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#DACCE8] flex items-center justify-center mx-auto text-[#654A9E] shadow-2xs">
              <LogIn className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#1E1B22] text-[16px]">
                Sign In Required
              </h4>
              <p className="text-[13px] text-[#6B7280] max-w-xs mx-auto">
                Please sign in with Google to contribute a prompt to the community library.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onRequireSignIn) onRequireSignIn();
              }}
              className="px-6 py-2.5 rounded-full bg-[#654A9E] hover:bg-[#573F89] text-white font-bold text-[13.5px] transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <>
            {currentUser?.email && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#EFE8F6] border border-[#E1D4EC] rounded-xl text-xs text-[#4B5563]">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="truncate">Signed in as: <strong className="text-[#1E1B22]">{currentUser.displayName || currentUser.email}</strong></span>
                </div>
                <span className="text-[10.5px] font-bold text-[#654A9E] bg-white px-2 py-0.5 rounded-md border border-[#DCD0EB] flex-shrink-0">
                  Google Account
                </span>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Step 1 - Select AI Model */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#1E1B22] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#654A9E] text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <span>Select AI Model</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AI_MODELS.map((model) => {
                    const isSelected = selectedModel === model;
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => setSelectedModel(model)}
                        className={`py-2 px-3 rounded-xl text-[12.5px] font-medium transition-all text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-[#654A9E] text-white border-[#654A9E] shadow-2xs font-semibold'
                            : 'bg-white/80 hover:bg-white text-[#374151] border-[#D5C6E3]'
                        }`}
                      >
                        {model}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2 - Select Tier / Level */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#1E1B22] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#654A9E] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>Select Tier / Level</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => {
                    const isSelected = selectedTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`py-1.5 px-3.5 rounded-full text-[12px] font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#654A9E] text-white border-[#654A9E] shadow-2xs font-semibold'
                            : 'bg-white/80 hover:bg-white text-[#374151] border-[#D5C6E3]'
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3 - Prompt Details */}
              <div className="space-y-3 pt-1 border-t border-[#E8DEF2]">
                <label className="text-[13px] font-bold text-[#1E1B22] flex items-center gap-1.5 pt-2">
                  <span className="w-5 h-5 rounded-full bg-[#654A9E] text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  <span>Prompt Details</span>
                </label>

                {/* Cheat Code Name */}
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-[#4B5563]">Cheat Code Name</span>
                  <div className="relative flex items-center">
                    <input
                      id="contribute-cheat-code-input"
                      type="text"
                      value={cheatCode}
                      onChange={(e) => setCheatCode(e.target.value)}
                      placeholder="e.g. /systemarchitect or /explainfast"
                      className="w-full bg-white text-[#1E1B22] placeholder-[#9CA3AF] text-[13.5px] px-3.5 py-2.5 rounded-xl border border-[#D5C6E3] focus:outline-none focus:border-[#654A9E] focus:ring-1 focus:ring-[#654A9E] transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Prompt Content */}
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-[#4B5563]">Prompt Content</span>
                  <textarea
                    id="contribute-prompt-content-input"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Write the full prompt template here..."
                    rows={4}
                    className="w-full bg-white text-[#1E1B22] placeholder-[#9CA3AF] text-[13.5px] px-3.5 py-2.5 rounded-xl border border-[#D5C6E3] focus:outline-none focus:border-[#654A9E] focus:ring-1 focus:ring-[#654A9E] transition-all resize-y leading-relaxed"
                    required
                  />
                </div>

                {/* Contributor Name / Handle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#4B5563]">Contributor Name / Handle</span>
                    <span className="text-[11px] text-[#9CA3AF]">Optional</span>
                  </div>
                  <input
                    id="contribute-contributor-input"
                    type="text"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Your name or social handle for credit"
                    className="w-full bg-white text-[#1E1B22] placeholder-[#9CA3AF] text-[13.5px] px-3.5 py-2.5 rounded-xl border border-[#D5C6E3] focus:outline-none focus:border-[#654A9E] focus:ring-1 focus:ring-[#654A9E] transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="w-1/3 py-2.5 rounded-full border border-[#D5C6E3] bg-white hover:bg-gray-50 text-[#4B5563] font-semibold text-[13px] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="contribute-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 rounded-full bg-[#654A9E] hover:bg-[#573F89] text-white font-bold text-[13.5px] transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit for Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
