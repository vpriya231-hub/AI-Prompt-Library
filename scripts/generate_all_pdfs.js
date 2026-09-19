import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PRO_COLLECTIONS_DATA = [
  {
    filename: 'business_startup.pdf',
    title: 'Business Startup',
    emoji: '🚀',
    subtitle: 'Ideation, Strategy, GTM, Financial Modeling, Scaling & Governance',
    sections: [
      {
        sectionTitle: 'Ideation & Strategy',
        prompts: [
          { title: '1. Startup Idea Validation & Critique', text: 'Act as a seasoned venture capitalist. I am planning to launch [Insert Startup Idea]. Give me a brutal, 360-degree critique of this concept. Identify top 3 market risks, barriers to entry, and actionable mitigation steps.' },
          { title: '2. Comprehensive Competitor Analysis', text: 'Act as a market intelligence expert. My startup operates in [Insert Industry]. Identify my top 3 competitors and build a comparison matrix highlighting gaps we can exploit.' },
          { title: '3. Unique Value Proposition (UVP) Generation', text: 'Act as an expert brand strategist. Generate 5 distinct UVPs focusing on customer pain points and clear differentiation.' },
          { title: '4. Target Audience & Buyer Persona Design', text: 'Act as a consumer behavior analyst. Create 3 hyper-detailed buyer personas including demographics, daily frustrations, purchasing triggers, and social media habits.' },
          { title: '5. Lean Canvas Business Model', text: 'Generate a complete Lean Canvas for my startup idea: [Insert Idea]. Include Problem, Solution, Key Metrics, UVP, Unfair Advantage, Channels, Customer Segments, Cost Structure, and Revenue Streams.' },
          { title: '6. Revenue Stream Brainstorming', text: 'Act as a financial strategist. Brainstorm 7 unconventional but highly profitable revenue streams without significantly increasing overhead.' },
          { title: '7. Pricing Strategy Development', text: 'Act as a pricing psychology expert. Suggest 3 pricing models (subscription, tiered, value-based) with psychological framing.' },
          { title: '8. Pivot Strategy Generation', text: 'Act as a turnaround CEO. Suggest 3 viable pivot strategies to transition existing assets into new high-growth directions.' }
        ]
      },
      {
        sectionTitle: 'Marketing, Sales & Operations',
        prompts: [
          { title: '9. 90-Day Go-To-Market (GTM) Plan', text: 'Act as a CMO. Create a week-by-week 90-day GTM roadmap including teaser campaigns, launch activities, and retention tactics.' },
          { title: '10. B2B Cold Outbound Sequence', text: 'Write a 3-step high-converting cold email sequence for B2B decision makers under 100 words per email.' },
          { title: '11. Objection Handling Playbook', text: 'Create an objection-handling matrix for sales teams detailing scripts for overcoming price, timing, and competitor objections.' },
          { title: '12. Standard Operating Procedures (SOP) Engine', text: 'Create an operational SOP template for onboarding clients, publishing content, and handling refunds with QA checklists.' },
          { title: '13. Pitch Deck Slide-by-Slide Outline', text: 'Provide a 12-slide pitch deck structure for angel investors with data requirements and core narrative arcs.' },
          { title: '14. Unit Economics & Burn Rate Optimization', text: 'Build a unit economics model calculating CAC, LTV, LTV:CAC ratios, payback periods, and 6-month runway extensions.' }
        ]
      }
    ]
  },
  {
    filename: 'coding.pdf',
    title: 'Coding & Architecture',
    emoji: '💻',
    subtitle: 'System Design, Microservices, Security, Performance & Clean Code',
    sections: [
      {
        sectionTitle: 'System Architecture & Setup',
        prompts: [
          { title: '1. Scalable Project Boilerplate Generation', text: 'Act as a Senior Software Architect. Generate a production-ready, highly scalable directory structure and architecture guidelines for [Insert Tech Stack].' },
          { title: '2. Microservices vs Monolith Decision Framework', text: 'Compare monolithic vs microservices tradeoffs covering deployment complexity, database sharing rules, and inter-service latency.' },
          { title: '3. Serverless Backend Architecture Blueprint', text: 'Design a serverless backend addressing cold starts, database connection pooling, state persistence, and webhook reliability.' },
          { title: '4. Authentication & RBAC Flow Design', text: 'Design an enterprise RBAC and token architecture with secure storage, refresh token rotation, and middleware authorization.' }
        ]
      },
      {
        sectionTitle: 'Performance, Security & APIs',
        prompts: [
          { title: '5. Complex SQL Query Optimization', text: 'Rewrite slow queries using EXPLAIN ANALYZE, composite indexes, CTEs, and eliminating table scans.' },
          { title: '6. Real-Time WebSockets Architecture', text: 'Design scalable real-time WebSocket connection pools with Redis pub/sub adapters, heartbeats, and reconnection handling.' },
          { title: '7. OWASP Top 10 Security Hardening', text: 'Provide strict mitigation for SQLi, XSS, SSRF, and BOLA/IDOR vulnerabilities in enterprise APIs.' },
          { title: '8. Distributed Caching & Invalidation', text: 'Implement cache-aside, write-through, probabilistic early expiration (XFetch), and CDC-based invalidation.' }
        ]
      }
    ]
  },
  {
    filename: 'marketing.pdf',
    title: 'Digital Marketing & Growth',
    emoji: '📈',
    subtitle: 'SEO, Paid Acquisition, Viral Hooks, Copywriting & Analytics',
    sections: [
      {
        sectionTitle: 'SEO & Performance Marketing',
        prompts: [
          { title: '1. Comprehensive SEO Content Audit', text: 'Outline a step-by-step framework to identify decaying content, analyze bounce/backlink signals, and optimize domain authority.' },
          { title: '2. High-Converting PPC Ad Copy Matrix', text: 'Generate a 3x3 ad copy matrix targeting pain, benefit, and urgency with sitelink extensions.' },
          { title: '3. Programmatic SEO Engine Blueprint', text: 'Design dynamic URL slug architectures, database schemas, and unique content variables to rank 1,000+ niche pages.' },
          { title: '4. Full-Funnel Retargeting Strategy', text: 'Design a 14-day multi-channel retargeting campaign with segmented discount incentives and social proof.' }
        ]
      },
      {
        sectionTitle: 'Copywriting & Lifecycle',
        prompts: [
          { title: '5. Email Welcome Sequence for New Leads', text: 'Draft an automated 5-part welcome email sequence maximizing open rates, founder storytelling, and product conversion.' },
          { title: '6. High-Converting Landing Page Wireframe', text: 'Design an above-the-fold hero section, psychological CTA buttons, and social proof trust layers.' },
          { title: '7. Customer Churn Win-Back Campaign', text: 'Create an automated 3-step re-engagement sequence addressing user friction and delivering irresistible incentives.' },
          { title: '8. Influencer Outreach Brief & SOP', text: 'Develop an authentic influencer pitch script, creative guidelines, and FTC compliance tracking.' }
        ]
      }
    ]
  },
  {
    filename: 'design.pdf',
    title: 'Design & UI/UX Systems',
    emoji: '🎨',
    subtitle: 'Design Systems, Figma Ops, Accessibility, Mobile UX & Spatial Computing',
    sections: [
      {
        sectionTitle: 'Brand & Graphic Design',
        prompts: [
          { title: '1. Brand Identity System Creation', text: 'Develop primary and secondary color palettes, font pairings, visual motifs, and packaging design rules.' },
          { title: '2. Typography Pairing & Optical Scaling', text: 'Establish modular typography hierarchies, leading/kerning standards, and responsive scale ratios.' },
          { title: '3. Premium Packaging Design Concepts', text: 'Create sustainable, luxury unboxing experiences with structural dielines and sensory touchpoints.' }
        ]
      },
      {
        sectionTitle: 'UI/UX & Design Systems',
        prompts: [
          { title: '4. Design System Token Architecture', text: 'Structure Figma variables and CSS tokens across Global, Semantic, and Component tiers for dark/light modes.' },
          { title: '5. Mobile App Frictionless Onboarding', text: 'Design progressive disclosure onboarding flows that maximize Day-1 activation and permission acceptance.' },
          { title: '6. WCAG 2.1 AA Accessibility Audit', text: 'Ensure contrast ratios, keyboard focus states, screen reader ARIA labels, and color-independent status signals.' },
          { title: '7. Micro-Interactions & Motion Choreography', text: 'Design cubic-bezier easing curves, tactile button states, skeleton loaders, and pull-to-refresh delights.' }
        ]
      }
    ]
  },
  {
    filename: 'writing.pdf',
    title: 'Writing & Storytelling',
    emoji: '📝',
    subtitle: 'Creative Fiction, Direct Response Copy, Scriptwriting & Thought Leadership',
    sections: [
      {
        sectionTitle: 'Storytelling & Fiction',
        prompts: [
          { title: '1. Epic World-Building Bible', text: 'Outline magic system hard rules, geopolitical factions, flora/fauna, and historical cataclysms.' },
          { title: '2. Complex Flawed Character Arc', text: 'Create a protagonist with deep internal wounds, the lie they believe, and a 4-act transformative redemption.' },
          { title: '3. Psychological Thriller Plot Twist', text: 'Design a 10-chapter clue-dropping schedule with multi-layered misdirections and an earned climax twist.' }
        ]
      },
      {
        sectionTitle: 'Direct Response & Executive Copy',
        prompts: [
          { title: '4. High-Ticket Sales Page (PAS)', text: 'Write a long-form sales page agitating emotional pain points and transitioning smoothly into the solution.' },
          { title: '5. Viral Social Media Hooks', text: 'Generate 10 contrarian and curiosity-inducing opening hooks for high-engagement technical and business threads.' },
          { title: '6. Executive Ghostwritten Article', text: 'Craft an authoritative 800-word thought leadership piece with punchy prose and high-signal takeaways.' }
        ]
      }
    ]
  },
  {
    filename: 'ai_agents.pdf',
    title: 'AI Agents & Autonomous Swarms',
    emoji: '🤖',
    subtitle: 'Multi-Agent Topologies, Reflection Loops, Memory & Enterprise Swarms',
    sections: [
      {
        sectionTitle: 'Agent Architecture & Frameworks',
        prompts: [
          { title: '1. Autonomous Startup Team Swarm', text: 'Design an autonomous team (PM, Engineer, QA, DevOps) collaborating via message brokers with human-in-the-loop gates.' },
          { title: '2. Self-Healing Code Execution Loop', text: 'Build an automated loop executing code in Docker sandboxes, parsing stack traces, and iteratively fixing bugs.' },
          { title: '3. Hierarchical Task Delegation Engine', text: 'Implement an orchestrator decomposing complex user goals into sub-agent graphs with state-machine checkpoints.' },
          { title: '4. Long-Term Memory & Vector Hybrid Store', text: 'Combine episodic vector memory, semantic knowledge graphs, and sliding working memory for long tasks.' }
        ]
      },
      {
        sectionTitle: 'Security, Guardrails & FinOps',
        prompts: [
          { title: '5. Semantic Firewall & Injection Shield', text: 'Sanitize incoming payloads, detect indirect prompt injections, and enforce strict tool execution boundaries.' },
          { title: '6. Agentic Infinite Loop Breakers', text: 'Detect circular reasoning and tool failures in real time, forcing strategic pivots or fallback procedures.' },
          { title: '7. Multi-Agent Consensus & Debate Protocol', text: 'Implement 3 divergent persona agents debating high-stakes decisions with an arbiter judge agent.' }
        ]
      }
    ]
  },
  {
    filename: 'research.pdf',
    title: 'Deep Research & Analysis',
    emoji: '📚',
    subtitle: 'Market Intelligence, Macroeconomics, Frontier Tech & Scientific Synthesis',
    sections: [
      {
        sectionTitle: 'Market & Competitive Intelligence',
        prompts: [
          { title: '1. Market Gap & Competitor Spy Research', text: 'Analyze direct/indirect rivals, regulatory hurdles, consumer sentiment, and white-space entry strategies.' },
          { title: '2. Multi-Source Fact-Checking Protocol', text: 'Execute triangulation across academic, governmental, and industry sources with empirical probability scoring.' },
          { title: '3. 10-Year Technology Trend Forecaster', text: 'Map technological inflection points, material bottlenecks, active research labs, and commercial tipping points.' }
        ]
      },
      {
        sectionTitle: 'Quantitative & Frontier Scoping',
        prompts: [
          { title: '4. Venture Capital Due Diligence Audit', text: 'Assess technical defensibility, proprietary moats, TAM/SAM/SOM sizing, and fatal execution risks.' },
          { title: '5. Complex Root Cause Analysis (RCA)', text: 'Construct Ishikawa fishbone diagrams across People, Process, and Tech with deep 5-Whys drill-down.' },
          { title: '6. Systematic PRISMA Literature Review', text: 'Establish rigorous inclusion criteria, query strings across Scopus/PubMed, and evidence synthesis matrices.' }
        ]
      }
    ]
  },
  {
    filename: 'youtube.pdf',
    title: 'YouTube & Creator Economy',
    emoji: '🎬',
    subtitle: 'Algorithm Reverse-Engineering, High-CTR Thumbnails, Retention & Business',
    sections: [
      {
        sectionTitle: 'Algorithm & Packaging',
        prompts: [
          { title: '1. YouTube Algorithm Reverse-Engineering', text: 'Optimize the CTR vs AVD tipping points required to trigger viral browse and suggested video traffic waves.' },
          { title: '2. High-CTR Thumbnail & Title Psychology', text: 'Design 5 thumbnail concepts and paired titles using curiosity gaps, emotional triggers, and visual contrast.' },
          { title: '3. First 30-Second Retention Hook', text: 'Apply pattern interrupts, open loops, and visual cues in the opening moments to eliminate viewer drop-off.' }
        ]
      },
      {
        sectionTitle: 'Production & Monetization',
        prompts: [
          { title: '4. Documentary-Style Video Essay Script', text: 'Write a 5-act narrative essay structure: Inciting Anomaly, Rabbit Hole, Confrontation, Paradigm Shift, Conclusion.' },
          { title: '5. High-Converting In-Video Sponsor Read', text: 'Craft a seamless 60-second integration that delivers viewer value while driving sponsor conversions.' },
          { title: '6. Automated Faceless Channel Pipeline', text: 'Orchestrate research, AI scriptwriting, voice cloning, and B-roll video assembly into a scalable workflow.' }
        ]
      }
    ]
  },
  {
    filename: 'devops_cloud.pdf',
    title: 'DevOps & Cloud Prompts',
    emoji: '☁️',
    subtitle: 'AWS, Kubernetes, Terraform, Docker, CI/CD, Observability & SRE',
    sections: [
      {
        sectionTitle: 'Cloud Architecture & Infrastructure as Code',
        prompts: [
          { title: '1. Multi-Region Serverless Architecture', text: 'Design an Active-Active AWS architecture using Route 53, API Gateway, Lambda, and DynamoDB Global Tables with Terraform.' },
          { title: '2. Transit Gateway Hub-and-Spoke Topology', text: 'Connect Production, Dev VPCs, and On-Premises data centers via Site-to-Site VPN with explicit route tables.' },
          { title: '3. Multi-Stage Distroless Dockerfile', text: 'Write a secure container build using distroless bases, non-root users, and optimized layer caching.' },
          { title: '4. Kubernetes Pod Anti-Affinity & PDB', text: 'Configure high-availability deployments spread across AZs with PodDisruptionBudgets and node affinities.' }
        ]
      },
      {
        sectionTitle: 'CI/CD & Observability',
        prompts: [
          { title: '5. ArgoCD GitOps & Cluster Bootstrapping', text: 'Implement declarative GitOps syncing application repos to Kubernetes with self-healing reconciliation.' },
          { title: '6. Distributed Tracing with OpenTelemetry', text: 'Set up OTel collectors to export traces and metrics to Jaeger and CloudWatch with W3C context propagation.' },
          { title: '7. Production Outage Incident Playbook', text: 'Establish Sev-1 triage procedures, automated rollbacks, and blameless post-mortem templates.' }
        ]
      }
    ]
  },
  {
    filename: 'cybersecurity_ethical_hacking.pdf',
    title: 'Cybersecurity & Ethical Hacking',
    emoji: '🛡️',
    subtitle: 'Vulnerability Assessment, Pentesting, OWASP Top 10, Red Teaming & Cloud Security',
    sections: [
      {
        sectionTitle: 'AppSec & Network Testing',
        prompts: [
          { title: '1. SQL Injection (SQLi) Audit & Prepared Statements', text: 'Detect and remediate classic, blind, and time-based SQLi with secure ORM configurations.' },
          { title: '2. Server-Side Request Forgery (SSRF) Hardening', text: 'Prevent IMDS metadata exfiltration using DNS validation, private IP blocks, and IMDSv2 enforcement.' },
          { title: '3. BOLA / IDOR Authorization Engine', text: 'Design Attribute-Based Access Control (ABAC) to verify resource ownership on every API endpoint.' },
          { title: '4. Active Directory Kerberoasting Mitigation', text: 'Audit SPNs with weak passwords, deploy Group Managed Service Accounts (gMSA), and monitor Event ID 4769.' }
        ]
      },
      {
        sectionTitle: 'Red Teaming & Cloud Defense',
        prompts: [
          { title: '5. Zero-Trust Network Architecture (ZTNA)', text: 'Replace perimeter VPNs with identity-aware proxies, device health checks, and micro-segmentation.' },
          { title: '6. Kubernetes Admission Webhook Security', text: 'Block privileged containers, enforce read-only root filesystems, and detect container breakouts.' },
          { title: '7. Ransomware Containment Incident Playbook', text: 'Execute network isolation, credential revocation, memory dump forensics, and clean recovery.' }
        ]
      }
    ]
  },
  {
    filename: 'sql_database_optimization.pdf',
    title: 'SQL & Database Optimization',
    emoji: '🗄️',
    subtitle: 'Query Tuning, Schema Design, Indexing, Sharding & High Availability',
    sections: [
      {
        sectionTitle: 'Query Tuning & Indexing',
        prompts: [
          { title: '1. Deep Execution Plan Analysis (EXPLAIN ANALYZE)', text: 'Diagnose sequential scans, nested loop spills, buffer misses, and cardinality misestimations.' },
          { title: '2. Composite Indexing & Leftmost Prefix Rule', text: 'Order columns for equality vs range conditions to maximize index traversal efficiency.' },
          { title: '3. Eliminating Non-SARGable Anti-Patterns', text: 'Refactor functions on indexed columns, implicit type casting, and wildcards into SARGable queries.' },
          { title: '4. Pagination Optimization: Keyset vs Offset', text: 'Replace O(N) OFFSET queries with deterministic keyset/cursor pagination for multi-million row tables.' }
        ]
      },
      {
        sectionTitle: 'Schema Design & Scale',
        prompts: [
          { title: '5. PostgreSQL Declarative Table Partitioning', text: 'Implement Range, List, and Hash partitioning with automated sub-partition management via pg_partman.' },
          { title: '6. High-Concurrency Queue Tables (SKIP LOCKED)', text: 'Build zero-contention task queues using SELECT ... FOR UPDATE SKIP LOCKED across parallel workers.' },
          { title: '7. Zero-Downtime Database Schema Migration', text: 'Execute Expand-and-Contract patterns, dual-writing, asynchronous backfills, and online cutovers.' }
        ]
      }
    ]
  },
  {
    filename: 'api_development_integration.pdf',
    title: 'API Development & Integration',
    emoji: '🔌',
    subtitle: 'RESTful Architecture, GraphQL, Webhooks, gRPC & Distributed Systems',
    sections: [
      {
        sectionTitle: 'REST & GraphQL Architecture',
        prompts: [
          { title: '1. Richardson Maturity Model & Level 3 HATEOAS', text: 'Design hypermedia-driven APIs returning dynamic transition links based on resource state.' },
          { title: '2. Distributed Idempotency Framework', text: 'Intercept Idempotency-Key headers, lock in-flight requests, and cache response payloads with Redis.' },
          { title: '3. Solving N+1 in GraphQL with DataLoader', text: 'Batch and cache database queries across concurrent resolvers to eliminate N+1 latency.' },
          { title: '4. Rate Limiting via Sliding Window Counter', text: 'Implement Redis Lua scripts enforcing per-minute request quotas with standard retry headers.' }
        ]
      },
      {
        sectionTitle: 'Webhooks & High-Performance RPC',
        prompts: [
          { title: '5. Cryptographic Webhook Signatures (HMAC-SHA256)', text: 'Sign payloads with shared secrets, embed timestamp headers, and verify signatures with constant-time equality.' },
          { title: '6. Webhook Fan-Out & Dead Letter Queue (DLQ)', text: 'Handle 100k events/min with event brokers, auto-scaling workers, and automated DLQ retry policies.' },
          { title: '7. High-Performance gRPC Microservices', text: 'Implement Protocol Buffers proto3, bidirectional streaming, and interceptor-based tracing.' }
        ]
      }
    ]
  },
  {
    filename: 'resume_cover_letter.pdf',
    title: 'Resume & Cover Letter Building',
    emoji: '📄',
    subtitle: 'ATS Optimization, Executive Summaries, Google X-Y-Z Bullets & Pitching',
    sections: [
      {
        sectionTitle: 'ATS Resumes & Bullet Point Engineering',
        prompts: [
          { title: '1. ATS-Proof Resume Optimization Engine', text: 'Execute keyword gap analysis against target Job Descriptions, formatting into single-column clean markdown.' },
          { title: '2. Google X-Y-Z Formula Bullet Point Refactoring', text: 'Transform passive duties into: Accomplished [X], as measured by [Y], by doing [Z] with quantified metrics.' },
          { title: '3. Senior Cloud & DevOps Resume Overhaul', text: 'Highlight production Kubernetes, AWS architecture, Terraform, and zero-downtime deployment metrics.' },
          { title: '4. Framing Career Transitions & Self-Taught Portfolios', text: 'Showcase real-world architectures, GitHub codebases, and transferable problem-solving competencies.' }
        ]
      },
      {
        sectionTitle: 'Cover Letters & High-Stakes Negotiation',
        prompts: [
          { title: '5. T-Shaped Pain-Point Cover Letter', text: 'Open by addressing the company\'s biggest technical hurdle and pitching your exact background as the fix.' },
          { title: '6. 2-Column Competency Match Template', text: 'Present a structured \'What You Need\' vs \'What I Bring\' comparison table directly answering requirements.' },
          { title: '7. Multi-Variable Salary Negotiation Script', text: 'Negotiate base salary, signing bonuses, and equity grants with data-backed counter-offers.' }
        ]
      }
    ]
  },
  {
    filename: 'job_interview_preparation.pdf',
    title: 'Job Interview Preparation & Mocks',
    emoji: '🎤',
    subtitle: 'Live Mock Roleplay, System Design, Behavioral STAR & Technical Screens',
    sections: [
      {
        sectionTitle: 'System Design & Technical Mocks',
        prompts: [
          { title: '1. Senior Backend System Design Interview', text: 'Interactive mock session: Design a globally distributed URL shortener handling 1M reads/sec with follow-ups.' },
          { title: '2. DevOps & SRE Production Incident Roleplay', text: 'Troubleshoot live latency spikes on AWS EKS using simulated terminal outputs and root cause analysis.' },
          { title: '3. Algorithmic Hard-Level Coding Interview', text: 'Step-by-step guidance through DP/Graph challenges, optimizing from brute force to linear time.' }
        ]
      },
      {
        sectionTitle: 'Behavioral & Leadership Rounds',
        prompts: [
          { title: '4. The Ultimate STAR Method Story Vault', text: 'Structure personal experiences into 5 universal STAR stories adapting to 80% of behavioral questions.' },
          { title: '5. Disagree and Commit with Senior Leadership', text: 'Demonstrate professional humility, data-driven debate, and unified execution behind final decisions.' },
          { title: '6. Handling Critical Interview Pushback', text: 'Stress-test your composure when interviewers challenge your architectural decisions.' }
        ]
      }
    ]
  },
  {
    filename: 'time_management_productivity.pdf',
    title: 'Time Management & Productivity',
    emoji: '⏱️',
    subtitle: 'Deep Work, Pomodoro, GTD, Second Brain & Anti-Burnout Protocols',
    sections: [
      {
        sectionTitle: 'Deep Work & Time-Blocking',
        prompts: [
          { title: '1. Cal Newport Deep Work Schedule Architecture', text: 'Design 4 hours of uninterrupted daily deep work with morning priming and evening shutdown rituals.' },
          { title: '2. Day Theming for Multi-Disciplinary Creators', text: 'Assign dedicated focus themes to each weekday with strict boundaries against task contamination.' },
          { title: '3. Ultradian Rhythm & Energy Peak Mapping', text: 'Schedule 90-minute focus sprints aligned with natural cortisol peaks and active recovery intervals.' }
        ]
      },
      {
        sectionTitle: 'GTD, Second Brain & Flow State',
        prompts: [
          { title: '4. Comprehensive GTD 2-Hour Mind Sweep', text: 'Extract every open task loop using 20 cognitive triggers into a unified capture inbox.' },
          { title: '5. Building a Second Brain (PARA Method)', text: 'Organize digital notes across Projects, Areas, Resources, and Archives with progressive summarization.' },
          { title: '6. Dopamine Baseline Reset & Fasting Protocol', text: 'Eliminate digital hyper-stimulation, restore dopamine receptors, and rebuild sustained deep focus.' }
        ]
      }
    ]
  },
  {
    filename: 'meeting_summaries_action_items.pdf',
    title: 'Meeting Summaries & Action Items',
    emoji: '📝',
    subtitle: 'Executive Briefings, Board Syncs, Engineering Standups & RACI Trackers',
    sections: [
      {
        sectionTitle: 'Executive & Strategy Meetings',
        prompts: [
          { title: '1. Board of Directors Strategic Sync Summary', text: 'Transform raw transcripts into formal summaries: Resolutions Passed, Capital Allocation, and Action Matrix.' },
          { title: '2. C-Suite Weekly Alignment Memo', text: 'Generate Amazon-style 1-page executive briefings with strategic wins, bottlenecks, and single-owner priorities.' },
          { title: '3. M&A Technical & Financial Due Diligence', text: 'Extract valuation assumptions, identified technical debt, integration risks, and escalation matrices.' }
        ]
      },
      {
        sectionTitle: 'Engineering Standups & Incident War Rooms',
        prompts: [
          { title: '4. Daily Engineering Standup Aggregator', text: 'Summarize PRs shipped, current sprint blockers, high-risk in-flight code, and Jira ticket updates.' },
          { title: '5. Severity-1 Outage Triage & Incident War Room', text: 'Create minute-by-minute incident logs with symptoms, hypotheses tested, mitigations, and hotfix assignments.' },
          { title: '6. Blameless Post-Mortem & 5-Whys Analysis', text: 'Structure root-cause investigations, preventive engineering tickets, and systemic architecture upgrades.' }
        ]
      }
    ]
  }
];

