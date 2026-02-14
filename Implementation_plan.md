# **Subtext 2.1: Implementation Plan**

## **Project Overview**

**Project Duration:** 14 weeks (3.5 months)  
**Team Size:** 1-3 people (solo founder or small team)  
**Budget:** $50,000 - $75,000  
**Target Launch Date:** Week 15 (soft launch), Week 18 (public launch)

---

## **Team Structure & Roles**

### **Option A: Solo Founder (Bootstrap)**
- **Role:** Full-stack developer + product manager
- **Weekly Hours:** 60-80 hours
- **Skills Required:** 
  - Frontend: React, TypeScript, WebAssembly
  - Backend: Node.js/Python, PostgreSQL, Redis
  - DevOps: AWS, Docker, Kubernetes basics
  - AI/ML: OpenAI/Anthropic API integration

### **Option B: Small Team (3 people)**
- **Developer 1 (Lead):** Backend + AI pipeline (60%)
- **Developer 2:** Frontend + encryption (30%)  
- **Developer 3 (Part-time):** DevOps + infrastructure (10%)

**Recommendation:** Start solo, hire Developer 2 at Week 5 if budget allows.

---

## **Development Phases**

### **Phase 0: Pre-Development (Week -1 to 0)**
**Goal:** Set up foundation before coding starts

| Task | Owner | Hours | Deliverable |
|------|-------|-------|-------------|
| AWS account setup, billing alerts | Dev | 2h | AWS console configured |
| Domain registration (subtext.ai) | Dev | 1h | Domain purchased |
| GitHub repo setup, CI/CD skeleton | Dev | 3h | Repo with GitHub Actions |
| Design system / UI mockups (Figma) | Dev | 8h | Figma file with 10 screens |
| Legal: Incorporate LLC, EIN | Founder | 4h | LLC documents |
| Legal: Draft ToS, Privacy Policy | Lawyer | $2k | Legal docs reviewed |
| Set up development environment | Dev | 4h | Docker compose working |
| Create project management board | Founder | 2h | Linear/Jira configured |
| **Total** | | **24h + $2k** | **Ready to code** |

**Success Criteria:**
- [ ] Can run `docker-compose up` and see "Hello World"
- [ ] GitHub Actions pipeline runs on push
- [ ] Legal documents ready for lawyer review
- [ ] UI mockups approved by founder

---

## **Phase 1: Core Infrastructure (Weeks 1-2)**

### **Sprint 1.1: Backend Foundation (Week 1)**

**Goal:** API server + database + auth working

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **PostgreSQL setup** | P0 | 3h | |
| - Create RDS instance (db.t3.micro) | | 1h | Database online |
| - Define schema (users, cases, payments) | | 1h | migrations/ folder |
| - Write migrations (Alembic/Prisma) | | 1h | Schema applied |
| **Redis setup** | P0 | 2h | |
| - Create ElastiCache instance | | 1h | Redis online |
| - Test connection from local | | 1h | Can read/write |
| **API Server skeleton** | P0 | 8h | |
| - Express/FastAPI boilerplate | | 2h | Server responds to /health |
| - JWT authentication middleware | | 3h | Can generate/verify tokens |
| - User registration endpoint | | 2h | POST /auth/register works |
| - User login endpoint | | 1h | POST /auth/login returns JWT |
| **Testing** | P1 | 3h | |
| - Unit tests for auth | | 2h | 90%+ coverage |
| - Integration test (register → login) | | 1h | E2E test passes |
| **Documentation** | P2 | 2h | |
| - API endpoint documentation | | 1h | README with examples |
| - Database schema diagram | | 1h | dbdiagram.io export |
| **Total** | | **18h** | **Auth + DB working** |

**Success Criteria:**
- [ ] Can register user, get JWT, make authenticated request
- [ ] Database has 3 tables (users, cases, payments)
- [ ] Health check endpoint returns 200
- [ ] Tests pass in CI/CD

---

### **Sprint 1.2: Job Queue + Storage (Week 2)**

**Goal:** Background jobs + S3 storage working

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Job Queue (BullMQ)** | P0 | 6h | |
| - Install BullMQ + Redis adapter | | 1h | Dependencies installed |
| - Create queue class (JobQueue) | | 2h | Can enqueue jobs |
| - Create worker process | | 2h | Can process jobs |
| - Add retry logic (exponential backoff) | | 1h | Failed jobs retry 3x |
| **S3 Storage** | P0 | 4h | |
| - Create S3 bucket (subtext-reports) | | 1h | Bucket created |
| - Configure CORS, lifecycle policies | | 1h | Files auto-delete after 7d |
| - Write upload helper function | | 1h | Can upload file to S3 |
| - Write signed URL generator | | 1h | Can get download link |
| **Upload endpoint skeleton** | P0 | 6h | |
| - POST /upload endpoint (multer) | | 2h | Can receive files |
| - Store files in Redis (ephemeral) | | 2h | Files stored with 24h TTL |
| - Queue processing job | | 2h | Job appears in queue |
| **Testing** | P1 | 4h | |
| - Test job queue (enqueue → process) | | 2h | Worker picks up job |
| - Test S3 upload/download | | 2h | File upload works |
| **Total** | | **20h** | **Job queue + S3 working** |

**Success Criteria:**
- [ ] Can upload file → stored in Redis → job queued
- [ ] Worker processes job (dummy handler)
- [ ] Can upload to S3, get signed URL
- [ ] Job retries on failure

