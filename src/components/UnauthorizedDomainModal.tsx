import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldAlert, X } from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsPreview?: () => void;
}

export function UnauthorizedDomainModal({
  isOpen,
  onClose,
  onContinueAsPreview
}: UnauthorizedDomainModalProps) {
  const [copied, setCopied] = useState(false);
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your-app-domain';
  const firebaseConsoleUrl = 'https://console.firebase.google.com/project/ai-prompt-library-1bfcd/authentication/settings';

  if (!isOpen) return null;

  const handleCopyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="unauth-domain-title"
        className="bg-[#FBF9FD] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E4D7EE] relative space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 id="unauth-domain-title" className="text-[17px] font-bold text-[#1E1B22] leading-tight">
              Authorized Domain Required
            </h3>
            <p className="text-[12.5px] text-[#6B7280]">
              Firebase Authentication setup
            </p>
          </div>
        </div>

        <p className="text-[13.5px] text-[#4B5563] leading-relaxed">
          Firebase blocked this Google Sign-In attempt because the current preview domain is not yet listed in your Firebase project&apos;s <strong>Authorized domains</strong>.
        </p>

        {/* Domain Box with Copy Button */}
        <div className="bg-white rounded-2xl p-3 border border-[#D5C6E3] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-medium">
            <span>Domain to authorize:</span>
            {copied && <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[#F5EFFB] text-[#5B4296] text-[12.5px] font-mono p-2 rounded-xl break-all select-all font-semibold">
              {currentDomain}
            </code>
            <button
              onClick={handleCopyDomain}
              className="px-3 py-2 bg-[#654A9E] hover:bg-[#573F89] active:bg-[#4B3676] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 3-Step Guide */}
        <div className="bg-[#EFE8F6] rounded-2xl p-3.5 border border-[#E2D5EC] space-y-2 text-[12.5px] text-[#4B5563]">
          <p className="font-bold text-[#1E1B22] text-[13px]">How to add in 30 seconds:</p>
          <ol className="list-decimal pl-4 space-y-1 text-[#4B5563]">
            <li>Open Firebase Console &gt; <strong>Authentication</strong> &gt; <strong>Settings</strong> tab.</li>
            <li>Scroll down to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
            <li>Paste <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px] text-[#5B4296] font-semibold">{currentDomain}</code> and save.</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={firebaseConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#654A9E] hover:bg-[#573F89] active:bg-[#4B3676] text-white font-bold text-[13.5px] py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>Open Firebase Settings</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {onContinueAsPreview && (
            <button
              onClick={onContinueAsPreview}
              className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-[#5B4296] font-bold text-[13.5px] py-2.5 px-4 rounded-full border border-[#D5C6E3] transition-colors shadow-2xs"
            >
              Continue with Preview Account (Testing Mode)
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800 py-1.5 transition-colors text-center"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
