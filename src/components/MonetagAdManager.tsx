import React from 'react';
import { useMonetagAds } from '../hooks/useMonetagAds';

interface MonetagAdManagerProps {
  isPro?: boolean;
}

/**
 * MonetagAdManager
 * Root layout component that dynamically injects Monetag In-Page Push and Vignette ads
 * for free users, with strict, immediate exclusion & DOM cleanup for PRO users.
 */
export const MonetagAdManager: React.FC<MonetagAdManagerProps> = ({ isPro }) => {
  useMonetagAds(isPro);
  return null;
};