**Sprint 1 Review:**
- Total hours: 38h
- Budget spent: $2k (legal) + $50/month (AWS)
- Deliverable: Backend foundation ready for processing pipeline

---

## **Phase 2: Client-Side Encryption (Weeks 3-4)**

### **Sprint 2.1: PII Detection (WASM) (Week 3)**

**Goal:** Client-side PII masking working

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **NER Model Research** | P0 | 4h | |
| - Evaluate spaCy vs alternatives | | 2h | Decision: spaCy en_core_web_sm |
| - Test ONNX conversion (Python → WASM) | | 2h | Model exported to ONNX |
| **Rust WASM Module** | P0 | 16h | |
| - Set up Rust project (wasm-pack) | | 2h | Can compile to WASM |
| - Load ONNX model in Rust | | 4h | Model runs in Rust |
| - Implement NER inference | | 4h | Can detect names |
| - Add regex patterns (phone, email) | | 3h | All PII types detected |
| - Create token mapping (name → [Person A]) | | 2h | Identity map generated |
| - Export to JavaScript (wasm-bindgen) | | 1h | Can call from JS |
| **Testing** | P0 | 6h | |
| - Unit tests (Rust) | | 3h | 85%+ coverage |
| - Integration tests (JS calling WASM) | | 2h | Can mask sample text |
| - Performance test (10k words) | | 1h | <500ms processing |
| **Documentation** | P1 | 2h | |
| - API documentation | | 1h | Function signatures |
| - Performance benchmarks | | 1h | Speed metrics |
| **Total** | | **28h** | **PII detection working** |

**Success Criteria:**
- [ ] Can detect names, phones, emails with 90%+ accuracy
- [ ] Processing 10,000 words takes <500ms
- [ ] Identity map correctly maps tokens to originals
- [ ] WASM module is <5MB

---

### **Sprint 2.2: Encryption + Upload UI (Week 4)**

**Goal:** End-to-end encryption flow working

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Encryption Module (Web Crypto)** | P0 | 8h | |
| - Generate AES-256 session key | | 2h | Key generated |
| - Encrypt identity map (AES-GCM) | | 2h | Encryption works |
| - Store key in IndexedDB | | 2h | Key persists |
| - Decrypt identity map | | 2h | Decryption works |
| **Image PII Detection (Tesseract.js)** | P0 | 8h | |
| - OCR text extraction | | 3h | Text extracted from image |
| - Face detection (BlazeFace) | | 3h | Faces detected |
| - Blur faces (Canvas API) | | 2h | Faces blurred |
| **Upload UI (React)** | P0 | 10h | |
| - File dropzone component | | 3h | Drag & drop works |
| - Progress indicator | | 2h | Shows % complete |
| - File preview (masked) | | 3h | User sees masked data |
| - Submit to server | | 2h | Files uploaded |
| **Integration** | P0 | 6h | |
| - Connect PII detector + encryption | | 3h | Full flow works |
| - Handle errors gracefully | | 2h | Errors shown to user |
| - Add loading states | | 1h | Spinners, progress |
| **Testing** | P1 | 6h | |
| - E2E test (upload → encrypt → submit) | | 3h | Full flow tested |
| - Browser compatibility (Chrome, Safari) | | 2h | Works on both |
| - Mobile responsive test | | 1h | Works on mobile |
| **Total** | | **38h** | **Upload flow complete** |

**Success Criteria:**
- [ ] User can upload file, see masked preview, submit
- [ ] Identity map encrypted with session key
- [ ] Session key stored locally (never sent to server)
- [ ] Works on Chrome, Safari, Firefox
- [ ] Mobile responsive

**Sprint 2 Review:**
- Total hours: 66h (cumulative: 104h)
- Deliverable: Client-side encryption fully working

---

## **Phase 3: Processing Pipeline (Weeks 5-8)**

### **Sprint 3.1: Ingestion + Timeline (Week 5)**

**Goal:** Can parse multiple file formats, stitch timeline

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **AWS Textract Integration** | P0 | 6h | |
| - Set up IAM role, permissions | | 1h | Textract accessible |
| - Implement async OCR (submit → poll) | | 3h | OCR working |
| - Handle pagination (multi-page PDFs) | | 2h | All pages extracted |
| **Text File Parsing** | P0 | 8h | |
| - WhatsApp export parser (regex) | | 3h | WhatsApp format parsed |
| - iMessage export parser | | 3h | iMessage format parsed |
| - Generic text parser (fallback) | | 2h | Any text works |
| **ZIP File Handling** | P0 | 4h | |
| - Extract ZIP contents | | 2h | Files extracted |
| - Recursively process each file | | 2h | All files processed |
| **Timeline Stitcher** | P0 | 10h | |
| - Timestamp parsing (multiple formats) | | 4h | Dates normalized |
| - Chronological sorting | | 2h | Messages ordered |
| - Duplicate detection | | 2h | Duplicates removed |
| - Gap analysis (>48h silence) | | 2h | Gaps flagged |
| **Conversation Management** | P0 | 8h | |
| - Create `conversations` table (schema + migrations) | | 3h | Table created |
| - CRUD endpoints for conversations | | 3h | Endpoints working |
| - Update upload endpoint to create/link conversations | | 2h | Uploads linked |
| **Dashboard API** | P0 | 4h | |
| - GET /conversations endpoint | | 2h | Returns conversations |
| - Group by contact name | | 2h | Grouped response |
| **Testing** | P1 | 6h | |
| - Unit tests (each parser) | | 3h | 90%+ coverage |
| - Integration test (mixed formats) | | 3h | Full flow tested |
| **Total** | | **46h** | **Ingestion complete** |

