import { useEffect } from 'react';
import { useAuth, checkIsPro } from '../context/AuthContext';

interface MonetagVignetteConfig {
  src: string;
  zoneId: string;
  elementId: string;
}

const VIGNETTE_CONFIG: MonetagVignetteConfig = {
  src: 'https://n6wxm.com/vignette.min.js',
  zoneId: '11844078',
  elementId: 'monetag-vignette-script',
};

// Legacy In-Page Push identifiers to purge completely
const LEGACY_IN_PAGE_PUSH_SELECTORS = [
  '#monetag-inpage-push-script',
  'script[data-zone="11844075"]',
  'script[src*="nap5k.com"]',
  'script[src*="tag.min.js"]',
  '[data-zone="11844075"]',
  'iframe[src*="nap5k.com"]',
  '[id*="inpage"]',
  '[class*="inpage"]',
  '[id*="socialbar"]',
  '[class*="socialbar"]',
  '[id*="push-box"]',
  '[class*="push-box"]',
  '[id*="p-dialog"]',
  '[class*="p-dialog"]',
];

/**
 * Purges any leftover or active In-Page Push scripts, tags, or DOM elements.
 */
export function cleanupLegacyInPagePush(): void {
  if (typeof document === 'undefined') return;

  LEGACY_IN_PAGE_PUSH_SELECTORS.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((el) => {
        el.remove();
      });
    } catch {
      // ignore
    }
  });

  // Purge any floating fake-system dialogs / jackpot popups from DOM
  try {
    const dialogCandidates = document.querySelectorAll('div, dialog, section');
    dialogCandidates.forEach((el) => {
      const text = el.textContent?.toLowerCase() || '';
      if (
        (text.includes('jackpot') || text.includes("today's jackpot") || text.includes('you could win')) &&
        el instanceof HTMLElement
      ) {
        const pos = window.getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'absolute') {
          el.remove();
        }
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Removes all Monetag ad scripts and related injected DOM elements.
 * Guarantees a 100% clean, ad-free experience for PRO users.
 */
export function removeMonetagAds(): void {
  if (typeof document === 'undefined') return;

  // 1. Purge legacy In-Page Push elements & popup dialogs
  cleanupLegacyInPagePush();

  // 2. Remove Vignette and Monetag script tags
  const scriptSelectors = [
    `#${VIGNETTE_CONFIG.elementId}`,
    `script[data-zone="${VIGNETTE_CONFIG.zoneId}"]`,
    'script[src*="n6wxm.com"]',
    'script[src*="nap5k.com"]',
    'script[src*="monetag"]',
    'script[src*="vignette.min.js"]',
    'script[src*="tag.min.js"]',
  ];

  scriptSelectors.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((el) => {
        el.remove();
      });
    } catch {
      // ignore
    }
  });

  // 3. Remove any active vignette overlays, iframes, or ad containers
  const adElementSelectors = [
    `[data-zone="${VIGNETTE_CONFIG.zoneId}"]:not(script)`,
    '[id*="monetag"]',
    '[class*="monetag"]',
    'iframe[src*="n6wxm.com"]',
    'iframe[src*="nap5k.com"]',
    'iframe[src*="monetag"]',
    'div[id^="zone-"]',
  ];

  adElementSelectors.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((el) => {
        el.remove();
      });
    } catch {
      // ignore
    }
  });

  // 4. Clear Monetag globals from window
  try {
    delete (window as unknown as Record<string, unknown>)._monetag;
    delete (window as unknown as Record<string, unknown>).monetag;
    delete (window as unknown as Record<string, unknown>)._mOnEtAg;
    delete (window as unknown as Record<string, unknown>).__monetag;
  } catch {
    // ignore
  }
}

/**
 * Injects the Monetag Vignette script if not already present.
 */
function injectVignetteScript(): void {
  if (typeof document === 'undefined') return;

  // Check if script is already injected
  const exists =
    document.getElementById(VIGNETTE_CONFIG.elementId) ||
    document.querySelector(`script[data-zone="${VIGNETTE_CONFIG.zoneId}"]`) ||
    document.querySelector(`script[src="${VIGNETTE_CONFIG.src}"]`);

  if (exists) {
    return;
  }

  const script = document.createElement('script');
  script.id = VIGNETTE_CONFIG.elementId;
  script.src = VIGNETTE_CONFIG.src;
  script.setAttribute('data-zone', VIGNETTE_CONFIG.zoneId);
  script.async = true;

  script.onerror = (error) => {
    console.warn(
      `Monetag Vignette script failed to load (${VIGNETTE_CONFIG.src}, zone ${VIGNETTE_CONFIG.zoneId}):`,
      error
    );
  };

  try {
    document.head.appendChild(script);
  } catch (err) {
    console.warn(`Failed to append Monetag Vignette script (${VIGNETTE_CONFIG.src}):`, err);
  }
}

/**
 * Hook to manage Monetag ads lifecycle:
 * - Completely removes In-Page Push format (Zone 11844075 / nap5k.com)
 * - Retains ONLY Vignette Banner (Zone 11844078 / n6wxm.com)
 * - Strict PRO user exclusion: if isPro === true (or lifetime PRO is active),
 *   ABSOLUTELY NO Monetag ad script of any kind is loaded or executed.
 */
export function useMonetagAds(proOverride?: boolean): void {
  const { isPro, isProUser, currentUser, authLoading } = useAuth();
  const isLocalPro = typeof window !== 'undefined' && localStorage.getItem('ai_prompt_pro_unlocked') === 'true';
  const effectiveIsPro =
    proOverride === true ||
    isPro === true ||
    isProUser === true ||
    isLocalPro ||
    checkIsPro(currentUser);

  useEffect(() => {
    // ENFORCE STRICT PRO AD-FREE STATUS:
    // If user is PRO or lifetime PRO is active, ABSOLUTELY NO ad script is loaded or executed
    if (effectiveIsPro) {
      removeMonetagAds();

      // Continuous protection observer: remove any late third-party injected dialogs/popups
      let observer: MutationObserver | null = null;
      if (typeof MutationObserver !== 'undefined' && document.body) {
        observer = new MutationObserver(() => {
          removeMonetagAds();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }

      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    }

    // Do NOT inject ads while authentication or PRO verification is still loading
    if (authLoading) {
      return;
    }

    // Strict guard before injection
    if (effectiveIsPro) {
      return; // Completely skip and do not inject any ad scripts
    }

    // Non-PRO user: Ensure any legacy In-Page Push is purged
    cleanupLegacyInPagePush();

    // Inject ONLY Vignette banner
    injectVignetteScript();

    return () => {
      // Clean up when unmounting or transitioning
      if (effectiveIsPro) {
        removeMonetagAds();
      }
    };
  }, [effectiveIsPro, authLoading]);
}
