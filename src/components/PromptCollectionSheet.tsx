import React, { useState, useMemo, useEffect } from 'react';
import { X, Copy, Check, Search, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CollectionTier, AIModel, CheatCodePrompt } from '../types';
import { getCheatCodes } from '../data/cheatCodesLoader';

interface PromptCollectionSheetProps {
  activeModel: AIModel;
  selectedCollection: CollectionTier;
  onClose: () => void;
  onOpenProCheckout: () => void;
}

export function PromptCollectionSheet({
  activeModel,
  selectedCollection,
  onClose,
  onOpenProCheckout,
}: PromptCollectionSheetProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [communityPrompts, setCommunityPrompts] = useState<CheatCodePrompt[]>([]);

  // Fetch approved community prompts for the active model and tier from Firestore
  useEffect(() => {
    let isCancelled = false;

    async function fetchApprovedCommunityPrompts() {
      try {
        const q = query(
          collection(db, 'community_contributions'),
          where('status', '==', 'approved'),
          where('aiModel', '==', activeModel.name),
          where('tier', '==', selectedCollection.name)
        );

        const snapshot = await getDocs(q);
        if (isCancelled) return;

        const results: CheatCodePrompt[] = [];
        let index = 1;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawCode = (data.cheatCode || '').trim().toLowerCase();
          const shortcut = rawCode ? (rawCode.startsWith('/') ? rawCode : `/${rawCode}`) : '/community';
          const title = shortcut.startsWith('/') ? shortcut.slice(1) : shortcut;
          results.push({
            id: 800000 + index++,
            shortcut: shortcut,
            title: title || 'Community Cheat Code',
            category: 'Community',
            description: `Contributed by ${data.contributor || 'Community Member'}`,
            prompt: data.prompt || '',
            isOfficial: false,
            isCommunity: true,
            contributor: data.contributor || 'Community Member'
          });
        });

        setCommunityPrompts(results);
      } catch (err) {
        console.warn('Unable to query community prompts from Firestore:', err);
        // Local queue fallback for testing or offline support
        try {
          const localQueue = JSON.parse(localStorage.getItem('pending_community_contributions') || '[]');
          const matchingApproved = localQueue
            .filter((p: any) => p.status === 'approved' && p.aiModel === activeModel.name && p.tier === selectedCollection.name)
            .map((data: any, idx: number) => {
              const rawCode = (data.cheatCode || '').trim().toLowerCase();
              const shortcut = rawCode ? (rawCode.startsWith('/') ? rawCode : `/${rawCode}`) : '/community';
              const title = shortcut.startsWith('/') ? shortcut.slice(1) : shortcut;
              return {
                id: 850000 + idx + 1,
                shortcut: shortcut,
                title: title || 'Community Cheat Code',
                category: 'Community',
                description: `Contributed by ${data.contributor || 'Community Member'}`,
                prompt: data.prompt || '',
                isOfficial: false,
                isCommunity: true,
                contributor: data.contributor || 'Community Member'
              };
            });
          if (!isCancelled && matchingApproved.length > 0) {
            setCommunityPrompts(matchingApproved);
          }
        } catch {
          // ignore
        }
      }
    }

    fetchApprovedCommunityPrompts();

    return () => {
      isCancelled = true;
    };
  }, [activeModel.name, selectedCollection.name]);

  // Dynamically load prompts matching the active model and selected tier, merged safely with approved community prompts
  const prompts: CheatCodePrompt[] = useMemo(() => {
    const staticPrompts = getCheatCodes(activeModel.id, selectedCollection.id);

    // Build a Set of normalized cheat codes (case-insensitive, standardized with leading '/') from the static prompts
    const staticCodes = new Set<string>();
    staticPrompts.forEach((p) => {
      const code = (p.shortcut || '').trim().toLowerCase();
      if (code) {
        staticCodes.add(code.startsWith('/') ? code : `/${code}`);
      }
    });

    // Strictly filter community prompts:
    // Only include approved community items whose cheatCode (case-insensitive) does NOT already exist in the static list.
    // If there is any collision with an existing core prompt, the static one takes precedence and the duplicate community prompt is skipped.
    const seenCommunityCodes = new Set<string>();
    const safeCommunityPrompts = communityPrompts.filter((cp) => {
      const code = (cp.shortcut || '').trim().toLowerCase();
      if (!code) return false;
      const normalizedCode = code.startsWith('/') ? code : `/${code}`;

      // Collision with static core prompt: static takes precedence, community skipped
      if (staticCodes.has(normalizedCode)) {
        return false;
      }

      // Deduplicate among community contributions as well
      if (seenCommunityCodes.has(normalizedCode)) {
        return false;
      }

      seenCommunityCodes.add(normalizedCode);
      return true;
    });

    return [...staticPrompts, ...safeCommunityPrompts];
  }, [activeModel.id, selectedCollection.id, communityPrompts]);

  // Extract unique categories for quick filtering chips
  const categories = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [prompts]);

  // Filtered prompt list based on category & search query
  const filteredPrompts = useMemo(() => {
    let list = prompts;
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }
    const q = searchFilter.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.shortcut?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.prompt?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prompts, activeCategory, searchFilter]);

  const handleCopy = (promptText: string, id: number) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  return (
    <div
      id="collection-sheet-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="collection-sheet-panel"
        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-[#F7F4FA] rounded-t-3xl sm:rounded-3xl border border-[#E5DCED] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DEF2] bg-[#F4EEF8] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">{selectedCollection.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1E1B22] leading-tight">
                  {activeModel.name} {selectedCollection.name}
                </h3>
                <span className="text-xs bg-[#5B4296] text-white font-semibold px-2 py-0.5 rounded-full">
                  {prompts.length > 0 ? `${prompts.length} Prompts` : `${selectedCollection.codesCount} Codes`}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Android assets: <code className="text-[#5B4296] font-mono">{activeModel.id}_{selectedCollection.id}.json</code>
              </p>
            </div>
          </div>
          <button
            id="close-collection-sheet-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#E6DCF0] text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.4]" />
          </button>
        </div>

        {/* Search & Category Filter Header */}
        <div className="px-5 pt-3 pb-2.5 bg-white border-b border-[#EDE6F5] space-y-2.5 flex-shrink-0">
          <div className="relative flex items-center bg-[#F7F4FA] rounded-xl border border-[#DDD6E5] px-3 py-2 text-sm focus-within:border-[#5B4296]">
            <Search className="w-4 h-4 text-[#6B7280] mr-2 flex-shrink-0" />
            <input
              id="sheet-search-input"
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={`Search ${prompts.length} ${selectedCollection.name} cheat codes...`}
              className="w-full bg-transparent text-[#1E1B22] placeholder-[#9CA3AF] focus:outline-hidden text-sm"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="text-gray-400 hover:text-gray-700 text-xs p-1"
                aria-label="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips Horizontal Scroll */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#5B4296] text-white'
                      : 'bg-[#F4EEF8] text-[#5B4296] hover:bg-[#EAE0F2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Prompts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#F7F4FA]">
          {filteredPrompts.length > 0 ? (
            filteredPrompts.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <article
                  key={item.id}
                  id={`cheatcode-item-${item.id}`}
                  className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E5DCED] shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                >
                  {/* Item Header: Title + Shortcut Tag + Category */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[15.5px] text-[#1E1B22] tracking-tight">
                          {item.title}
                        </h4>
                        {item.shortcut && (
                          <span className="font-mono text-[11px] bg-[#EFEBF5] text-[#5B4296] font-semibold px-2 py-0.5 rounded-md">
                            {item.shortcut}
                          </span>
                        )}
                        {item.isCommunity && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] bg-[#EFE8F6] text-[#654A9E] border border-[#DDD0EC] px-2 py-0.5 rounded-md">
                            <Sparkles className="w-3 h-3 text-[#654A9E]" />
                            <span>{item.contributor ? `By ${item.contributor}` : 'Community'}</span>
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[13px] text-[#6B7280] font-normal mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {item.category && (
                      <span className="text-[11px] font-semibold bg-[#F4EEF8] text-[#5B4296] px-2.5 py-0.5 rounded-full flex-shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Prompt Text Block */}
                  <div className="relative group">
                    <pre className="text-[13px] text-[#1E1B22] font-mono bg-[#F9F7FC] p-3 rounded-xl border border-[#EDE7F5] leading-relaxed whitespace-pre-wrap break-words select-all max-h-48 overflow-y-auto">
                      {item.prompt}
                    </pre>
                  </div>

                  {/* Instant Copy Button with Visual Confirmation Feedback */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11.5px] text-[#9CA3AF] font-mono">
                      #{item.id}
                    </span>

                    <button
                      id={`copy-btn-${item.id}`}
                      onClick={() => handleCopy(item.prompt, item.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs ${
                        isCopied
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-[#5B4296] text-white hover:bg-[#4B357E] active:scale-95'
                      }`}
                      title="Copy full prompt to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E5DCED] space-y-3 my-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#5B4296] flex items-center justify-center mx-auto text-xl font-bold">
                {prompts.length === 0 ? '⏳' : '🔍'}
              </div>
              <h4 className="font-bold text-[#1E1B22] text-base">
                {prompts.length === 0
                  ? `Loading ${activeModel.name} ${selectedCollection.name}...`
                  : 'No Matching Cheat Codes Found'}
              </h4>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                {prompts.length === 0
                  ? `The cheat codes for ${activeModel.name} ${selectedCollection.name} are coming soon.`
                  : `Try searching for a different keyword or switch the category filter.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer info & PRO status banner */}
        <div className="px-5 py-3 bg-[#F4EEF8] border-t border-[#EDE6F5] flex items-center justify-between text-xs text-[#6B7280] flex-shrink-0">
          <span>
            Showing <strong className="text-[#1E1B22]">{filteredPrompts.length}</strong> of{' '}
            {prompts.length} cheat codes
          </span>
          <button
            onClick={onOpenProCheckout}
            className="font-bold text-[#5B4296] hover:underline cursor-pointer"
          >
            Upgrade to PRO ✨
          </button>
        </div>
      </div>
    </div>
  );
}