**Success Criteria:**
- [ ] Can parse WhatsApp, iMessage, screenshots
- [ ] Timeline correctly ordered by timestamp
- [ ] Gaps >48 hours detected
- [ ] Handles 50,000 messages in <60 seconds

---

### **Sprint 3.2: Scout Agent (Week 6)**

**Goal:** Triage agent identifies critical episodes

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **OpenAI Integration** | P0 | 4h | |
| - Set up API client (openai Python lib) | | 1h | Can call API |
| - Implement rate limiting | | 1h | Max 60 req/min |
| - Add error handling (429, 500) | | 1h | Retries on error |
| - Cost tracking (log token usage) | | 1h | Cost per request logged |
| **Scout Agent Implementation** | P0 | 12h | |
| - Format messages for LLM input | | 2h | Text prepared |
| - Write prompt (identify hot zones) | | 4h | Prompt engineered |
| - Parse JSON response | | 2h | Output validated |
| - Handle truncation (>100k tokens) | | 2h | Chunks processed |
| - Add confidence scoring | | 2h | Intensity 0-10 scale |
| **Testing** | P1 | 6h | |
| - Test with real conversations (10 samples) | | 4h | Results evaluated |
| - Validate output quality | | 2h | Accuracy checked |
| **Total** | | **22h** | **Scout agent working** |

**Success Criteria:**
- [ ] Identifies 5-10 hot zones per conversation
- [ ] Processing time <5 minutes for 10k messages
- [ ] Cost <$2 per analysis
- [ ] 80%+ accuracy on test set

---

### **Sprint 3.3: Specialist Agents (Week 7)**

**Goal:** Clinician, Pattern Matcher, Historian working

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Clinician Agent** | P0 | 10h | |
| - Prompt engineering (Gottman SPAFF) | | 4h | Prompt tested |
| - Implement analysis function | | 3h | Code working |
| - Parse and validate output | | 2h | JSON validated |
| - Calculate frequencies, percentiles | | 1h | Stats computed |
| **Pattern Matcher Agent (Anthropic)** | P0 | 10h | |
| - Set up Anthropic API client | | 2h | Can call Claude |
| - Prompt engineering (systems theory) | | 4h | Prompt tested |
| - Implement analysis function | | 2h | Code working |
| - Calculate sender stats, latency | | 2h | Metrics computed |
| **Historian Agent** | P0 | 8h | |
| - Prompt engineering (timeline analysis) | | 3h | Prompt tested |
| - Implement analysis function | | 3h | Code working |
| - Connect recurring themes | | 2h | Themes identified |
| **MRI Responder Service** | P0 | 8h | |
| - Context-aware Q&A using conversation data + LLM | | 4h | Q&A working |
| - Response formatting and citation | | 2h | Responses formatted |
| - Conversation context retrieval | | 2h | Context loaded |
| **Parallel Execution** | P0 | 4h | |
| - Run all 3 agents concurrently (asyncio) | | 3h | Parallel working |
| - Aggregate results | | 1h | Combined output |
| **Testing** | P1 | 8h | |
| - Test each agent independently | | 4h | All pass |
| - Integration test (all agents + MRI) | | 4h | Full pipeline works |
| **Total** | | **48h** | **All agents + MRI working** |

**Success Criteria:**
- [ ] All 3 specialist agents complete analysis
- [ ] Parallel execution saves 60% time vs sequential
- [ ] Combined cost <$5 per full analysis
- [ ] Output JSON is well-structured

---

### **Sprint 3.4: Forensic Auditor + Integration (Week 8)**

**Goal:** Verification layer + end-to-end pipeline

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Forensic Auditor** | P0 | 12h | |
| - Prompt engineering (fact-checking) | | 4h | Prompt tested |
| - Implement verification logic | | 4h | Code working |
| - Calculate confidence scores | | 2h | Scores computed |
| - VETO low-confidence (<70%) findings | | 2h | Filtering works |
| **Chat Recommender Service** | P0 | 10h | |
| - OCR screenshot processing | | 3h | Screenshots parsed |
| - Context-aware reply generation using LLM | | 4h | Replies generated |
| - Recommendation formatting and confidence scoring | | 3h | Output structured |
| **Pipeline Integration** | P0 | 10h | |
| - Connect all components (ingestion → agents → auditor) | | 4h | Full flow working |
| - Add progress tracking (Redis pub/sub) | | 3h | % shown to user |
| - Error handling (retry failed steps) | | 2h | Errors handled |
| - Logging (structured JSON logs) | | 1h | Logs viewable |
| **Performance Optimization** | P0 | 6h | |
| - Profile bottlenecks | | 2h | Slowest parts identified |
| - Optimize LLM prompts (reduce tokens) | | 2h | 20% cost reduction |
| - Implement caching (Redis) | | 2h | Repeated calls cached |
| **Testing** | P1 | 10h | |
| - E2E test (upload → report metadata) | | 5h | Full flow tested |
| - Load test (10 concurrent analyses) | | 3h | System handles load |
| - Cost analysis (measure actual spend) | | 2h | $4-6 per analysis |
| **Total** | | **48h** | **Pipeline complete** |

