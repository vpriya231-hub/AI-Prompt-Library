import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
  '[data-zone="11844075"]',
  'iframe[src*="nap5k.com"]',
];

/**
 * Purges any leftover or active In-Page Push scripts, tags, or DOM elements.
 */
export function cleanupLegacyInPagePush(): void {
  if (typeof document === 'undefined') return;

  LEGACY_IN_PAGE_PUSH_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      try {
        el.remove();
      } catch (err) {
        console.warn('Error cleaning up legacy In-Page Push element:', err);
      }
    });
  });
}

/**
 * Removes all Monetag ad scripts and related injected DOM elements.
 */
export function removeMonetagAds(): void {
  if (typeof document === 'undefined') return;

  // 1. Purge legacy In-Page Push elements
  cleanupLegacyInPagePush();

  // 2. Remove Vignette script tags
  const vignetteSelectors = [
    `#${VIGNETTE_CONFIG.elementId}`,
    `script[data-zone="${VIGNETTE_CONFIG.zoneId}"]`,
    'script[src*="n6wxm.com"]',
  ];

  vignetteSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      try {
        el.remove();
      } catch (err) {
        console.warn('Error removing Monetag Vignette script tag:', err);
      }
    });
  });

  // 3. Remove any active vignette overlays or containers
  const adElementSelectors = [
    `[data-zone="${VIGNETTE_CONFIG.zoneId}"]:not(script)`,
    '[id*="monetag"]',
    '[class*="monetag"]',
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
    // Graceful error handling without crashing UI or blocking execution
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
 * - Strict PRO user exclusion: if isPro === true, no ads are loaded and all scripts are removed.
 */
export function useMonetagAds(proOverride?: boolean): void {
  const { isPro, isProUser } = useAuth();
  const effectiveIsPro = proOverride !== undefined ? proOverride : (isPro ?? isProUser);

  useEffect(() => {
    // STRICT RULE: If PRO user, purge all ads immediately
    if (effectiveIsPro) {
      removeMonetagAds();
      return;
    }

    // Non-PRO user: Ensure any legacy In-Page Push is purged
    cleanupLegacyInPagePush();

    // Inject ONLY Vignette banner
    injectVignetteScript();

    return () => {
      // Clean up when unmounting or transitioning to PRO
      if (effectiveIsPro) {
        removeMonetagAds();
      }
    };
  }, [effectiveIsPro]);
}
