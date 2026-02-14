HLD (High-Level Design)
High-Level Design Document
System: Subtext 2.1 Forensic Intelligence Platform
Version: 2.1.0
Date: February 2026
Owner: Engineering Team
Status: Design Phase

1. System Overview
1.1 Architecture Philosophy
Core Principles:

Zero-Knowledge First: System mathematically cannot access user identifiable data
Client-Heavy: Maximum processing on client-side (encryption, PII detection, decryption)
Stateless Analysis: AI agents have no memory between sessions
Ephemeral Storage: User data deleted immediately after processing
Horizontal Scalability: Stateless design enables infinite scaling

1.2 System Capabilities
Functional Requirements:

Ingest multi-format conversation data (screenshots, text exports, mixed media)
Parse and normalize timestamps across sources
Detect and mask Personally Identifiable Information (PII)
Perform multi-agent AI analysis with verification
Generate 30-page forensic report with visualizations
Deliver encrypted report for client-side decryption
Process 1,000 reports/day capacity

Non-Functional Requirements:

Performance: <20 minute end-to-end processing time
Availability: 99.5% uptime SLA
Security: SOC 2 Type II compliant (future), zero-knowledge architecture
Scalability: Handle 10,000 concurrent users
Privacy: GDPR/CCPA compliant, right to deletion


2. System Architecture
2.1 High-Level Architecture Diagram
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER (Browser)                        │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │   Upload UI    │  │  PII Detector   │  │ Report Decryption  │  │
│  │                │  │   (WASM NER)    │  │    (AES-256)       │  │
│  │ - File Select  │  │ - Name Masking  │  │ - Identity Map     │  │
│  │ - Drag & Drop  │  │ - Entity Token  │  │ - Re-hydrate PDF   │  │
│  │ - Preview      │  │ - Key Generate  │  │ - Local Storage    │  │
│  └────────────────┘  └─────────────────┘  └────────────────────┘  │
│           │                    │                        ▲             │
│           │                    │                        │             │
│           ▼                    ▼                        │             │
│     ┌──────────────────────────────────────────────┐   │             │
│     │         Encryption Layer (Client-Side)       │   │             │
│     │  - Generate Session Key (256-bit random)     │   │             │
│     │  - Encrypt Identity Map (AES-256-GCM)        │   │             │
│     │  - Store Key Locally (IndexedDB)             │   │             │
│     └──────────────────────────────────────────────┘   │             │
│                          │                              │             │
└──────────────────────────┼──────────────────────────────┼─────────────┘
                           │ HTTPS (TLS 1.3)              │
┌──────────────────────────▼──────────────────────────────┼─────────────┐
│                      API GATEWAY TIER                    │             │
│  ┌────────────────────────────────────────────────────┐ │             │
│  │         Load Balancer (AWS ALB / Cloudflare)       │ │             │
│  │  - TLS Termination                                 │ │             │
│  │  - Rate Limiting (100 req/min per IP)              │ │             │
│  │  - DDoS Protection                                 │ │             │
│  │  - Request Routing                                 │ │             │
│  └────────────────────────────────────────────────────┘ │             │
│                          │                              │             │
│  ┌────────────────────────────────────────────────────┐ │             │
│  │               API Server (Node.js/Python)          │ │             │
│  │  - Authentication (JWT)                            │ │             │
│  │  - Authorization                                   │ │             │
│  │  - Request Validation                              │ │             │
│  │  - Job Queueing (Redis)                            │ │             │
│  │  - Webhook Handling (Stripe)                       │ │             │
│  └────────────────────────────────────────────────────┘ │             │
└──────────────────────────┬──────────────────────────────┘             │
                           │                                            │
┌──────────────────────────▼──────────────────────────────────────────┐│
│                    PROCESSING TIER (Stateless)                      ││
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────────┐ ││
│  │   Ingestion  │  │    Timeline    │  │   Multi-Agent Council  │ ││
│  │   Pipeline   │  │    Stitcher    │  │                        │ ││
│  │              │  │                │  │  ┌──────────────────┐  │ ││
│  │ - OCR (AWS   │  │ - Timestamp    │  │  │  Scout Agent     │  │ ││
│  │   Textract)  │  │   Parsing      │  │  │  (Triage)        │  │ ││
│  │ - File Parse │  │ - Deduplication│  │  └──────────────────┘  │ ││
│  │ - Format     │  │ - Gap Analysis │  │                        │ ││
│  │   Normalize  │  │ - Chronological│  │  ┌──────────────────┐  │ ││
│  │              │  │   Sort         │  │  │ Clinician Agent  │  │ ││
│  └──────────────┘  └────────────────┘  │  │ (Gottman SPAFF)  │  │ ││
│         │                   │           │  └──────────────────┘  │ ││
│         │                   │           │                        │ ││
│         ▼                   ▼           │  ┌──────────────────┐  │ ││
│  ┌─────────────────────────────────┐   │  │ Pattern Matcher  │  │ ││
│  │   Ephemeral Storage (Redis)     │   │  │ (Systems Theory) │  │ ││
│  │  - Tokenized Conversation       │   │  └──────────────────┘  │ ││
│  │  - Session Metadata              │   │                        │ ││
│  │  - TTL: 24 hours (auto-delete)  │   │  ┌──────────────────┐  │ ││
│  └─────────────────────────────────┘   │  │ Historian Agent  │  │ ││
│                                         │  │ (Timeline)       │  │ ││
│                                         │  └──────────────────┘  │ ││
│                                         │                        │ ││
│                                         │  ┌──────────────────┐  │ ││
│                                         │  │ Forensic Auditor │  │ ││
│                                         │  │ (Verification)   │  │ ││
│                                         │  └──────────────────┘  │ ││
│                                         └────────────────────────┘ ││
│                                                      │              ││
└──────────────────────────────────────────────────────┼──────────────┘│
                                                       │               │