**Success Criteria:**
- [ ] Full pipeline: upload → ingestion → agents → verification
- [ ] Processing time: <20 minutes for 10k messages
- [ ] Cost: <$6 per analysis
- [ ] 10 concurrent analyses run smoothly

**Sprint 3 Review:**
- Total hours: 134h (cumulative: 238h)
- Budget: ~$500 (API costs for testing)
- Deliverable: Processing pipeline end-to-end

---

## **Phase 4: Report Generation (Weeks 9-10)**

### **Sprint 4.1: Analysis Viewer + Frontend (Week 9)**

**Goal:** Generate analysis results and tabbed frontend

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Data Visualization (Plotly)** | P0 | 12h | |
| - Timeline chart (emotional velocity) | | 3h | Chart rendered |
| - Message frequency heatmap | | 3h | Heatmap rendered |
| - Gottman scorecard (bar chart) | | 2h | Scorecard rendered |
| - Interaction diagrams (Sankey) | | 4h | Diagrams rendered |
| **Tabbed Analysis Viewer Component** | P0 | 14h | |
| - Tab layout (Analysis | Deep Analysis | MRI | Chat Recommender) | | 4h | Tab navigation working |
| - Analysis tab: render structured JSON results inline | | 3h | Analysis displayed |
| - Deep Analysis tab: render deep analysis results inline | | 3h | Deep Analysis displayed |
| - MRI Q&A interface component | | 2h | MRI tab working |
| - Chat Recommender interface component | | 2h | Recommender tab working |
| **Structured JSON Storage** | P0 | 6h | |
| - Store analysis results as structured JSON | | 3h | JSON schema defined |
| - API endpoints for reading/writing analysis results | | 3h | CRUD working |
| **Lock/Unlock Tab States** | P0 | 4h | |
| - Lock/unlock tab states based on Pro purchase | | 2h | Gating logic working |
| - Pro upgrade prompts on locked tabs | | 2h | Prompts displayed |
| **Testing** | P1 | 4h | |
| - Test tabbed viewer with sample data | | 2h | All tabs render correctly |
| - Validate lock/unlock behavior | | 2h | Gating works |
| **Total** | | **40h** | **Analysis viewer works** |

**Success Criteria:**
- [ ] Tabbed viewer with 4 tabs (Analysis, Deep Analysis, MRI, Chat Recommender)
- [ ] Analysis results stored as structured JSON
- [ ] Lock/unlock states based on Pro purchase
- [ ] Generates in <2 minutes

---

### **Sprint 4.2: Dashboard + Conversation Views (Week 10)**

**Goal:** Conversation-based dashboard and detail views

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Conversation Dashboard** | P0 | 10h | |
| - Conversation-based dashboard (grouped by person: Person A, B, C) | | 4h | Dashboard renders |
| - Conversation list with metadata (date, message count, status) | | 3h | List populated |
| - Pro status display per conversation | | 3h | Pro badges shown |
| **Conversation Detail View** | P0 | 10h | |
| - Conversation detail view with tabbed interface | | 4h | Detail view working |
| - Resume previous session (preserve Deep Analysis results) | | 3h | Session restored |
| - Preserve MRI Q&A history across sessions | | 2h | Q&A history loaded |
| - Preserve Chat Recommender recommendations | | 1h | Recommendations restored |
| **Email Notification** | P1 | 4h | |
| - Design email (SendGrid template) | | 2h | Email looks good |
| - Include CTA (view analysis) | | 1h | Link included |
| - Test delivery | | 1h | Emails arrive |
| **Testing** | P1 | 8h | |
| - E2E test (upload → dashboard → conversation detail) | | 4h | Full flow works |
| - Session resume test | | 2h | State preserved |
| - Cross-browser test | | 2h | Works everywhere |
| **Total** | | **32h** | **Dashboard complete** |

**Success Criteria:**
- [ ] Conversations grouped by person on dashboard
- [ ] Can navigate to conversation detail with tabbed interface
- [ ] Session state preserved (Deep Analysis, MRI Q&A, recommendations)
- [ ] Pro status visible per conversation
- [ ] Works on mobile devices

**Sprint 4 Review:**
- Total hours: 72h (cumulative: 310h)
- Deliverable: Complete end-to-end flow

---

## **Phase 5: MVP Polish (Weeks 11-12)**

### **Sprint 5.1: Payment Integration (Week 11)**

**Goal:** Stripe payment flow working

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Stripe Setup** | P0 | 6h | |
| - Create Stripe account | | 1h | Account created |
| - Configure products ($20 Pro/conversation, $10 MRI unlimited/conversation) | | 2h | Products listed |
| - Stripe metered billing setup for Chat Recommender (token-level pay-per-use) | | 2h | Metered billing configured |
| - Set up webhooks | | 1h | Webhooks configured |
| **Payment Flow (Frontend)** | P0 | 8h | |
| - Integrate Stripe Checkout | | 4h | Payment page works |
| - Handle success/cancel redirects | | 2h | Redirects work |
| - Show payment confirmation | | 2h | Receipt displayed |
| **Payment Flow (Backend)** | P0 | 10h | |
| - Update PaymentIntent endpoint to handle: `pro_features`, `mri_unlimited` product types | | 4h | Can create payment |
| - Handle webhook: per-conversation Pro unlock and MRI unlimited activation | | 4h | Triggers unlock |
| - Record payment in database | | 2h | Payments table updated |
| **Testing** | P0 | 6h | |
| - Test payment flow (test mode) | | 3h | Payment works |
| - Test webhook delivery | | 2h | Webhook received |
| - Test failed payment handling | | 1h | Errors handled |
| **Total** | | **30h** | **Payments working** |

