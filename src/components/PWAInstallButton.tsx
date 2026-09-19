import React, { useState } from 'react';
import { Download, Check, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'menu' }> = ({ variant = 'menu' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide or show installed badge
  if (isInstalled) {
    if (variant === 'header') return null;
    return (
      <div 
        id="pwa-installed-row"
        className="bg-[#EFE8F6] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between text-inherit"
      >
        <div className="flex items-center gap-3.5">
          <span className="text-[24px] select-none flex-shrink-0 leading-none">
            ✨
          </span>
          <div>
            <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight flex items-center gap-1.5">
              <span>App Installed</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
              </span>
            </h4>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Running as standalone PWA
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (variant === 'header') {
    if (!isInstallable && !isIOS) return null;
    return (
      <>
        <button
          id="pwa-header-install-btn"
          onClick={handleAction}
          className="flex items-center gap-1.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
          title="Install App on Device"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowIOSGuide(false)}
          >
            <div 
              className="w-full max-w-sm rounded-3xl bg-[#F7F4FA] p-6 shadow-2xl border border-[#E5DCED]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EADDF0]">
                <h3 className="text-base font-bold text-[#1E1B22] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#6D28D9]" />
                  <span>Install on iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-[#EAE3F2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-4 text-sm text-[#4B5563] leading-relaxed">
                1. Tap the <strong className="text-[#1E1B22]">Share</strong> icon in the Safari toolbar.<br />
                2. Scroll down and choose <strong className="text-[#1E1B22]">Add to Home Screen</strong>.<br />
                3. Tap <strong className="text-[#1E1B22]">Add</strong> to complete installation.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-[#6D28D9] text-white py-2.5 text-sm font-bold shadow-xs hover:bg-[#5B21B6] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Menu item in Settings
  return (
    <>
      <div 
        id="menu-install-app"
        onClick={handleAction}
        className="bg-[#EFE8F6] hover:bg-[#EAE2F2] active:bg-[#E3D9EC] rounded-[22px] p-4 border border-[#E6DBEE] flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs"
      >
        <div className="flex items-center gap-3.5">
          <span className="text-[24px] select-none flex-shrink-0 leading-none">
            📥
          </span>
          <div>
            <h4 className="text-[15px] font-bold text-[#1E1B22] leading-tight flex items-center gap-2">
              <span>Install Web App</span>
              <span className="bg-[#6D28D9]/10 text-[#6D28D9] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#6D28D9]/20">
                PWA
              </span>
            </h4>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Add to Home Screen or Desktop for fast offline access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#6D28D9]">
          <Download className="w-4 h-4" />
        </div>
      </div>

      {showIOSGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-[#F7F4FA] p-6 shadow-2xl border border-[#E5DCED]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EADDF0]">
              <h3 className="text-base font-bold text-[#1E1B22] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#6D28D9]" />
                <span>Install on iPhone / iPad</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-[#EAE3F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-4 text-sm text-[#4B5563] leading-relaxed">
              1. Tap the <strong className="text-[#1E1B22]">Share</strong> icon in the Safari toolbar.<br />
              2. Scroll down and tap <strong className="text-[#1E1B22]">Add to Home Screen</strong>.<br />
              3. Tap <strong className="text-[#1E1B22]">Add</strong> to install.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-2xl bg-[#6D28D9] text-white py-2.5 text-sm font-bold shadow-xs hover:bg-[#5B21B6] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
