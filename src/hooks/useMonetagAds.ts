import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface MonetagAdConfig {
  inPagePush: {
    src: string;
    zoneId: string;
    elementId: string;
  };
  vignette: {
    src: string;
    zoneId: string;
    elementId: string;
  };
}

const MONETAG_CONFIG: MonetagAdConfig = {
  inPagePush: {
    src: 'https://nap5k.com/tag.min.js',
    zoneId: '11844075',
    elementId: 'monetag-inpage-push-script',
  },
  vignette: {
    src: 'https://n6wxm.com/vignette.min.js',
    zoneId: '11844078',
    elementId: 'monetag-vignette-script',
  },
};

/**
 * Removes all Monetag ad scripts and related injected DOM elements.
 */
export function removeMonetagAds(): void {
  if (typeof document === 'undefined') return;

  // 1. Remove specific script tags by ID and selector
  const scriptSelectors = [
    `#${MONETAG_CONFIG.inPagePush.elementId}`,
    `#${MONETAG_CONFIG.vignette.elementId}`,
    `script[data-zone="${MONETAG_CONFIG.inPagePush.zoneId}"]`,
    `script[data-zone="${MONETAG_CONFIG.vignette.zoneId}"]`,
    'script[src*="nap5k.com"]',
    'script[src*="n6wxm.com"]',
  ];

  scriptSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      try {
        el.remove();
      } catch (err) {
        console.warn('Error removing Monetag script tag:', err);
      }
    });
  });

  // 2. Remove any injected ad containers, floating overlays, or vignettes
  const adElementSelectors = [
    `[data-zone="${MONETAG_CONFIG.inPagePush.zoneId}"]:not(script)`,
    `[data-zone="${MONETAG_CONFIG.vignette.zoneId}"]:not(script)`,
    '[id*="monetag"]',
    '[class*="monetag"]',
    'iframe[src*="nap5k.com"]',
    'iframe[src*="n6wxm.com"]',
  ];

  adElementSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      try {
        el.remove();
      } catch (err) {
        console.warn('Error removing Monetag element:', err);
      }
    });
  });
}

/**
 * Injects a single Monetag script tag if it doesn't already exist.
 */
function injectScript(src: string, zoneId: string, elementId: string): void {
  if (typeof document === 'undefined') return;

  // Check if script is already injected
  const exists =
    document.getElementById(elementId) ||
    document.querySelector(`script[data-zone="${zoneId}"]`) ||
    document.querySelector(`script[src="${src}"]`);

  if (exists) {
    return;
  }

  const script = document.createElement('script');
  script.id = elementId;
  script.src = src;
  script.setAttribute('data-zone', zoneId);
  script.async = true;

  script.onerror = (error) => {
    // Graceful error handling without crashing UI or blocking execution
    console.warn(`Monetag Ad Script failed to load (${src}, zone ${zoneId}):`, error);
  };

  try {
    document.head.appendChild(script);
  } catch (err) {
    console.warn(`Failed to append Monetag script (${src}):`, err);
  }
}

/**
 * Hook to manage Monetag ads lifecycle with strict PRO user exclusion.
 * - When isPro is true: guarantees NO scripts are loaded and cleans up any existing tags.
 * - When isPro is false: dynamically loads In-Page Push and Vignette scripts asynchronously.
 */
export function useMonetagAds(proOverride?: boolean): void {
  const { isPro, isProUser } = useAuth();
  const effectiveIsPro = proOverride !== undefined ? proOverride : (isPro ?? isProUser);

  useEffect(() => {
    // STRICT RULE: If PRO user, remove all scripts and never inject
    if (effectiveIsPro) {
      removeMonetagAds();
      return;
    }

    // Non-PRO user: inject In-Page Push & Vignette scripts safely
    injectScript(
      MONETAG_CONFIG.inPagePush.src,
      MONETAG_CONFIG.inPagePush.zoneId,
      MONETAG_CONFIG.inPagePush.elementId
    );

    injectScript(
      MONETAG_CONFIG.vignette.src,
      MONETAG_CONFIG.vignette.zoneId,
      MONETAG_CONFIG.vignette.elementId
    );

    return () => {
      // Clean up when component unmounts or status changes to PRO
      if (effectiveIsPro) {
        removeMonetagAds();
      }
    };
  }, [effectiveIsPro]);
}