**Success Criteria:**
- [ ] Can pay $20 Pro/conversation, features unlocked automatically
- [ ] Can pay $10 MRI unlimited/conversation, MRI activated
- [ ] Chat Recommender metered billing tracks token usage
- [ ] Payment records saved to database
- [ ] Webhook handles per-conversation Pro unlock and MRI activation
- [ ] Works in test mode

---

### **Sprint 5.2: Landing Page + Marketing (Week 11-12)**

**Goal:** Public-facing website ready

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Landing Page** | P0 | 16h | |
| - Hero section (value prop) | | 4h | Compelling headline |
| - How it works (3 steps) | | 3h | Clear explanation |
| - Example report (screenshots) | | 3h | Shows value |
| - Pricing section | | 2h | Clear pricing |
| - FAQ section | | 2h | Answers concerns |
| - CTA (start free scan) | | 2h | Converts visitors |
| **SEO Optimization** | P0 | 8h | |
| - Meta tags (title, description) | | 2h | Tags optimized |
| - Schema markup (JSON-LD) | | 2h | Rich snippets |
| - Sitemap, robots.txt | | 1h | SEO basics |
| - Performance optimization (Lighthouse) | | 3h | >90 score |
| **Content Creation** | P1 | 12h | |
| - Write 10 blog posts | | 10h | SEO content |
| - Create social media graphics | | 2h | Shareable images |
| **Analytics Setup** | P0 | 4h | |
| - Google Analytics 4 | | 2h | Tracking events |
| - PostHog (product analytics) | | 2h | Funnel tracking |
| **Total** | | **40h** | **Website ready** |

**Success Criteria:**
- [ ] Landing page loads in <2 seconds
- [ ] Lighthouse score >90
- [ ] Clear value proposition
- [ ] Analytics tracking conversions

---

### **Sprint 5.3: Testing & Bug Fixes (Week 12)**

**Goal:** Stable, production-ready system

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Bug Triage** | P0 | 8h | |
| - Test all user flows | | 4h | Issues logged |
| - Prioritize bugs (P0, P1, P2) | | 2h | Priority assigned |
| - Fix P0 bugs (blocking launch) | | 2h | Critical bugs fixed |
| **Performance Testing** | P0 | 8h | |
| - Load test (100 concurrent uploads) | | 3h | System handles load |
| - Database query optimization | | 3h | Queries <100ms |
| - API response time optimization | | 2h | Endpoints <500ms |
| **Security Audit** | P0 | 12h | |
| - Manual security review | | 4h | Vulnerabilities found |
| - Fix security issues | | 4h | Issues patched |
| - Dependency audit (npm audit, pip-audit) | | 2h | Deps updated |
| - Penetration testing (basic) | | 2h | No critical issues |
| **Error Monitoring** | P0 | 4h | |
| - Set up Sentry (error tracking) | | 2h | Errors logged |
| - Configure alerts (Slack, email) | | 2h | Alerts working |
| **Total** | | **32h** | **Production-ready** |

**Success Criteria:**
- [ ] No P0 bugs remaining
- [ ] Load test passes (100 concurrent)
- [ ] No critical security vulnerabilities
- [ ] Error monitoring working

**Sprint 5 Review:**
- Total hours: 98h (cumulative: 408h)
- Deliverable: MVP ready for beta launch

---

## **Phase 6: Beta Launch (Weeks 13-14)**

### **Sprint 6.1: Private Beta (Week 13)**

**Goal:** 100 beta users, collect feedback

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Beta User Recruitment** | P0 | 8h | |
| - Post on Reddit (r/relationship_advice) | | 2h | 5 posts |
| - Personal network outreach | | 2h | 50 invites sent |
| - Create waitlist landing page | | 2h | Signups collected |
| - Approve first 100 users | | 2h | Invites sent |
| **Onboarding Flow** | P0 | 8h | |
| - Welcome email sequence | | 3h | 3 emails drafted |
| - Tutorial/walkthrough (optional) | | 3h | Guides created |
| - Support documentation | | 2h | FAQ updated |
| **Manual Support** | P0 | 20h | |
| - Monitor user sessions (PostHog) | | 5h | Issues identified |
| - Respond to support emails | | 10h | Users helped |
| - Conduct user interviews (10 people) | | 5h | Feedback collected |
| **Iteration** | P0 | 12h | |
| - Fix top 5 user-reported issues | | 8h | Issues resolved |
| - Improve UX based on feedback | | 4h | UI tweaked |
| **Total** | | **48h** | **Beta complete** |

**Success Criteria:**
- [ ] 100 users complete upload
- [ ] 60+ users receive reports
- [ ] 15+ conversion rate (free → paid)
- [ ] 4.0+ star average rating
- [ ] 10 user interviews completed

---

### **Sprint 6.2: Public Launch Prep (Week 14)**

**Goal:** Ready for Product Hunt launch