┌──────────────────────────────────────────────────────▼───────────────┼┐
│                    REPORT GENERATION TIER                            ││
│  ┌────────────────────────────────────────────────────────────────┐ ││
│  │                 Report Compiler (Python)                       │ ││
│  │  - Aggregate Agent Findings                                    │ ││
│  │  - Generate Visualizations (Charts, Timelines, Heatmaps)       │ ││
│  │  - Create PDF (WeasyPrint / Puppeteer)                         │ ││
│  │  - Generate Shareable Cards (ImageMagick)                      │ ││
│  └────────────────────────────────────────────────────────────────┘ ││
│                              │                                       ││
│  ┌────────────────────────────────────────────────────────────────┐ ││
│  │           Object Storage (AWS S3 / Cloudflare R2)              │ ││
│  │  - Tokenized Report PDF (with placeholders)                    │ ││
│  │  - Encrypted Identity Map                                      │ ││
│  │  - Shareable Card Images                                       │ ││
│  │  - TTL: 7 days, then auto-delete                               │ ││
│  └────────────────────────────────────────────────────────────────┘ ││
│                              │                                       ││
└──────────────────────────────┼───────────────────────────────────────┘│
                               │                                        │
                               └────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE TIER                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐│
│  │   PostgreSQL       │  │   Redis Cache      │  │  Clickhouse      ││
│  │  - User Accounts   │  │  - Session State   │  │  - Analytics     ││
│  │  - Payment Records │  │  - Job Queue       │  │  - Audit Logs    ││
│  │  - Case Metadata   │  │  - Rate Limiting   │  │  - Performance   ││
│  │  (NO Conversations)│  │  - Ephemeral Data  │  │  - Aggregations  ││
│  └────────────────────┘  └────────────────────┘  └──────────────────┘│
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES TIER                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐ │
│  │  Stripe API │  │  AWS Textract│  │ OpenAI API│  │ Anthropic API│ │
│  │  (Payments) │  │  (OCR)       │  │ (LLM)     │  │ (Claude)     │ │
│  └─────────────┘  └──────────────┘  └───────────┘  └──────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ SendGrid    │  │  Cloudflare  │  │ Sentry    │  │ PostHog      │ │
│  │ (Email)     │  │  (CDN/DDoS)  │  │ (Errors)  │  │ (Analytics)  │ │
│  └─────────────┘  └──────────────┘  └───────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────────────┘

2.2 Component Descriptions
Client Tier (Browser)
Upload UI Component:

Technology: React (Next.js)
Responsibilities:

File upload interface (drag & drop)
Preview uploaded content
Progress indicators
Error handling (file too large, unsupported format)


Constraints:

Maximum 500MB total upload
Supports: PNG, JPG, HEIC, TXT, ZIP, CSV, JSON



PII Detector (WASM Module):

Technology: WebAssembly (Rust compiled), spaCy NER model
Responsibilities:

Named Entity Recognition for names, locations
Regex patterns for phone numbers, emails, SSNs
Face detection in images (TensorFlow.js)
Replace with generic tokens ([Person A], [Location 1])
Generate Identity Map (original → token mapping)


Performance: <5 seconds for 100MB of text
Privacy: 100% client-side, zero server round-trips

Encryption Layer:

Technology: Web Crypto API (AES-256-GCM)
Responsibilities:

Generate 256-bit random encryption key
Encrypt Identity Map with key
Store key in IndexedDB (persistent across sessions)
Option to download encrypted key (backup)


Security: Key never leaves client, zero-knowledge achieved

Report Decryption Component:

Technology: React + Web Crypto API
Responsibilities:

Download tokenized report PDF + encrypted Identity Map
Retrieve encryption key from IndexedDB
Decrypt Identity Map
Use PDF.js to parse and re-hydrate placeholders
Render fully unredacted report in browser
Option to print or save locally


Performance: <3 seconds to decrypt and render

Tabbed Analysis Viewer:

Technology: React (Next.js)
Responsibilities:

Render 4 tabs: Analysis, Deep Analysis, MRI, Chat Recommender
Manage tab state and active tab selection
Track locked/unlocked status based on Pro purchase per conversation
Default tab: Analysis (free tier)

State Management:

Per-conversation Pro status determines tab accessibility
Deep Analysis, MRI, and Chat Recommender tabs locked until Pro purchased
Syncs with Conversation State Manager for unlock status

MRI Q&A Component:

Technology: React (Next.js)
Responsibilities:

Question input field for user queries
Answer display area with formatted AI responses
Q&A history list (scrollable, per conversation)
Track free query count (2 free queries included with Pro)
Show paywall after 2 free queries ($10/conversation for unlimited)

Billing: $10/conversation for unlimited MRI queries after 2 free with Pro

Chat Recommender Component:

Technology: React (Next.js)
Responsibilities:

Screenshot upload area (drag & drop or file select)
AI-generated recommendation display below screenshot
Recommendation history per conversation

Billing: Pay-per-use via Stripe metered billing

Conversation State Manager:

Technology: React (Zustand or Redux Toolkit)
Responsibilities:

Manage per-conversation Pro status (purchased or not)
Track MRI query counts (free remaining, unlimited purchased)
Track feature unlock states per conversation
Sync state with backend via REST API
Persist state across page reloads

State Shape:

Per-conversation: { pro_purchased, mri_queries_used, mri_unlimited, feature_locks }
Global: { active_conversation_id, conversations_list }


API Gateway Tier
Load Balancer:

Technology: AWS Application Load Balancer (ALB) or Cloudflare
Responsibilities:

