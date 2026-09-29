import React from 'react';
import { useMonetagAds } from '../hooks/useMonetagAds';

interface MonetagAdManagerProps {
  isPro?: boolean;
}

/**
 * MonetagAdManager
 * Root layout component that dynamically injects the Monetag Vignette Banner
 * for non-PRO users, with strict, immediate exclusion & DOM cleanup for PRO users.
 * In-Page Push has been completely removed.
 */
export const MonetagAdManager: React.FC<MonetagAdManagerProps> = ({ isPro }) => {
  useMonetagAds(isPro);
  return null;
};