| Task | Priority | Hours | Deliverable |
|------|----------|-------|-------------|
| **Launch Materials** | P0 | 12h | |
| - Product Hunt listing | | 4h | Listing ready |
| - Launch video (demo) | | 4h | 2-minute video |
| - Press kit (screenshots, copy) | | 2h | Media assets |
| - Reddit launch post | | 2h | Post drafted |
| **Marketing Preparation** | P0 | 8h | |
| - Email sequence (3 emails) | | 3h | Drip campaign ready |
| - Social media content (20 posts) | | 3h | Posts scheduled |
| - Outreach to influencers (10 people) | | 2h | Emails sent |
| **Scaling Preparation** | P0 | 8h | |
| - Increase server capacity | | 2h | Auto-scaling enabled |
| - Rate limiting (prevent abuse) | | 3h | Limits configured |
| - DDoS protection (Cloudflare) | | 2h | Protection enabled |
| - Cost monitoring (billing alerts) | | 1h | Alerts configured |
| **Final Testing** | P0 | 8h | |
| - Full regression test | | 4h | All flows work |
| - Load test (500 concurrent) | | 3h | System stable |
| - Final security check | | 1h | No issues |
| **Total** | | **36h** | **Launch ready** |

**Success Criteria:**
- [ ] Product Hunt listing approved
- [ ] Can handle 500 concurrent users
- [ ] All critical bugs fixed
- [ ] Marketing materials ready

**Sprint 6 Review:**
- Total hours: 84h (cumulative: 492h)
- Deliverable: Ready for public launch

---

## **Phase 7: Public Launch (Week 15+)**

### **Launch Day (Day 1)**

| Time | Activity | Owner |
|------|----------|-------|
| 12:01 AM PT | Submit to Product Hunt | Founder |
| 6:00 AM | Post on Reddit (r/relationship_advice) | Founder |
| 8:00 AM | Email waitlist (500 people) | Automated |
| 9:00 AM | Tweet launch announcement | Founder |
| 10:00 AM | Post on HackerNews Show HN | Founder |
| All Day | Respond to comments/questions | Founder |
| 6:00 PM | Check metrics, celebrate 🎉 | Team |

**Target Metrics (Day 1):**
- 1,000 website visitors
- 200 free analysis signups
- 30 paid conversions ($1,470 revenue)
- Top 5 on Product Hunt

---

### **First Week Post-Launch (Week 15)**

| Task | Hours/Week |
|------|------------|
| Monitor server health | 5h |
| Respond to support emails | 10h |
| Fix urgent bugs | 10h |
| Track metrics (daily review) | 3h |
| Engage on social media | 5h |
| User interviews (5 people) | 3h |
| **Total** | **36h/week** |

**Target Metrics (Week 1):**
- 5,000 website visitors
- 1,000 free analyses
- 150 Pro upgrades ($3,000 revenue)
- 20% share rate (200 social posts)

---

## **Critical Path Analysis**

**Dependencies (What blocks what):**

```
Phase 1 (Infrastructure) → Phase 2 (Encryption) → Phase 3 (Pipeline) → Phase 4 (Reports) → Phase 5 (MVP) → Phase 6 (Launch)
    ↓                           ↓                       ↓                     ↓                ↓               ↓
  Week 1-2                   Week 3-4              Week 5-8              Week 9-10        Week 11-12      Week 13-14
```

**Critical Path Tasks (CANNOT be delayed):**
1. Database + Auth (Week 1) → Blocks everything
2. PII Detection WASM (Week 3) → Blocks upload flow
3. Agent Integration (Week 5-8) → Blocks report generation
4. Report Generation (Week 9-10) → Blocks MVP completion
5. Payment Integration (Week 11) → Blocks revenue
6. Beta Testing (Week 13) → Validates product before public launch

**Parallelizable Work:**
- Week 3: Frontend (encryption) + Backend (ingestion) can happen in parallel
- Week 7-8: Specialist agents can be built in parallel
- Week 11: Landing page + payment integration can happen in parallel

---

## **Resource Allocation**

### **Time Budget (Solo Founder)**

| Phase | Weeks | Hours/Week | Total Hours |
|-------|-------|------------|-------------|
| Phase 1: Infrastructure | 2 | 19h | 38h |
| Phase 2: Encryption | 2 | 33h | 66h |
| Phase 3: Pipeline | 4 | 33.5h | 134h |
| Phase 4: Reports | 2 | 36h | 72h |
| Phase 5: MVP Polish | 2 | 49h | 98h |
| Phase 6: Beta Launch | 2 | 42h | 84h |
| **Total** | **14 weeks** | **35h avg** | **492h** |

**Realistic Schedule (Solo):**
- 40-50 hours/week coding
- 10-15 hours/week other (planning, design, testing)
- **Total: 50-65 hours/week**

**Timeline with contingency:**
- Planned: 14 weeks (492 hours)
- Contingency buffer (20%): +3 weeks
- **Total: 17 weeks to public launch**

---

### **Financial Budget**

