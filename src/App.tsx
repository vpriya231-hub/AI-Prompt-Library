/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Settings, 
  X, 
  Check, 
  Copy, 
  CreditCard,
  ArrowLeft,
  Download 
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { CollectionTier, AIModel, ProCollectionItem } from './types';
import { PromptCollectionSheet } from './components/PromptCollectionSheet';
import { ProScreen } from './components/ProScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PWAInstallButton } from './components/PWAInstallButton';

// Custom precision arrow icon matching the exact Android screenshot glyph (>|)
function ModelNavArrow() {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="text-[#9CA3AF] transition-transform duration-150 group-hover:translate-x-0.5"
    >
      <polygon points="5 4 15 12 5 20 5 4" fill="none" />
      <line x1="19" y1="4" x2="19" y2="20" />
    </svg>
  );
}

// Solid triangle indicator matching the PRO card toggle in Screenshot 2
function TriangleToggle({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 16 16" 
      fill="currentColor" 
      className={`text-[#9CA3AF] transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}`}
    >
      <path d="M8 5.5L13 11.5H3L8 5.5Z" />
    </svg>
  );
}

// Thinking Emoji holding a magnifying glass vector matching the exact "No Results Found" screenshot
function NoResultsIllustration() {
  return (
    <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto relative flex items-center justify-center select-none">
      <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
        {/* Yellow Emoji Face */}
        <circle cx="60" cy="60" r="48" fill="url(#face-yellow-grad)" />

        {/* Right Eyebrow (furrowed/concerned slant down towards center) */}
        <path d="M71 43 C76 40 85 41 89 44" stroke="#231F20" strokeWidth="4.5" strokeLinecap="round" />

        {/* Right Eye (looking down-left) */}
        <ellipse cx="79" cy="55" rx="5" ry="6.5" fill="#231F20" />
        <circle cx="77" cy="53" r="1.8" fill="white" />

        {/* Curious/Puzzled Downward Curved Mouth */}
        <path d="M52 86 C58 82 66 82 72 86" stroke="#231F20" strokeWidth="4" strokeLinecap="round" />

        {/* Magnifying Glass Handle extending down-left */}
        <line x1="20" y1="98" x2="36" y2="78" stroke="#1E1B22" strokeWidth="9" strokeLinecap="round" />
        <line x1="21" y1="97" x2="35" y2="79" stroke="#4A5568" strokeWidth="4" strokeLinecap="round" />

        {/* Magnifying Glass Outer Rim */}
        <circle cx="47" cy="53" r="23" stroke="#1E1B22" strokeWidth="6.5" fill="#BAE6FD" fillOpacity="0.45" />

        {/* Left Eyebrow (magnified through lens) */}
        <path d="M35 39 C41 36 52 37 58 42" stroke="#231F20" strokeWidth="4.8" strokeLinecap="round" />

        {/* Left Eye (magnified through glass) */}
        <ellipse cx="47" cy="54" rx="8.5" ry="10.5" fill="white" />
        <ellipse cx="46" cy="55" rx="5.8" ry="7.5" fill="#231F20" />
        <circle cx="43.5" cy="52" r="2.2" fill="white" />

        {/* Glass reflection glare arc */}
        <path d="M34 43 A18 18 0 0 1 59 43" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.85" />

        {/* Emoji Hand gripping the handle */}
        <circle cx="28" cy="89" r="8.5" fill="#FFC72C" stroke="#D97706" strokeWidth="1.5" />
        <ellipse cx="25" cy="86" rx="4" ry="3" fill="#FFC72C" />

        <defs>
          <radialGradient id="face-yellow-grad" cx="38%" cy="34%" r="65%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="75%" stopColor="#FFC72C" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// Direct Image Model Icons matching the exact Android assets
interface ModelIconProps {
  src: string;
  alt: string;
}

function ModelIcon({ src, alt }: ModelIconProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-12 h-12 rounded-xl bg-white border border-[#EBE3F2] flex items-center justify-center p-1 shadow-2xs flex-shrink-0 overflow-hidden">
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-[#EFE7F5] rounded-lg flex items-center justify-center text-xs font-bold text-[#5B4296]">
          {alt.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ChatGPTLogo() {
  return <ModelIcon src="https://i.ibb.co/LD6jd24M/ic-chatgpt.png" alt="ChatGPT" />;
}

function GeminiLogo() {
  return <ModelIcon src="https://i.ibb.co/B2R4WGsK/ic-gemini.png" alt="Gemini" />;
}

function ClaudeLogo() {
  return <ModelIcon src="https://i.ibb.co/wNd1Z8TP/ic-claude.png" alt="Claude" />;
}

function GrokLogo() {
  return <ModelIcon src="https://i.ibb.co/ZR2JRMbs/ic-grok.png" alt="Grok" />;
}

function PerplexityLogo() {
  return <ModelIcon src="https://i.ibb.co/4QJSyVb/ic-perplexity.png" alt="Perplexity" />;
}

function CopilotLogo() {
  return <ModelIcon src="https://i.ibb.co/jPMhjDCg/ic-copilot.png" alt="Microsoft Copilot" />;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    developer: 'OpenAI',
    codesCount: 500,
    isComingSoon: false,
    logo: <ChatGPTLogo />,
    description: 'OpenAI flagship reasoning and general-purpose intelligence engine.',
    categories: [
      {
        name: 'Persona & Role Engineering',
        samplePrompt: 'Act as a Principal Software Architect. Review this microservice event schema for race conditions, deadlock vectors, and telemetry gaps...',
        tags: ['Architecture', 'System Design']
      },
      {
        name: 'First-Principles Reasoning',
        samplePrompt: 'Solve this algorithm step-by-step. Formulate the invariants, establish base conditions, and outline time/space complexity proofs...',
        tags: ['Logic', 'Algorithms']
      },
      {
        name: 'Executive Synthesis',
        samplePrompt: 'Condense this 40-page quarterly earnings call transcript into a 5-bullet C-suite memo highlighting risk disclosures and unit economics...',
        tags: ['Finance', 'Summarization']
      }
    ]
  },
  {
    id: 'gemini',
    name: 'Gemini',
    developer: 'Google',
    codesCount: 500,
    isComingSoon: false,
    logo: <GeminiLogo />,
    description: 'Google highly multimodal model with long context window synthesis.',
    categories: [
      {
        name: '1M+ Long Context Synthesis',
        samplePrompt: 'Ingest this complete codebase repository documentation and output an end-to-end data flow dependency graph with entity schemas...',
        tags: ['Long Context', 'Codebases']
      },
      {
        name: 'Multimodal Image & Chart Audit',
        samplePrompt: 'Analyze this mobile dashboard wireframe. List WCAG 2.1 AA accessibility contrast violations, spacing irregularities, and UI inconsistencies...',
        tags: ['Vision', 'Design Audit']
      },
      {
        name: 'Search Grounding & Citations',
        samplePrompt: 'Synthesize the latest peer-reviewed breakthroughs in room-temperature superconducting materials published in the last 6 months with verified links...',
        tags: ['Research', 'Grounding']
      }
    ]
  },
  {
    id: 'claude',
    name: 'Claude',
    developer: 'Anthropic',
    codesCount: 500,
    isComingSoon: false,
    logo: <ClaudeLogo />,
    description: 'Anthropic safety-first model renowned for nuanced prose, coding, and artifact generation.',
    categories: [
      {
        name: 'Nuanced Editorial Tone',
        samplePrompt: 'Draft an analytical essay exploring digital minimalism in the prose style of Paul Graham, avoiding buzzwords and clichés...',
        tags: ['Essays', 'Human Tone']
      },
      {
        name: 'Production React Artifact',
        samplePrompt: 'Build a self-contained interactive React chart demonstrating compounding dividend growth with slider controls and SVG rendering...',
        tags: ['React', 'Artifacts']
      },
      {
        name: 'Technical Policy & Dialectics',
        samplePrompt: 'Deconstruct privacy trade-offs in edge AI deployments using structured Hegelian dialectics (thesis, antithesis, synthesis)...',
        tags: ['Ethics', 'Strategy']
      }
    ]
  },
  {
    id: 'grok',
    name: 'Grok',
    developer: 'Coming Soon',
    codesCount: 0,
    isComingSoon: true,
    logo: <GrokLogo />,
    description: 'xAI model with real-time X posts integration and witty perspective.',
    categories: [
      {
        name: 'Real-Time News Analysis',
        samplePrompt: 'Coming soon: Unfiltered sentiment analysis distilled from live global X feeds...',
        tags: ['Real-Time', 'xAI']
      }
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    developer: 'Coming Soon',
    codesCount: 0,
    isComingSoon: true,
    logo: <PerplexityLogo />,
    description: 'Conversational search engine with direct citations and live source synthesis.',
    categories: [
      {
        name: 'Academic Source Verification',
        samplePrompt: 'Coming soon: Precision literature review search queries with ArXiv DOI citations...',
        tags: ['Academic', 'Citations']
      }
    ]
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    developer: 'Coming Soon',
    codesCount: 0,
    isComingSoon: true,
    logo: <CopilotLogo />,
    description: 'Microsoft enterprise AI integrated across Office 365, GitHub, and Windows.',
    categories: [
      {
        name: 'Enterprise Productivity Macros',
        samplePrompt: 'Coming soon: Advanced Excel lambda formulas and PowerPoint narrative generator formulas...',
        tags: ['Office', 'Enterprise']
      }
    ]
  }
];

const COLLECTION_TIERS: CollectionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    emoji: '📘',
    codesCount: 100,
    description: 'Foundational prompt formulas, role assignment, and zero-shot reasoning structures.'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    emoji: '🚀',
    codesCount: 100,
    description: 'Multi-step chain-of-thought workflows, parameter constraints, and analytical frameworks.'
  },
  {
    id: 'expert',
    name: 'Expert',
    emoji: '🎯',
    codesCount: 100,
    description: 'Specialized domain algorithms, recursive refinement, and high-stakes decision frameworks.'
  },
  {
    id: 'master',
    name: 'Master',
    emoji: '👑',
    codesCount: 100,
    description: 'Autonomous agent prompting, tree-of-thoughts orchestration, and systemic leverage.'
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    emoji: '💎',
    codesCount: 100,
    description: 'Elite prompt libraries, proprietary reasoning shortcuts, and maximum leverage prompt mastery.'
  }
];

export const PRO_COLLECTIONS: ProCollectionItem[] = [
  { id: 'business_startup', name: 'Business Startup', emoji: '🚀', pdf: 'business_startup.pdf', description: 'Ideation, GTM, Strategy & Pitch Decks' },
  { id: 'coding', name: 'Coding', emoji: '💻', pdf: 'coding.pdf', description: 'System Design, Architecture & Clean Code' },
  { id: 'marketing', name: 'Marketing', emoji: '📈', pdf: 'marketing.pdf', description: 'SEO, Ads, Copywriting & Funnels' },
  { id: 'design', name: 'Design', emoji: '🎨', pdf: 'design.pdf', description: 'UI/UX, Branding & Design Systems' },
  { id: 'writing', name: 'Writing', emoji: '📝', pdf: 'writing.pdf', description: 'Storytelling, Fiction & Direct Response' },
  { id: 'ai_agents', name: 'AI Agents', emoji: '🤖', pdf: 'ai_agents.pdf', description: 'Autonomous Swarms & Task Workflows' },
  { id: 'research', name: 'Research', emoji: '📚', pdf: 'research.pdf', description: 'Deep Research & Market Analysis' },
  { id: 'youtube', name: 'YouTube', emoji: '🎬', pdf: 'youtube.pdf', description: 'Algorithm, Retention & Scriptwriting' },
  { id: 'devops_cloud', name: 'DevOps & Cloud Prompts', emoji: '☁️', pdf: 'devops_cloud.pdf', description: 'AWS, Docker, K8s & CI/CD Pipelines' },
  { id: 'cybersecurity_ethical_hacking', name: 'Cybersecurity & Ethical Hacking', emoji: '🛡️', pdf: 'cybersecurity_ethical_hacking.pdf', description: 'Penetration Testing & Cloud Security' },
  { id: 'sql_database_optimization', name: 'SQL & Database Optimization', emoji: '🗄️', pdf: 'sql_database_optimization.pdf', description: 'Query Tuning, Schema Design & Indexing' },
  { id: 'api_development_integration', name: 'API Development & Integration', emoji: '🔌', pdf: 'api_development_integration.pdf', description: 'REST, GraphQL, Webhooks & gRPC' },
  { id: 'resume_cover_letter', name: 'Resume & Cover Letter Building', emoji: '📄', pdf: 'resume_cover_letter.pdf', description: 'ATS Optimization & High-Impact Bullets' },
  { id: 'job_interview_preparation', name: 'Job Interview Preparation & Mock Interviews', emoji: '🎤', pdf: 'job_interview_preparation.pdf', description: 'Live Mock Roleplay & Technical Screens' },
  { id: 'time_management_productivity', name: 'Time Management & Productivity Systems', emoji: '⏱️', pdf: 'time_management_productivity.pdf', description: 'Deep Work, Pomodoro & GTD Systems' },
  { id: 'meeting_summaries_action_items', name: 'Meeting Summaries & Action Items', emoji: '📝', pdf: 'meeting_summaries_action_items.pdf', description: 'Executive Briefings & Action Trackers' }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProExpanded, setIsProExpanded] = useState(true);
  const [activeModel, setActiveModel] = useState<AIModel | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<CollectionTier | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProScreen, setShowProScreen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [hasUnlockedPro, setHasUnlockedPro] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Root auth synchronization - Strictly read-only check on users/{uid}
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const data = userDoc.exists() ? userDoc.data() : null;
          const isProUser = Boolean(data?.isPro === true || data?.pro === true);
          setHasUnlockedPro(isProUser);
        } catch (err) {
          console.warn('Root Firestore PRO check error:', err);
        }
      } else {
        setHasUnlockedPro(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time case-insensitive instant search matching both model name and developer/company
  const filteredModels = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return AI_MODELS;
    return AI_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(trimmed) ||
        m.developer.toLowerCase().includes(trimmed) ||
        m.id.toLowerCase().includes(trimmed)
    );
  }, [searchQuery]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleModelClick = (model: AIModel) => {
    if (model.isComingSoon) {
      showToast("Cheat codes coming soon for this model!");
      return;
    }
    setActiveModel(model);
    setSelectedCollection(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/assets/${fileName}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If PRO screen is open, display full-screen PRO view matching screenshots
  if (showProScreen) {
    return (
      <ProScreen 
        onBack={() => setShowProScreen(false)} 
        hasUnlockedPro={hasUnlockedPro}
        onProStatusChange={(isPro) => setHasUnlockedPro(isPro)}
      />
    );
  }

  // If Settings screen is open, display full-screen Settings view matching Screenshot 1
  if (showSettings) {
    return (
      <SettingsScreen 
        onBack={() => setShowSettings(false)}
        showToast={showToast}
        hasUnlockedPro={hasUnlockedPro}
        onProStatusChange={(isPro) => setHasUnlockedPro(isPro)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F4FA] text-[#1E1B22] font-sans antialiased flex flex-col selection:bg-purple-200">
      
      {/* Dynamic Top Header Band */}
      {activeModel ? (
        <header aria-label="Collections Header" className="w-full bg-[#EFEBF5] py-3.5 px-4 border-b border-[#E8E1EF] flex items-center justify-between flex-shrink-0">
          <button 
            id="collections-back-btn"
            onClick={() => {
              setActiveModel(null);
              setSelectedCollection(null);
            }}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-[#E2D9EB] active:bg-[#D7CBDE] text-[#1E1B22] transition-colors cursor-pointer flex items-center justify-center"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-[#1E1B22] stroke-[2.4]" />
          </button>

          <h1 className="text-[18px] font-semibold text-[#1E1B22] tracking-tight">
            Collections
          </h1>

          {/* Spacer to keep title centered */}
          <div className="w-8" aria-hidden="true" />
        </header>
      ) : (
        <header aria-label="Page Title Band" className="w-full bg-[#EFEBF5] py-3.5 px-4 text-center border-b border-[#E8E1EF] flex-shrink-0">
          <h1 className="text-[18px] font-semibold text-[#1E1B22] tracking-tight">Home</h1>
        </header>
      )}

      {/* Main Responsive Container */}
      {activeModel ? (
        /* DYNAMIC COLLECTIONS VIEW */
        <main 
          id="collections-main-shell"
          className="w-full flex-1"
        >
          <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 pb-16">
            
            {/* Dynamic Model Title & Subtitle matching Screenshot 5 */}
            <section aria-label="Model Collection Heading" className="pt-1">
              <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#1E1B22] tracking-tight">
                {activeModel.name}
              </h2>
              <p className="text-[#6B7280] text-[15px] font-normal mt-0.5">
                Choose a Collection
              </p>
            </section>

            {/* 5 Collections Tier Cards */}
            <section aria-label="Collections List" className="space-y-3.5">
              {COLLECTION_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  id={`collection-card-${tier.id}`}
                  onClick={() => setSelectedCollection(tier)}
                  className="group bg-[#F4EEF8] hover:bg-[#EFE7F5] active:bg-[#E9DFEF] rounded-2xl p-4 border border-[#ECE3F2] hover:border-[#DDCFE8] transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-between"
                >
                  {/* Left: Emoji + Tier Details */}
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl select-none flex items-center justify-center w-8">
                      {tier.emoji}
                    </span>

                    <div className="flex flex-col">
                      <h3 className="text-[17px] font-bold text-[#1E1B22] leading-tight group-hover:text-[#5B4296] transition-colors">
                        {tier.name}
                      </h3>
                      <p className="text-[13.5px] text-[#6B7280] font-normal mt-0.5">
                        {tier.codesCount} Cheat Codes
                      </p>
                    </div>
                  </div>

                  {/* Right: Custom Navigation Arrow Glyph */}
                  <div className="pl-3 flex-shrink-0">
                    <ModelNavArrow />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </main>
      ) : (
        /* HOME VIEW */
        <main 
          id="app-main-shell"
          className="w-full flex-1"
        >
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-16">
          
          {/* Welcome Header */}
          <section aria-label="Welcome Greeting" className="flex items-start justify-between pt-1">
            <div>
              <h2 className="text-[28px] sm:text-[32px] font-extrabold text-[#1E1B22] tracking-tight flex items-center gap-2">
                Welcome <span className="inline-block origin-bottom-right">👋</span>
              </h2>
              <p className="text-[#6B7280] text-[15px] font-normal mt-0.5">
                One Library. Every AI.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {/* Settings Gear Icon */}
              <button
                id="settings-gear-btn"
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full hover:bg-[#EBE2F2] active:bg-[#E2D6EA] text-[#1E1B22] transition-colors cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-[24px] h-[24px] stroke-[2.2]" />
              </button>
            </div>
          </section>

          {/* Search Bar: Focused State with floating top notch label matching Screenshot */}
          <section aria-label="Search Input" className="relative">
            <div className={`relative flex items-center bg-[#F7F4FA] rounded-2xl transition-all ${
              isSearchFocused || searchQuery 
                ? 'border-2 border-[#5B4296] py-3 px-4 shadow-2xs' 
                : 'border border-[#DDD6E5] py-3.5 px-4'
            }`}>
              {/* Floating Notch Label when active or has query */}
              {(isSearchFocused || searchQuery) && (
                <span className="absolute -top-2.5 left-3.5 bg-[#F7F4FA] px-1.5 text-[12px] font-semibold text-[#5B4296] pointer-events-none transition-all select-none">
                  Search AI Models
                </span>
              )}

              <Search className={`w-5 h-5 flex-shrink-0 mr-3 transition-colors ${
                isSearchFocused || searchQuery ? 'text-[#1E1B22]' : 'text-[#6B7280]'
              }`} />
              
              <input
                id="search-models-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={!isSearchFocused && !searchQuery ? "Search AI Models" : ""}
                className="w-full bg-transparent text-[16px] text-[#1E1B22] placeholder-[#6B7280] focus:outline-hidden font-normal"
                autoComplete="off"
                spellCheck="false"
              />

              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>

          {/* "AI Models" Section */}
          <section aria-label="AI Models Directory" className="space-y-4">
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-[20px] font-bold text-[#1E1B22] tracking-tight">AI Models</h2>
              {searchQuery && filteredModels.length > 0 && (
                <span className="text-xs text-[#6B7280]">
                  {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'}
                </span>
              )}
            </div>

            {/* Empty State when no results found */}
            {filteredModels.length === 0 ? (
              <div 
                id="no-results-found-state"
                className="py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-200"
              >
                <NoResultsIllustration />
                
                <div className="space-y-1 pt-2">
                  <h3 className="text-[20px] font-bold text-[#1E1B22] tracking-tight">
                    No Results Found
                  </h3>
                  <p className="text-[15px] text-[#6B7280]">
                    Try another keyword.
                  </p>
                </div>

                <button
                  id="reset-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-semibold text-[#5B4296] hover:text-[#453075] bg-[#EFE7F5] hover:bg-[#E7DCEE] px-4 py-2 rounded-full transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              /* AI Models 2-Column Responsive Grid on Desktop / 1-Column on Mobile */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    id={`model-card-${model.id}`}
                    onClick={() => handleModelClick(model)}
                    className="group bg-[#F4EEF8] hover:bg-[#EFE7F5] active:bg-[#E9DFEF] rounded-2xl p-4 border border-[#ECE3F2] hover:border-[#DDCFE8] transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-between"
                  >
                    {/* Left: Model Logo + Center Info */}
                    <div className="flex items-center gap-3.5">
                      {model.logo}

                      <div className="flex flex-col">
                        <h3 className="text-[17px] font-bold text-[#1E1B22] leading-tight group-hover:text-[#5B4296] transition-colors">
                          {model.name}
                        </h3>
                        <p className="text-[13.5px] text-[#6B7280] font-normal mt-0.5">
                          {model.developer}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[13px] text-[#374151] font-medium">
                          <span>📚</span>
                          <span>{model.codesCount} Cheat Codes</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Custom Navigation Arrow (>|) */}
                    <div className="pl-2 flex-shrink-0">
                      <ModelNavArrow />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* AI Prompt Library PRO Card (Bottom Section) - Hidden when no search results */}
          {filteredModels.length > 0 && (
            <section 
              id="pro-pass-card"
              className="w-full bg-[#F5EFFB] rounded-[28px] border border-[#E8DEF2] shadow-2xs overflow-hidden transition-all duration-200 mt-4"
            >
              {/* Top Header Row (Clickable to collapse/expand) */}
              <div 
                id="pro-header-row"
                onClick={() => setIsProExpanded(!isProExpanded)}
                className="p-5 sm:p-6 flex items-start justify-between cursor-pointer hover:bg-[#EFE7F7] transition-colors select-none"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px]">💎</span>
                    <h3 className="text-[18px] sm:text-[20px] font-bold text-[#1E1B22] tracking-tight">
                      AI Prompt Library PRO
                    </h3>
                    {hasUnlockedPro && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-[#6B7280] font-normal pl-6.5">
                    {hasUnlockedPro 
                      ? 'Your account has full lifetime access.' 
                      : 'One-time Purchase • Lifetime Access'}
                  </p>
                </div>

                {/* Triangle Collapse/Expand Indicator (from Screenshot 2) */}
                <button 
                  id="pro-triangle-btn"
                  aria-label="Toggle PRO section"
                  className="pt-1 text-[#9CA3AF] hover:text-[#1E1B22] transition-colors"
                >
                  <TriangleToggle isExpanded={isProExpanded} />
                </button>
              </div>

              {/* Collapsible Content */}
              {isProExpanded && (
                <div className="px-5 sm:px-6 pb-6 pt-0 border-t border-[#E8DEF2]">
                  {/* Body Headline & Description */}
                  <div className="pt-4">
                    <h4 className="text-[16px] sm:text-[17px] font-bold text-[#1E1B22] flex items-center gap-1.5">
                      <span>✨</span> {hasUnlockedPro ? 'AI Prompt Library PRO • Unlocked' : 'Unlock AI Prompt Library PRO'}
                    </h4>
                    <p className="text-[14px] sm:text-[15px] text-[#4B5563] mt-1 leading-relaxed">
                      {hasUnlockedPro 
                        ? 'Your account has full lifetime access. Explore the exclusive premium collections below.' 
                        : 'Unlock exclusive premium prompt collections for creators, developers and professionals.'}
                    </p>
                  </div>

                  {/* Feature Checklist in responsive columns */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-y-2.5 sm:gap-x-6 text-[14.5px] text-[#26232D] font-medium">
                    <div className="flex items-center gap-2">
                      <span>🚀</span>
                      <span>Business Startup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💻</span>
                      <span>Coding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📈</span>
                      <span>Marketing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎨</span>
                      <span>Design</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>Writing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🤖</span>
                      <span>AI Agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📚</span>
                      <span>Research</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎬</span>
                      <span>YouTube</span>
                    </div>
                    <div className="sm:col-span-2 pt-1 text-[#6B7280] font-normal text-[13.5px]">
                      + 8 More Engineering & Leadership Collections
                    </div>
                  </div>

                  {/* Action Section based on PRO status */}
                  <div className="mt-6">
                    {hasUnlockedPro ? (
                      /* For PRO Users (isPro === true): replace with verified badge */
                      <div className="space-y-2">
                        <div
                          id="home-pro-active-badge"
                          className="w-full bg-[#5B4296] text-white font-bold text-[14px] sm:text-[15px] py-4 px-6 rounded-full tracking-wide shadow-xs flex items-center justify-center gap-2 text-center select-none cursor-default"
                        >
                          <Check className="w-5 h-5 stroke-[3] text-emerald-300" />
                          <span>✓ PRO Lifetime Active</span>
                        </div>
                        <p className="text-[12.5px] text-center text-[#6B7280]">
                          Your account has full lifetime access.
                        </p>
                      </div>
                    ) : (
                      /* For Free / Logged-out Users: Direct Play Store purchase link */
                      <div className="space-y-3">
                        <button
                          id="pro-cta-button"
                          onClick={() => {
                            window.open('https://play.google.com/store/apps/details?id=com.aipromptlibrary.app', '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full bg-[#5B4296] hover:bg-[#4E3783] active:bg-[#432F73] text-white font-bold text-[14px] sm:text-[15px] py-4 px-6 rounded-full tracking-wide shadow-xs transition-all transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-center"
                        >
                          GET PRO • ₹599 LIFETIME
                        </button>
                        <p className="text-[12px] text-center text-[#6B7280] leading-relaxed">
                          PRO purchases are managed securely via Google Play. Once upgraded in the Android app, sign in here with the same Google account to instantly unlock PRO on Web &amp; Windows.
                        </p>
                        <div className="text-center pt-0.5">
                          <button
                            id="view-pro-screen-btn"
                            onClick={() => setShowProScreen(true)}
                            className="text-[12.5px] font-semibold text-[#654A9E] hover:text-[#4B3676] hover:underline cursor-pointer"
                          >
                            View Full PRO Features &amp; Details →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 2. PRO Collections Section (Rendered below PRO card strictly for PRO users) */}
          {hasUnlockedPro && filteredModels.length > 0 && (
            <section id="pro-collections-section" className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[20px] sm:text-[22px] font-extrabold text-[#1E1B22] tracking-tight flex items-center gap-2">
                    <span>💎</span>
                    <span>PRO Collections</span>
                  </h3>
                  <p className="text-[14px] text-[#6B7280] font-normal mt-0.5">
                    Exclusive premium prompt collections
                  </p>
                </div>
                <span className="bg-[#5B4296]/10 text-[#5B4296] text-[11.5px] font-bold px-3 py-1 rounded-full border border-[#5B4296]/20">
                  16 Collections
                </span>
              </div>

              {/* 16 Rounded Pill Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRO_COLLECTIONS.map((col) => (
                  <button
                    key={col.id}
                    id={`pro-collection-pill-${col.id}`}
                    onClick={() => handleDownload(col.pdf)}
                    className="group bg-[#F5EFFB] hover:bg-[#EFE5F8] active:bg-[#E8DCF4] border border-[#E8DEF2] hover:border-[#D5C3E5] rounded-2xl sm:rounded-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer"
                    title={`Download ${col.name} PDF`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl sm:text-2xl flex-shrink-0 w-7 flex items-center justify-center select-none">
                        {col.emoji}
                      </span>
                      <div className="truncate">
                        <p className="text-[14.5px] sm:text-[15px] font-bold text-[#1E1B22] group-hover:text-[#5B4296] transition-colors truncate">
                          {col.name}
                        </p>
                        <p className="text-[11.5px] text-[#6B7280] truncate">
                          {col.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 flex-shrink-0 text-[#6B7280] group-hover:text-[#5B4296]">
                      <span className="text-[10.5px] font-bold bg-white/90 px-2 py-0.5 rounded-full border border-[#E0D3EC]">
                        PDF
                      </span>
                      <Download className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      )}

      {/* Collection Cheat Codes Sheet Modal - Dynamically loads Android JSONs */}
      {selectedCollection && activeModel && (
        <PromptCollectionSheet
          activeModel={activeModel}
          selectedCollection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
          onOpenProCheckout={() => {
            setSelectedCollection(null);
            setShowProScreen(true);
          }}
        />
      )}


      {/* Clean Temporary Toast Notification Badge for Coming Soon Models */}
      {toastMessage && (
        <div 
          id="toast-coming-soon"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2D2438] text-white text-[13.5px] font-medium py-3 px-5 rounded-full shadow-xl border border-[#483B59] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
