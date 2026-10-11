import React, { useEffect } from 'react';
import { useMonetagAds, removeMonetagAds } from '../hooks/useMonetagAds';
import { useAuth, checkIsPro } from '../context/AuthContext';

interface MonetagAdManagerProps {
  isPro?: boolean;
}

/**
 * MonetagAdManager
 * Root layout component that dynamically injects the Monetag Vignette Banner
 * strictly for non-PRO users.
 *
 * Strict PRO Protection:
 * - If isPro is true (or lifetime PRO is active), ABSOLUTELY NO Monetag ad script
 *   of any kind is loaded or executed.
 * - All ad DOM nodes, containers, dialogs, and overlays are immediately wiped.
 */
export const MonetagAdManager: React.FC<MonetagAdManagerProps> = ({ isPro: isProProp }) => {
  const { isPro: isProContext, isProUser, currentUser } = useAuth();
  const isLocalPro = typeof window !== 'undefined' && localStorage.getItem('ai_prompt_pro_unlocked') === 'true';
  const isUserPro = Boolean(
    isProProp ||
    isProContext ||
    isProUser ||
    isLocalPro ||
    checkIsPro(currentUser)
  );

  // Immediate cleanup when user has or upgrades to PRO
  useEffect(() => {
    if (isUserPro) {
      removeMonetagAds();
    }
  }, [isUserPro]);

  // STRICT PRO AD-FREE RULE:
  // If user is PRO, completely skip and do not inject any ad scripts
  if (isUserPro) {
    return null;
  }

  return <MonetagAdExecutor isPro={isUserPro} />;
};

/**
 * Separate executor component so hooks are only mounted when user is NOT PRO
 */
const MonetagAdExecutor: React.FC<{ isPro: boolean }> = ({ isPro }) => {
  useMonetagAds(isPro);
  return null;
};