| Category | One-Time | Monthly | 14-Week Total |
|----------|----------|---------|---------------|
| **Legal & Setup** |
| LLC formation, EIN | $500 | - | $500 |
| ToS, Privacy Policy (lawyer) | $2,000 | - | $2,000 |
| **Infrastructure** |
| AWS (RDS, ElastiCache, S3, EC2) | - | $500 | $1,750 |
| Domain (subtext.ai) | $50 | - | $50 |
| Cloudflare Pro | - | $20 | $70 |
| **Tools & Services** |
| GitHub Pro | - | $4 | $14 |
| Sentry (error tracking) | - | $26 | $91 |
| PostHog (analytics) | - | $0-50 | $175 |
| SendGrid (email) | - | $20 | $70 |
| **AI APIs (Testing)** |
| OpenAI API (GPT-4 Turbo) | - | - | $1,500 |
| Anthropic API (Claude Sonnet) | - | - | $800 |
| AWS Textract (OCR) | - | - | $300 |
| **Design & Assets** |
| Figma Pro | - | $15 | $53 |
| Stock photos (Unsplash Pro) | $0 | - | $0 |
| **Insurance** |
| General Liability (optional) | $500/year | - | $175 |
| **Contingency (20%)** | - | - | $1,910 |
| **TOTAL** | | | **$9,458** |

**Additional if hiring Developer 2 (Week 5-14):**
- Frontend developer (part-time, 20h/week): $50/hour × 20h × 10 weeks = **$10,000**

**Total Budget:**
- **Solo:** $9,458
- **With hired help:** $19,458

---

## **Risk Mitigation**

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **PII detection accuracy <85%** | Medium (30%) | HIGH | Test with 100 real samples before committing to WASM approach. Fallback: Use cloud NER API (Google, AWS) | Dev |
| **Agent output quality poor** | Medium (25%) | CRITICAL | Extensive prompt engineering (20+ iterations). Budget extra week for testing. Hire prompt engineer consultant ($1k) | Dev |
| **Processing time >30 minutes** | Medium (20%) | HIGH | Profile early (Week 7). Optimize prompts, use faster models if needed. Acceptable: 20 min for MVP | Dev |
| **Cost per analysis >$10** | Low (15%) | MEDIUM | Monitor costs weekly. Optimize prompts to reduce tokens. Acceptable: $6-8 for MVP | Founder |
| **Encryption implementation bug** | Low (10%) | CRITICAL | Thorough testing, third-party security audit ($5k). Open-source client code for transparency | Dev |
| **Launch day server crash** | Low (10%) | HIGH | Load test with 500 concurrent (Week 14). Auto-scaling enabled. On-call monitoring (PagerDuty) | Dev |
| **Legal challenge (ToS insufficient)** | Very Low (5%) | HIGH | Hire experienced startup lawyer ($2k). Conservative disclaimers. Never claim to diagnose | Founder |
| **Founder burnout** | Medium (30%) | CRITICAL | Schedule 1 day off per week. Cap at 60 hours/week. Celebrate milestones. Therapy if needed | Founder |

---

## **Success Metrics**

### **Phase-Level Metrics**

| Phase | Key Metric | Success Threshold |
|-------|------------|-------------------|
| Phase 1 | API + DB working | Tests pass, <500ms response time |
| Phase 2 | Encryption working | Key stored locally, WASM <5MB, <500ms |
| Phase 3 | Agents working | 80%+ accuracy, <20 min processing, <$6 cost |
| Phase 4 | Reports working | Professional quality, <2 min generation |
| Phase 5 | MVP complete | All flows working, no P0 bugs |
| Phase 6 | Beta validation | 15%+ conversion, 4.0+ rating, 10 interviews |

---

### **Launch Success Metrics**

**Week 1 Post-Launch:**
- [ ] 1,000+ free analyses completed
- [ ] 150+ Pro upgrades ($3,000 revenue at $20/conversation)
- [ ] 15%+ conversion rate
- [ ] 20%+ share rate
- [ ] 4.0+ average rating
- [ ] <5% error rate
- [ ] <1% refund rate

**Month 3 Post-Launch:**
- [ ] $16,000+ MRR (lower per-transaction but higher conversion volume)
- [ ] 800+ Pro upgrades/month
- [ ] 0.25+ viral coefficient
- [ ] LTV:CAC >1.5
- [ ] 10%+ returning users

**Month 6 (Break-even):**
- [ ] $40,000 MRR
- [ ] 2,000+ Pro upgrades/month
- [ ] Profitable (revenue > costs)
- [ ] 25%+ organic traffic

---

## **Daily Standup Template**

**What I did yesterday:**
- [Task completed]
- [Blocker encountered and resolved]

**What I'm doing today:**
- [Priority task 1]
- [Priority task 2]

**Blockers:**
- [Issue blocking progress]

**Metrics:**
- Users: X
- Revenue: $X
- Errors: X

---

## **Weekly Review Template**

**Week X Summary:**
- Hours worked: X
- Tasks completed: X/Y
- Sprint goal: [Met / Not Met]

**Wins:**
- [Major accomplishment]

**Challenges:**
- [Problem encountered and how it was handled]

**Next Week Plan:**
- [Top 3 priorities]

**Metrics:**
- Cumulative hours: X/492
- Budget spent: $X/$9,458
- On track for launch? [Yes/No]

---

## **Deployment Checklist**

### **Pre-Launch (Week 14)**

**Infrastructure:**
- [ ] Production database backed up
- [ ] Auto-scaling configured (2-20 instances)
- [ ] Rate limiting enabled (100 req/min per user)
- [ ] DDoS protection enabled (Cloudflare)
- [ ] SSL certificate valid
- [ ] CDN configured for static assets