TLS 1.3 termination
SSL certificate management (Let's Encrypt)
Request routing to API servers
Health checks (ping /health every 30s)
DDoS protection (Cloudflare)


Capacity: Handle 100,000 requests/hour
Redundancy: Multi-AZ deployment (AWS us-east-1, us-west-2)

API Server:

Technology: Node.js (Express) or Python (FastAPI)
Responsibilities:

JWT authentication (verify user tokens)
Request validation (schema checks)
Rate limiting (100 requests/minute per user)
Job queueing (push to Redis queue)
Webhook handling (Stripe payment confirmations)
Health monitoring (expose /health, /metrics endpoints)


Scaling: Horizontal (10-50 instances via Kubernetes)
State: Stateless (all state in Redis/PostgreSQL)


Processing Tier
Ingestion Pipeline:

Technology: Python (asyncio) + AWS Textract (OCR)
Responsibilities:

Accept tokenized uploads from client
Route by file type:

Images → AWS Textract OCR
Text files → Regex parsing
ZIP files → Extract and route contents


Normalize text encoding (UTF-8)
Extract metadata (timestamps, message structure)
Store in ephemeral Redis cache (24-hour TTL)


Performance: Process 100 images/minute
Cost: AWS Textract ~$1.50 per 1000 pages

Timeline Stitcher:

Technology: Python (Pandas for timestamp manipulation)
Responsibilities:

Parse timestamps from all sources:

EXIF data (images)
OCR text extraction (regex: ISO 8601, common formats)
File metadata (creation date as fallback)


Normalize timezone (convert to user's local time)
Merge duplicate messages (fuzzy matching)
Sort chronologically (ascending timestamp)
Detect gaps (>48 hour silence flagged)
Generate unified JSON structure


Performance: <60 seconds for 10,000 messages
Output: Chronological message stream JSON

Multi-Agent Council:
Architecture: Parallel processing, blind review, verification layer
Scout Agent (Triage):

Technology: OpenAI GPT-4 Turbo or Anthropic Claude Sonnet
Prompt Engineering:

  You are a triage specialist. Scan this conversation timeline and identify
  5-10 "Hot Zones" (critical episodes) that require deep analysis.
  
  Hot Zone criteria:
  - High message velocity (>20 messages/hour)
  - Aggressive language (caps, profanity, hostility)
  - Prolonged silence after conflict (>48 hours)
  - Emotional intensity (crying emoji, "I'm done", breakup language)
  
  Return: JSON array of {start_index, end_index, intensity_score, brief_summary}

Input: Full chronological message stream (up to 100k messages)
Output: List of 5-10 critical episodes with indices
Performance: 2-5 minutes for 50k messages
Cost: ~$2 per analysis (GPT-4 Turbo API)

Clinician Agent (Gottman Specialist):

Technology: OpenAI GPT-4 Turbo (fine-tuned on SPAFF coding)
Prompt Engineering:

  You are a clinical psychologist trained in Gottman's SPAFF coding system.
  Analyze these conversation episodes and code for Gottman's Four Horsemen:
  
  1. Criticism: Attacks on character ("You always...", "You never...")
  2. Contempt: Disrespect, sarcasm, mockery, eye-roll emoji
  3. Defensiveness: Making excuses, counter-attacks, playing victim
  4. Stonewalling: Withdrawal, one-word replies, silence
  
  For each detected behavior:
  - Cite specific message with index number
  - Calculate frequency (per 1000 messages)
  - Compare to healthy baseline (provide percentile)
  - Assess severity (Low/Medium/High)
  
  Return: JSON with {behavior, frequency, examples, severity, percentile}

Input: Critical episodes (5-10 excerpts)
Output: Gottman scorecard with evidence
Performance: 3-5 minutes per analysis
Cost: ~$1.50 per analysis

Pattern Matcher Agent (Systems Dynamicist):

Technology: Anthropic Claude Sonnet (best at pattern recognition)
Prompt Engineering:

  You are a systems analyst specializing in relationship dynamics.
  Identify interaction loops and attachment patterns:
  
  1. Demand/Withdraw: One person pursues (high message frequency),
     other withdraws (long latency, short responses)
  2. Escalation: Conflict intensity increases over time
  3. Repair Attempts: Efforts to de-escalate (apologize, humor, affection)
  4. Emotional Bids: One person seeks connection, measure response rate
  5. Pronoun Analysis: "I" vs "We" ratio (individuation vs unity)
  6. Latency Patterns: Response time as behavioral indicator
  
  Return: JSON with {pattern_name, description, evidence_indices, diagram_data}

Input: Full conversation stream + critical episodes
Output: Interaction diagrams, attachment style assessment
Performance: 3-5 minutes per analysis
Cost: ~$1 per analysis (Claude Sonnet)

Historian Agent (Longitudinal Memory):

Technology: OpenAI GPT-4 Turbo (long context window)
Prompt Engineering:

  You are a narrative therapist analyzing relationship history.
  Connect events across time:
  
  1. Recurring Themes: Topics that repeatedly cause conflict
  2. Unresolved Issues: Problems that resurface without resolution
  3. Turning Points: Events that shifted relationship trajectory
  4. Reference Web: How past events are invoked in current conflicts
  5. Trajectory: Is relationship improving, declining, or cyclical?
  
  Create a timeline of key events with narrative connections.
  Return: JSON with {event_timeline, recurring_themes, trajectory_assessment}

Input: Full chronological stream with metadata
Output: Event timeline, thematic analysis
Performance: 2-4 minutes per analysis
Cost: ~$2 per analysis (long context)

Forensic Auditor (Verification):

Technology: Claude Sonnet (best at critique/verification)
Prompt Engineering:

  You are a forensic auditor. Your job is to fact-check the Council's findings.
  
  For each claim made by other agents:
  1. Locate supporting evidence in raw transcript
  2. Calculate confidence score (0-100%)
  3. VETO any claim with confidence <70%
  4. Flag ambiguous findings for user review
  
  Rules:
  - If agent says "User A was defensive" but no defensive language found → VETO
  - If pattern is present in <3 instances → LOW CONFIDENCE
  - If pattern is consistent across 10+ instances → HIGH CONFIDENCE
  
  Return: JSON with {claim_id, evidence, confidence_score, veto_flag}

Input: All agent findings + raw conversation
Output: Verified findings with confidence scores
Performance: 2-3 minutes per analysis
Cost: ~$1 per analysis


Ephemeral Storage (Redis):

Technology: Redis 7.x (in-memory key-value store)
Responsibilities:

Store tokenized conversation (JSON)
Store agent findings (JSON)
Store session metadata (user_id, case_id, timestamps)
Job queue (BullMQ or Sidekiq)


TTL: 24 hours automatic deletion (EXPIRE command)
Persistence: Append-only file (AOF) for disaster recovery, but primary goal is ephemeral
Capacity: 64GB RAM (handles 1000 concurrent analyses)


Report Generation Tier
Report Compiler:

Technology: Python (Jinja2 templates) + Puppeteer (PDF generation)
Responsibilities:

Aggregate verified agent findings
Generate visualizations:

Timeline: Plotly or D3.js (emotional velocity graph)
Heatmap: Message frequency over time
Charts: Gottman scorecard bar charts
Interaction diagrams: Sankey diagrams for patterns


Compile into HTML template
Render to PDF using Puppeteer (headless Chrome)
Generate shareable cards (Instagram Story 1080x1920)

Use ImageMagick or Pillow (Python)
Extract key quotes with visual design


Insert placeholders for names ([Person A])


Performance: 1-2 minutes per report
Output: 30-page PDF (5-10MB), 5-10 shareable PNG cards

Object Storage:

Technology: AWS S3 or Cloudflare R2
Responsibilities:

Store tokenized report PDF
Store encrypted Identity Map
Store shareable card images
Generate signed URLs (expire in 7 days)


Security: Server-side encryption (AES-256), bucket policies (no public access)
Lifecycle: Auto-delete after 7 days (S3 Lifecycle Policy)
Cost: $0.023/GB storage, $0.09/GB transfer


Data Persistence Tier
PostgreSQL:

Technology: PostgreSQL 15 (AWS RDS or self-hosted)
Schema:

sql  users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP,
    stripe_customer_id VARCHAR(255)
  )
  
  cases (
    case_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    conversation_id UUID REFERENCES conversations(conversation_id),
    case_type VARCHAR(50), -- 'analysis', 'deep_analysis', 'mri_query', or 'chat_recommendation'
    status VARCHAR(50), -- 'processing', 'completed', 'failed'
    created_at TIMESTAMP,
    completed_at TIMESTAMP,
    report_url VARCHAR(500), -- S3 signed URL
    price_paid INTEGER -- cents
  )
  
  payments (
    payment_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    case_id UUID REFERENCES cases(case_id),
    stripe_payment_intent_id VARCHAR(255),
    amount INTEGER, -- cents
    currency VARCHAR(3),
    status VARCHAR(50),
    created_at TIMESTAMP
  )
  
  analytics_events (
    event_id UUID PRIMARY KEY,
    user_id UUID,
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP
  )
  
  conversations (
    conversation_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    contact_name VARCHAR(255),
    pro_purchased BOOLEAN DEFAULT false,
    pro_purchased_at TIMESTAMP,
    mri_queries_used INTEGER DEFAULT 0,
    mri_unlimited BOOLEAN DEFAULT false,
    mri_unlimited_purchased_at TIMESTAMP,
    created_at TIMESTAMP,
    last_analyzed_at TIMESTAMP
  )

  mri_queries (
    query_id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(conversation_id),
    user_id UUID REFERENCES users(user_id),
    question TEXT,
    answer TEXT,
    created_at TIMESTAMP
  )

  chat_recommendations (
    recommendation_id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(conversation_id),
    user_id UUID REFERENCES users(user_id),
    screenshot_url VARCHAR(500),
    recommendation TEXT,
    tokens_used INTEGER,
    cost_cents INTEGER,
    created_at TIMESTAMP
  )

  -- NO raw conversation data stored

Encryption: Data at rest encrypted (AWS RDS encryption)
Backups: Daily automated snapshots (7-day retention)
Capacity: 100GB storage (handles 1M users)

Redis Cache:

Technology: Redis 7.x
Purpose: Session state, job queue, rate limiting
TTL: Varies by data type (sessions: 24 hours, job queue: until processed)
Persistence: Optional (AOF for job queue recovery)

Clickhouse:

Technology: Clickhouse (columnar analytics database)
Purpose: Analytics, audit logs, performance metrics
Schema:

sql  events (
    timestamp DateTime,
    user_id UUID,
    event_type String,
    properties Map(String, String),
    session_id String
  )
  
  audit_log (
    timestamp DateTime,
    user_id UUID,
    action String,
    resource_type String,
    resource_id UUID,
    ip_address String
  )
  
  performance_metrics (
    timestamp DateTime,
    endpoint String,
    response_time_ms UInt32,
    status_code UInt16
  )
```
- **Retention:** 90 days (then aggregate and archive)
- **Purpose:** Business intelligence, debugging, compliance

---

#### **External Services**

**Stripe API:**
- **Purpose:** Payment processing
- **Integration:** Stripe Checkout (hosted payment page)
- **Webhooks:** Payment intent success → activate report generation
- **Cost:** 2.9% + $0.30 per transaction

**AWS Textract:**
- **Purpose:** OCR for screenshots
- **Integration:** Asynchronous API (submit job, poll for results)
- **Accuracy:** 95%+ for typed text, 80%+ for handwriting
- **Cost:** $1.50 per 1000 pages

**OpenAI API:**
- **Purpose:** LLM for Scout, Clinician, Historian agents
- **Model:** GPT-4 Turbo (128k context)
- **Cost:** $10 per 1M input tokens, $30 per 1M output tokens
- **Average cost per analysis:** ~$2-3

**Anthropic API:**
- **Purpose:** LLM for Pattern Matcher, Forensic Auditor
- **Model:** Claude Sonnet (200k context)
- **Cost:** $3 per 1M input tokens, $15 per 1M output tokens
- **Average cost per analysis:** ~$1-2

**SendGrid:**
- **Purpose:** Transactional emails
- **Use cases:** Report ready notification, password reset, receipts
- **Cost:** $0.0006 per email (first 100k free)

**Cloudflare:**
- **Purpose:** CDN, DDoS protection, DNS
- **Features:** Global edge caching, bot protection, WAF
- **Cost:** $20/month (Pro plan)

**Sentry:**
- **Purpose:** Error tracking, performance monitoring
- **Integration:** SDK in frontend/backend
- **Cost:** $26/month (Team plan)

**PostHog:**
- **Purpose:** Product analytics, feature flags, A/B testing
- **Integration:** JavaScript SDK, backend events
- **Cost:** $0-450/month (usage-based)

---

## **3. Data Flow**

### **3.1 End-to-End Flow: Free Analysis**

**Step 1: Client-Side Upload (30 seconds)**
1. User drags chat export to upload UI
2. Browser loads file, displays preview
3. WASM PII Detector scans content:
   - Text parsing and extraction
   - NER detects names → replace with [Person A], [Person B]
4. Generate Identity Map: `{[Person A]: "John", [Person B]: "Sarah"}`
5. Generate session key (256-bit random)
6. Encrypt Identity Map with session key
7. Store session key in IndexedDB
8. POST tokenized chat export + metadata to API (creates conversation)

**Step 2: Server-Side Processing (30 seconds)**
1. API Gateway validates request (auth, rate limit)
2. API Server creates conversation record and job in Redis queue
3. Worker picks up job, invokes Ingestion Pipeline
4. Extract and parse text from tokenized chat export
5. Invoke Scout Agent (GPT-4 Turbo):
```
   Analyze this conversation for red flags:
   - Tone (hostile, cold, neutral, warm)
   - Hidden aggression (passive-aggressive, gaslighting, DARVO)
   - Pattern match against known manipulation tactics

Scout returns JSON: {tone: "hostile", red_flags: ["gaslighting", "DARVO"], confidence: 85%}
Results stored in Redis (ephemeral) and conversation metadata in PostgreSQL
Send webhook to client (analysis ready)

Step 3: Client-Side Display (5 seconds)

Client polls /status endpoint, receives analysis results
Retrieve session key from IndexedDB
Decrypt Identity Map
Replace placeholders with real names in analysis results
Display inline analysis results in the Analysis tab of the Tabbed Analysis Viewer
User can review findings directly in the browser

Total Time: ~65 seconds

3.2 End-to-End Flow: Deep Analysis (Pro Feature)

Requires Pro purchase ($20/conversation) before running.

Step 1: Client-Side Upload (2-5 minutes)

User uploads WhatsApp export (chat.txt) + additional chat data
WASM PII Detector processes all files:

Scan text file for names, phones → mask with tokens
OCR screenshots → mask detected names


Generate unified Identity Map
Generate session key, encrypt Identity Map
Store key in IndexedDB
POST tokenized files (streaming upload for large files)

Step 2: Server-Side Ingestion (3-5 minutes)

API Gateway routes upload to Ingestion Pipeline
Files stored in ephemeral Redis (24-hour TTL)
Timeline Stitcher processes:

Parse timestamps from text file (regex)
OCR screenshots for timestamps
Normalize timezone
Merge duplicates
Sort chronologically


Output: Unified JSON message stream (10,000 messages, 5MB)

Step 3: User Triggers Deep Analysis

User clicks "Run" button in Deep Analysis tab
Client sends POST /conversations/:conversationId/deep-analysis
Server verifies Pro purchase for this conversation
If not purchased, return 402 with upgrade prompt

Step 4: Multi-Agent Analysis (10-15 minutes)
Full multi-agent pipeline executes (Scout → Clinician/PatternMatcher/Historian → Auditor):
Scout Agent (2-5 min):

Scan entire conversation
Identify 5-10 critical episodes
Output: [{start: 4502, end: 4580, intensity: 8.5}, ...]

Clinician Agent (3-5 min):

Analyze critical episodes
Code for Four Horsemen
Output: {criticism: 47 instances, contempt: 23, ...}

Pattern Matcher Agent (3-5 min):

Analyze full stream
Identify Demand/Withdraw loops
Output: {pattern: "demand_withdraw", confidence: 82%, ...}

Historian Agent (2-4 min):

Analyze full timeline
Connect recurring themes
Output: {theme: "trust_issues", first_occurrence: "2022-03-12", ...}

Forensic Auditor (2-3 min):

Verify all agent claims
Calculate confidence scores
VETO low-confidence findings
Output: {verified_findings: [...], vetoed_findings: [...]}

Step 5: Results Display (5 seconds)

Client polls /status endpoint, receives completion notification
Retrieve verified findings from server
Decrypt Identity Map, replace placeholders with real names
Display inline results in the Deep Analysis tab of the Tabbed Analysis Viewer
Visualizations rendered client-side (timeline graph, Gottman scorecard, heatmap)

Total Time: 16-27 minutes

3.3 End-to-End Flow: MRI Q&A (Pro Feature)

Requires Pro purchase ($20/conversation). First 2 queries free with Pro, then $10/conversation for unlimited.

Step 1: User Submits Question

User types question in MRI tab input field
Client sends POST /conversations/:conversationId/mri-query with question text
Server verifies Pro purchase for this conversation
Server checks MRI query count:

If mri_queries_used < 2 → allow (free with Pro)
If mri_queries_used >= 2 and mri_unlimited = false → return 402 with upgrade prompt ($10/conversation)
If mri_unlimited = true → allow


Step 2: Server-Side Processing (30-60 seconds)

Server loads conversation context from Redis (ephemeral store)
Combines conversation context + user question into LLM prompt
Invokes LLM (GPT-4 Turbo or Claude Sonnet) with targeted query
LLM generates focused answer using conversation evidence

Step 3: Response Display

Server stores Q&A pair in PostgreSQL (mri_queries table)
Increments mri_queries_used on conversation record
Returns answer to client
Client displays answer below question in MRI tab
Q&A history preserved and scrollable in the MRI tab

Total Time: 30-60 seconds per query

3.4 End-to-End Flow: Chat Recommender (Pro Feature)

Pay-per-use via Stripe metered billing.

Step 1: User Uploads Screenshot

User uploads screenshot in Chat Recommender tab (drag & drop or file select)
Client sends POST /conversations/:conversationId/chat-recommend with screenshot
Server verifies Pro purchase for this conversation

Step 2: Server-Side Processing (15-30 seconds)

Server performs OCR on uploaded screenshot (AWS Textract)
Extracts latest message context from screenshot
Combines OCR result + conversation context for context-aware reply generation
Invokes LLM to generate recommended reply
Tracks token usage for metered billing

Step 3: Recommendation Display

Server stores recommendation in PostgreSQL (chat_recommendations table)
Records tokens_used and cost_cents for Stripe metered billing
Returns recommended reply to client
Client displays recommended reply below the uploaded screenshot
Recommendation history preserved and viewable in Chat Recommender tab

Total Time: 15-30 seconds per recommendation

3.5 Data Retention & Deletion
Client-Side:

Session key: Stored in IndexedDB (persistent until user clears)
Unredacted report: Not stored, rendered on-demand
Option to save locally (user's choice)

Server-Side:

Tokenized conversation: Redis (24-hour TTL, auto-delete)
Tokenized report PDF: S3 (7-day expiration)
Encrypted Identity Map: S3 (7-day expiration)
Case metadata: PostgreSQL (permanent, but NO conversation data)

User Controls:

"Delete my data" button → immediately purges Redis, S3, metadata
"Download my data" → exports case metadata + encrypted files


4. Security Architecture
4.1 Zero-Knowledge Proof
Mathematical Guarantee:

Server receives only tokenized data: [Person A] said "..." to [Person B]
Identity Map encrypted client-side with key K: E(K, Map)
Server NEVER receives key K
Server CANNOT decrypt Map
Therefore: Server CANNOT determine who [Person A] is

Verification:

Open-source client-side code (GitHub)
Third-party security audit (before launch)
Penetration testing (quarterly)


4.2 Threat Model
Threat 1: Man-in-the-Middle Attack

Mitigation: TLS 1.3 encryption (HTTPS)
Certificate: Let's Encrypt with auto-renewal
HSTS: Enforce HTTPS (header: Strict-Transport-Security)

Threat 2: Server Compromise

Impact: Attacker gains access to tokenized data only
**Mitigation
Continue00:24:**

Data already anonymized (useless without Identity Map)
Identity Map encrypted (useless without client key)
Ephemeral storage (24-hour window)

Threat 3: Client Compromise (XSS)

Impact: Attacker steals session key from IndexedDB
Mitigation:

Content Security Policy (CSP) headers
Input sanitization (React escapes by default)
HttpOnly cookies for JWT (not accessible via JavaScript)



Threat 4: Insider Threat (Rogue Employee)

Impact: Employee tries to access user data
Mitigation:

Zero-knowledge architecture (mathematically impossible)
Audit logs (all admin actions logged)
Role-based access control (RBAC)



Threat 5: Subpoena / Law Enforcement

Impact: Court orders production of user data
Response:

Provide case metadata only (user_id, timestamps)
CANNOT provide conversation content (not stored)
Transparent about capabilities in privacy policy




4.3 Compliance
GDPR (EU Users):

Right to access: Provide case metadata + encrypted files
Right to deletion: Purge Redis, S3, PostgreSQL records
Right to portability: Export data in JSON format
Lawful basis: Consent (explicit opt-in)

CCPA (California):

Privacy policy: Disclose data practices
Opt-out: "Do Not Sell My Personal Information" (we don't sell, but provide mechanism)
Deletion: Same as GDPR

PCI-DSS (Credit Cards):

Use Stripe (PCI-compliant processor)
Never touch credit card data directly
Stripe Checkout (hosted form)

SOC 2 Type II (Future):

Required for enterprise sales
Third-party audit (~$50-100k)
Timeline: Within 18 months


5. Scalability & Performance
5.1 Capacity Planning
Current Target: 1,000 reports/day

Peak load: 50 reports/hour (business hours)
Off-peak: 20 reports/hour

Infrastructure Requirements:
API Servers:

5 instances @ 2 vCPU, 4GB RAM each
Auto-scaling: Scale to 20 instances at 80% CPU
Cost: $200/month (AWS t3.medium)

Worker Instances (Agent Processing):

10 instances @ 4 vCPU, 16GB RAM each
GPU-enabled for faster AI inference (optional)
Auto-scaling: Scale to 50 instances at peak
Cost: $1,000/month (AWS c5.xlarge)

Redis:

64GB RAM, 8 vCPU
Cost: $300/month (AWS ElastiCache)

PostgreSQL:

100GB storage, 4 vCPU, 16GB RAM
Cost: $250/month (AWS RDS)

Object Storage (S3):

1TB storage, 2TB transfer/month
Cost: $50/month

Total Infrastructure: $1,800/month at 1,000 reports/day

5.2 Performance Optimization
Caching Strategy:

CDN (Cloudflare): Cache static assets (JS, CSS, images)
Redis: Cache API responses (user profiles, case metadata)
Browser: Cache Identity Map (avoid re-download)

Database Optimization:

Indexing: B-tree indices on user_id, case_id, created_at
Partitioning: Partition analytics_events by month
Read replicas: 2 read replicas for analytics queries

AI Inference Optimization:

Batch processing: Group multiple analyses together
Model caching: Keep models loaded in memory
Prompt caching: Cache common prompts (OpenAI supports this)
GPU acceleration: Use NVIDIA T4 GPUs for faster inference

Network Optimization:

HTTP/2: Multiplexing reduces latency
Compression: Gzip/Brotli for API responses
CDN: Serve from edge locations (sub-50ms latency)


5.3 Failure Modes & Recovery
Failure Mode 1: API Server Crash

Detection: Health check fails (every 30s)
Recovery: Auto-restart (Kubernetes liveness probe)
Impact: Zero downtime (load balancer routes to healthy instances)

Failure Mode 2: Worker Crash Mid-Analysis

Detection: Job timeout (30 minutes)
Recovery: Retry job (BullMQ automatic retry with exponential backoff)
Impact: User sees "Processing delayed" message, analysis resumes

Failure Mode 3: Redis Failure

Detection: Connection timeout
Recovery: Failover to Redis replica (automatic, <5 seconds)
Impact: Temporary disruption (<10 seconds)

Failure Mode 4: PostgreSQL Failure

Detection: Connection timeout
Recovery: Failover to standby (AWS RDS Multi-AZ, automatic)
Impact: 1-2 minute downtime for writes

Failure Mode 5: S3 Outage

Detection: AWS Status Dashboard
Recovery: Wait for AWS recovery (SLA: 99.99% uptime)
Mitigation: Multi-region replication (future)
Impact: Reports unavailable for download (queue notifications for retry)

Disaster Recovery Plan:

RPO (Recovery Point Objective): 24 hours (daily backups)
RTO (Recovery Time Objective): 4 hours (time to restore from backup)
Backup Strategy:

PostgreSQL: Daily automated snapshots (7-day retention)
Redis: AOF persistence (append-only file)
S3: Cross-region replication (optional)




6. Monitoring & Observability
6.1 Metrics
Infrastructure Metrics:

CPU utilization (target: <70%)
Memory usage (target: <80%)
Disk I/O (target: <50% saturation)
Network bandwidth (target: <500 Mbps)

Application Metrics:

Request rate (requests/second)
Error rate (target: <1%)
Response time (p50, p95, p99)

API endpoints: p95 <500ms
Report generation: p95 <20 minutes


Job queue length (target: <100 pending)

Business Metrics:

Daily active users (DAU)
Conversion rate (free → paid)
Share rate (% who post results)
Average revenue per user (ARPU)
Churn rate (refund rate)


6.2 Logging
Log Aggregation:

Technology: AWS CloudWatch Logs or ELK Stack (Elasticsearch, Logstash, Kibana)
Retention: 30 days (then archive to S3)

Log Levels:

ERROR: System failures, unhandled exceptions
WARN: Degraded performance, retries
INFO: Normal operations (job started, completed)
DEBUG: Detailed trace (for development only)

Structured Logging:
json{
  "timestamp": "2026-02-09T10:30:45Z",
  "level": "INFO",
  "service": "api-server",
  "message": "Report generation started",
  "case_id": "uuid-1234",
  "user_id": "uuid-5678",
  "duration_ms": 0
}
Sensitive Data Handling:

NEVER log conversation content
NEVER log encryption keys
Log only tokenized references ([Person A])


6.3 Alerting
Alerting Rules:
Critical Alerts (Page Immediately):

API error rate >5% for 5 minutes → Page on-call engineer
Database failover → Page on-call engineer
Payment processing failure rate >10% → Page immediately

High Priority (Notify within 15 minutes):

API response time p95 >1 second for 10 minutes
Job queue length >500 for 10 minutes
AI API error rate >10% (OpenAI/Anthropic downtime)

Medium Priority (Notify within 1 hour):

CPU utilization >80% for 30 minutes
Disk usage >85%
Unusual traffic spike (DDoS?)

Alerting Channels:

PagerDuty (critical alerts)
Slack (high/medium priority)
Email (daily digest of all alerts)


7. Technology Stack Summary
7.1 Frontend

Framework: React 18 (Next.js 14)
State Management: Zustand or Redux Toolkit
Styling: Tailwind CSS
Encryption: Web Crypto API
NLP: spaCy (WASM), Tesseract.js (OCR)
PDF Rendering: PDF.js
Charts: Plotly.js or Recharts
Hosting: Vercel or Cloudflare Pages

7.2 Backend

API Server: Node.js (Express) or Python (FastAPI)
Worker Jobs: Python (asyncio)
Job Queue: BullMQ (Redis-based) or Sidekiq (Ruby)
AI Orchestration: LangChain or custom orchestrator
PDF Generation: Puppeteer (Node.js) or WeasyPrint (Python)
Image Processing: ImageMagick or Pillow (Python)

7.3 Infrastructure

Cloud: AWS (primary) or Google Cloud Platform
Compute: Kubernetes (EKS) or EC2 Auto Scaling Groups
Load Balancer: AWS ALB or Cloudflare
CDN: Cloudflare
DNS: Cloudflare DNS

7.4 Data Storage

Database: PostgreSQL 15 (AWS RDS)
Cache: Redis 7.x (AWS ElastiCache)
Object Storage: AWS S3 or Cloudflare R2
Analytics: Clickhouse or BigQuery

7.5 External Services

AI: OpenAI GPT-4 Turbo, Anthropic Claude Sonnet
OCR: AWS Textract or Google Cloud Vision
Payments: Stripe
Email: SendGrid or AWS SES
Monitoring: Sentry (errors), PostHog (analytics)
Alerting: PagerDuty


8. Development Roadmap
8.1 Phase 1: MVP (Weeks 1-14)
Week 1-2: Core Infrastructure

 Set up AWS account, VPC, subnets
 Configure Kubernetes cluster (EKS)
 Set up PostgreSQL, Redis
 Configure CI/CD pipeline (GitHub Actions)
 Set up monitoring (Sentry, CloudWatch)

Week 3-5: Client-Side Encryption

 Build WASM PII Detector (NER model)
 Implement Web Crypto API encryption
 Build upload UI (React)
 Test encryption flow end-to-end
 Security review (internal)

Week 6-8: Ingestion & Timeline Stitcher

 Build file parsing (text, images, ZIP)
 Integrate AWS Textract for OCR
 Build timestamp parser (regex, EXIF)
 Build Timeline Stitcher algorithm
 Test with 10 real conversation exports

Week 9-11: Multi-Agent Council

 Build Scout Agent (OpenAI integration)
 Build Clinician Agent (Gottman coding)
 Build Pattern Matcher (Claude integration)
 Build Historian Agent
 Build Forensic Auditor (verification layer)
 Test with 20 real conversations

Week 12-13: Report Generation

 Build Report Compiler (Jinja2 templates)
 Generate visualizations (Plotly)
 Integrate Puppeteer for PDF generation
 Build shareable cards (ImageMagick)
 Test PDF quality

Week 14: Integration & Testing

 End-to-end testing (upload → report)
 Load testing (100 concurrent users)
 Security audit (third-party, if budget allows)
 Fix critical bugs
 Deploy to production


8.2 Phase 2: Launch & Iterate (Weeks 15-26)
Week 15-16: Beta Launch

 Invite 100 beta users
 Monitor error rates, performance
 Collect feedback (user interviews)
 Fix top 10 bugs

Week 17-18: Public Launch

 Product Hunt launch
 Reddit seeding (manual analyses)
 Monitor traffic, conversions
 A/B test report designs (5 variants)

Week 19-22: Optimization

 Implement winning report design
 Add shareable cards feature
 Optimize AI prompts (reduce cost)
 Improve performance (caching, CDN)

Week 23-26: Feature Expansion

 Add voice message analysis
 Add comparative analysis (multiple relationships)
 Build user dashboard (view past reports)
 Add referral program


8.3 Phase 3: Scale (Weeks 27-52)
Months 7-9: Paid Acquisition

 Launch Facebook/Instagram ads ($5k/month)
 Optimize ad creative (A/B test 10 variants)
 Build retargeting campaigns
 Launch Google Ads (search)

Months 10-12: Partnerships

 Partner with 10 therapists (referral program)
 Launch affiliate program (relationship influencers)
 Explore dating app API partnerships
 Build B2B therapist portal (future)

Month 13-18: Revenue Diversification

 Launch enterprise wellness pilot
 Build white-label option for therapists
 Explore international expansion (Spanish, Portuguese)


9. Appendix
9.1 API Endpoints
Authentication:

POST /auth/register - Create account
POST /auth/login - Login (returns JWT)
POST /auth/logout - Logout
POST /auth/refresh - Refresh JWT

Upload:

POST /upload/analysis - Upload chat for analysis (creates conversation)
GET /upload/status/:case_id - Check processing status

Conversations:

GET /conversations - List user's conversations (grouped by person)
GET /conversations/:conversationId - Get conversation detail with all results
POST /conversations/:conversationId/upload - Add more data to existing conversation

Pro Features:

POST /conversations/:conversationId/deep-analysis - Trigger deep analysis run
POST /conversations/:conversationId/mri-query - Submit MRI question
POST /conversations/:conversationId/chat-recommend - Submit screenshot for recommendation
GET /conversations/:conversationId/mri-queries - Get MRI Q&A history
GET /conversations/:conversationId/recommendations - Get recommendation history

Payment:

POST /payment/create-intent - Create Stripe PaymentIntent
POST /payment/webhook - Stripe webhook (payment confirmation)
POST /payment/upgrade-pro - Purchase Pro for a conversation ($20)
POST /payment/upgrade-mri-unlimited - Purchase MRI unlimited for a conversation ($10)

Report:

GET /report/:case_id - Download tokenized report
GET /report/:case_id/cards - Download shareable cards
DELETE /report/:case_id - Delete report (user request)

User:

GET /user/profile - Get user profile
GET /user/cases - List user's past analyses
DELETE /user/account - Delete account (GDPR right to deletion)


9.2 Data Models
User Model:
typescriptinterface User {
  user_id: string; // UUID
  email: string;
  password_hash: string;
  created_at: Date;
  stripe_customer_id: string;
}
Case Model:
typescriptinterface Case {
  case_id: string; // UUID
  user_id: string;
  conversation_id: string; // UUID
  case_type: 'analysis' | 'deep_analysis' | 'mri_query' | 'chat_recommendation';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at: Date;
  report_url: string; // S3 signed URL
  price_paid: number; // cents
  metadata: {
    file_count: number;
    message_count: number;
    date_range: { start: Date, end: Date };
  };
}
Conversation Model:
typescriptinterface Conversation {
  conversation_id: string;
  user_id: string;
  contact_name: string;
  pro_purchased: boolean;
  pro_purchased_at: Date | null;
  mri_queries_used: number;
  mri_unlimited: boolean;
  mri_unlimited_purchased_at: Date | null;
  created_at: Date;
  last_analyzed_at: Date;
}
MRI Query Model:
typescriptinterface MriQuery {
  query_id: string;
  conversation_id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: Date;
}
Chat Recommendation Model:
typescriptinterface ChatRecommendation {
  recommendation_id: string;
  conversation_id: string;
  user_id: string;
  screenshot_url: string;
  recommendation: string;
  tokens_used: number;
  cost_cents: number;
  created_at: Date;
}
Report Model (Ephemeral, Redis only):
typescriptinterface Report {
  case_id: string;
  tokenized_conversation: Message[];
  agent_findings: {
    scout: ScoutFindings;
    clinician: ClinicianFindings;
    pattern_matcher: PatternFindings;
    historian: HistorianFindings;
    auditor: AuditorFindings;
  };
  visualizations: {
    timeline: ChartData;
    heatmap: ChartData;
    gottman_scorecard: ChartData;
  };
  ttl: number; // 24 hours
}

END OF HLD