async function generatePDF(collection) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Helper to add a page
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();
  let y = height - 50;

  // Header Banner
  page.drawRectangle({
    x: 35,
    y: height - 110,
    width: width - 70,
    height: 75,
    color: rgb(0.357, 0.259, 0.588), // #5B4296
  });

  // Header Text
  page.drawText('AI PROMPT LIBRARY PRO', {
    x: 55,
    y: height - 60,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.78, 0.95),
  });

  page.drawText(`${collection.title}`, {
    x: 55,
    y: height - 85,
    size: 19,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`${collection.subtitle}`, {
    x: 55,
    y: height - 102,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.92, 0.88, 0.98),
  });

  y = height - 135;

  // Helper for text wrapping
  function drawWrappedText(text, x, startY, maxWidth, font, size, color, lineHeight = size * 1.35) {
    const words = text.split(' ');
    let line = '';
    let currentY = startY;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line !== '') {
        page.drawText(line, { x, y: currentY, size, font, color });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
    }
    return currentY;
  }

  // Iterate sections and prompts
  for (const section of collection.sections) {
    if (y < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }

    // Section title
    page.drawRectangle({
      x: 35,
      y: y - 5,
      width: width - 70,
      height: 22,
      color: rgb(0.94, 0.92, 0.97),
    });

    page.drawText(section.sectionTitle.toUpperCase(), {
      x: 45,
      y: y + 2,
      size: 10,
      font: fontBold,
      color: rgb(0.357, 0.259, 0.588),
    });

    y -= 30;

    for (const prompt of section.prompts) {
      if (y < 95) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
      }

      // Prompt Title
      page.drawText(prompt.title, {
        x: 45,
        y: y,
        size: 11,
        font: fontBold,
        color: rgb(0.12, 0.11, 0.14),
      });
      y -= 15;

      // Prompt body
      y = drawWrappedText(
        prompt.text,
        45,
        y,
        width - 90,
        fontRegular,
        9.5,
        rgb(0.25, 0.25, 0.28),
        13
      );

      y -= 12; // Spacing between prompts
    }

    y -= 10;
  }

  // Footer on each page
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    p.drawText(`AI Prompt Library PRO • Page ${i + 1} of ${pages.length} • Lifetime Access Edition`, {
      x: 45,
      y: 25,
      size: 8,
      font: fontRegular,
      color: rgb(0.55, 0.55, 0.6),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const destPath = path.join(process.cwd(), 'public', 'assets', collection.filename);
  fs.writeFileSync(destPath, pdfBytes);
  console.log(`Generated: ${destPath}`);
}

async function run() {
  fs.mkdirSync(path.join(process.cwd(), 'public', 'assets'), { recursive: true });
  for (const item of PRO_COLLECTIONS_DATA) {
    await generatePDF(item);
  }
  console.log('All 16 PDFs generated successfully!');
}

run().catch(console.error);