**Security:**
- [ ] All secrets in environment variables (not code)
- [ ] IAM roles configured (least privilege)
- [ ] Security groups locked down (only necessary ports)
- [ ] WAF rules enabled (SQL injection, XSS)
- [ ] Dependency audit clean (no critical CVEs)

**Monitoring:**
- [ ] Sentry error tracking working
- [ ] CloudWatch alarms configured
- [ ] PagerDuty on-call schedule
- [ ] Logs centralized (CloudWatch or ELK)
- [ ] Cost alerts configured ($100/day threshold)

**Legal:**
- [ ] ToS displayed and required acceptance
- [ ] Privacy Policy displayed
- [ ] Cookie banner (GDPR compliance)
- [ ] DMCA agent registered (if applicable)

**Testing:**
- [ ] All E2E tests passing
- [ ] Load test passed (500 concurrent users)
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Mobile tested (iOS Safari, Android Chrome)

**Marketing:**
- [ ] Product Hunt listing live
- [ ] Landing page SEO optimized
- [ ] Analytics tracking working
- [ ] Email sequences configured
- [ ] Social media accounts created

---

## **Go/No-Go Decision Points**

### **Week 4 Decision: Continue or Pivot?**

**Criteria to continue:**
- [ ] PII detection accuracy >85%
- [ ] Encryption working reliably
- [ ] Upload flow complete
- [ ] Enthusiastic about product

**If NO → Pivot or kill**

---

### **Week 8 Decision: Full MVP or Scale Back?**

**Criteria for full MVP:**
- [ ] All agents working with >80% accuracy
- [ ] Processing time <20 minutes
- [ ] Cost per analysis <$8
- [ ] Output quality passes manual review

**If NO → Scope down (e.g., Free Analysis only, defer Pro Features)**

---

### **Week 13 Decision: Launch or Delay?**

**Criteria to launch:**
- [ ] 60+ beta users completed flow
- [ ] 15%+ conversion rate
- [ ] 4.0+ average rating
- [ ] No P0 bugs
- [ ] Can handle 500 concurrent users

**If NO → Delay 1-2 weeks, fix issues**

---

## **Post-Launch Roadmap (Week 16-26)**

### **Month 1 (Weeks 16-19): Stabilize**
- Monitor daily, fix bugs fast
- Optimize conversion funnel
- A/B test report designs (5 variants)
- Content marketing (2 posts/week)

### **Month 2 (Weeks 20-23): Grow**
- Launch paid ads ($5k/month)
- Influencer partnerships (10 people)
- Voice message analysis (upsell)
- Comparative analysis (multiple relationships)

### **Month 3 (Weeks 24-26): Diversify**
- B2B therapist pilot (5 therapists)
- Dating app API conversations
- International expansion (Spanish)
- Raise seed round (optional)

---

## **Appendix: Tool Stack**

### **Development Tools**

**Frontend:**
- React 18 + TypeScript
- Next.js 14 (SSR, routing)
- Tailwind CSS (styling)
- Zustand (state management)
- React Query (server state)
- PDF.js (PDF parsing)
- Tesseract.js (OCR)
- TensorFlow.js (face detection)

**Backend:**
- Node.js 20 + TypeScript OR Python 3.11
- Express (Node) OR FastAPI (Python)
- Prisma (ORM, Node) OR SQLAlchemy (Python)
- BullMQ (job queue, Node) OR Celery (Python)
- OpenAI Python SDK
- Anthropic Python SDK
- Boto3 (AWS SDK)

**Infrastructure:**
- PostgreSQL 15 (AWS RDS)
- Redis 7 (AWS ElastiCache)
- S3 (object storage)
- CloudFront (CDN)
- Cloudflare (DDoS, DNS)
- Docker (containerization)
- Kubernetes (optional, EKS)

**DevOps:**
- GitHub Actions (CI/CD)
- Terraform (infrastructure as code)
- Sentry (error tracking)
- CloudWatch (monitoring)
- PagerDuty (alerting)

**AI/ML:**
- OpenAI GPT-4 Turbo
- Anthropic Claude Sonnet 4
- AWS Textract (OCR)
- spaCy (NER)
- ONNX Runtime (WASM)

**Design:**
- Figma (UI mockups)
- Plotly (charts)
- ImageMagick (image processing)

---

## **Final Checklist**

**Before Starting (Week 0):**
- [ ] Budget approved ($9,458 or $19,458)
- [ ] Time commitment clear (50-65 hours/week × 14 weeks)
- [ ] Legal entity formed (LLC)
- [ ] AWS account created
- [ ] Development environment working

**During Development:**
- [ ] Daily standup (even solo, for accountability)
- [ ] Weekly review (check metrics, adjust plan)
- [ ] Go/No-Go decisions made (Week 4, 8, 13)
- [ ] Beta testers recruited (Week 10)

**Before Launch:**
- [ ] All success criteria met
- [ ] Load tested (500 concurrent)
- [ ] Legal docs reviewed
- [ ] Marketing materials ready
- [ ] Can handle failure (emotional prep)

**Launch Day:**
- [ ] Product Hunt submitted
- [ ] Reddit posts live
- [ ] Monitoring dashboard open
- [ ] Support inbox ready
- [ ] Champagne on ice 🍾

---

**END OF IMPLEMENTATION PLAN**

This plan is designed to be **actionable**. Print it, put it on your wall, check boxes as you go. Adjust as needed, but stick to the critical path.

Good luck building Subtext 2.1. You've got this. 🚀