# SubText User Stories

**Product:** SubText 2.1 - Relationship Intelligence Platform
**Version:** 2.1.0
**Date:** February 2026
**Status:** Pre-Development

---

## Pricing Overview

| Product | Price | Model |
|---------|-------|-------|
| Free Analysis | $0 | Free for every conversation |
| Pro Features | $20 | Per conversation — unlocks Deep Analysis, MRI (2 free queries), Chat Recommender access |
| MRI Unlimited | +$10 | Per conversation — unlimited MRI Q&A after 2 free queries |
| Chat Recommendation | Variable | Pay-per-use (token-level Stripe metered billing) |

---

## Epic 1: New User Journey

### US-1.1 — Account Creation and Offering Display

**As a** new user visiting SubText,
**I want to** create an account and see the available offerings,
**so that** I can understand what features are available and choose my path.

**Acceptance Criteria:**
- User can register with email + password
- After registration/login, user sees the offering page with two clear options:
  - **Analysis** (Free) — basic relationship analysis
  - **Pro Features** ($20/conversation) — unlocks:
    - Deep Analysis
    - MRI (+$10 additional for unlimited) — ask questions, get answers. 2 free queries included, $10 additional for unlimited
    - Chat Recommendation (token-level additional cost per use)
- Pricing and feature descriptions are clearly visible
- User can click on either option to proceed to chat upload

**UI Flow:**
```
Landing Page → Sign Up / Login → Offering Page
                                    ├── "Analysis (Free)" → Upload Flow
                                    └── "Pro Features ($20)" → Upload Flow
```

---

### US-1.2 — Chat Upload Flow

**As a** user (free or Pro),
**I want to** upload my chat conversation from various messaging platforms,
**so that** I can get it analyzed.

**Acceptance Criteria:**
- After clicking either option (Analysis or Pro), user is prompted to upload chat data
- User sees platform-specific upload directions (WhatsApp, iMessage, Telegram, Instagram, SMS, etc.)
- Supported formats: TXT, CSV, JSON, ZIP, screenshots (PNG, JPG, HEIC)
- Drag-and-drop upload zone with progress indicator
- Client-side PII masking and encryption before upload
- Click "Upload" to submit and trigger analysis pipeline

**UI Flow:**
```
Offering Page → Select Platform → See Upload Directions → Upload Files → Click "Upload"
```

---

### US-1.3 — Analysis Results with Tabbed Interface

**As a** user who has uploaded a chat,
**I want to** see my analysis results with all feature options displayed as tabs at the top,
**so that** I can navigate between different types of analysis.

**Acceptance Criteria:**
- After analysis completes, user sees a tabbed interface at the top:
  - **Analysis** (default, always accessible)
  - **Deep Analysis** (locked for free users, accessible for Pro)
  - **MRI** (locked for free users, accessible for Pro)
  - **Chat Recommender** (locked for free users, accessible for Pro)
- The Analysis tab displays the free analysis results
- Locked tabs show a lock icon and "Upgrade to Pro — $20" CTA
- Clicking a locked tab prompts payment
- Once payment is received, tabs unlock immediately (no page refresh)

**UI Flow:**
```
Upload Complete → Analysis Processing → Results Page
                                          ┌─────────────────────────────────────────────────┐
                                          │  [Analysis]  [Deep Analysis🔒]  [MRI🔒]  [Chat Rec🔒]  │
                                          ├─────────────────────────────────────────────────┤
                                          │                                                 │
                                          │          Free Analysis Results                  │
                                          │                                                 │
                                          └─────────────────────────────────────────────────┘
```

---

### US-1.4 — Deep Analysis (Pro Feature)

**As a** Pro user,
**I want to** run a deep analysis on my uploaded chat,
**so that** I get comprehensive multi-agent forensic insights.

**Acceptance Criteria:**
- Deep Analysis tab shows a "Run" button for Pro users
- Clicking "Run" triggers the full multi-agent analysis pipeline (Scout, Clinician, Pattern Matcher, Historian, Auditor)
- Progress indicator shown during processing
- Results displayed inline within the tab (not as PDF download)
- Results are saved and persist when user returns later
- Free users see a locked state with upgrade CTA

**UI Layout:**
```
┌─────────────────────────────────┐
│  Deep Analysis Tab              │
│                                 │
│  [ Run Deep Analysis ]          │
│                                 │
│  --- After Run ---              │
│  Gottman Scorecard              │
│  Attachment Map                 │
│  Communication Audit            │
│  Pattern Analysis               │
│  Red Flags Report               │
│  Action Guide                   │
└─────────────────────────────────┘
```

---

### US-1.5 — MRI Q&A (Pro Feature)

**As a** Pro user,
**I want to** ask questions about my relationship/chat and receive AI-powered answers,
**so that** I can get targeted insights about specific concerns.

**Acceptance Criteria:**
- MRI tab shows a question input box and an answer display area
- User types a question and submits it
- AI responds using the uploaded chat context (conversation-aware)
- First 2 queries are free (included with Pro $20)
- Query counter displayed: "2 of 2 free queries remaining" → "0 of 2 free queries remaining"
- After 2 free queries, paywall appears: "Unlock Unlimited MRI — $10"
- After $10 payment, unlimited queries enabled for this conversation
- Q&A history is preserved and displayed (most recent at bottom)
- Free users see a locked state with upgrade CTA

**UI Layout:**
```
┌─────────────────────────────────┐
│  MRI Tab                        │
│                                 │
│  Q&A History:                   │
│  Q: "Is there a demand/withdraw │
│      pattern in our chats?"     │
│  A: "Based on the analysis..."  │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Ask a question...       │    │
│  └─────────────────────────┘    │
│  [Submit]    1 of 2 free left   │
└─────────────────────────────────┘
```

---

### US-1.6 — Chat Recommender (Pro Feature)

**As a** Pro user,
**I want to** upload a screenshot of a conversation and get a recommended reply,
**so that** I know how to respond effectively.

**Acceptance Criteria:**
- Chat Recommender tab shows a screenshot upload area at the top
- Below the upload area, an answer/recommendation box
- User uploads a screenshot → AI analyzes it in context of the existing chat data
- Recommended reply displayed below the screenshot
- Billed per use at token-level cost via Stripe metered billing
- Cost estimate shown before processing (e.g., "Estimated cost: $0.15")
- History of past recommendations preserved
- Free users see a locked state with upgrade CTA

**UI Layout:**
```
┌─────────────────────────────────┐
│  Chat Recommender Tab           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Upload Screenshot      │    │
│  │  [Drop image here]      │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Recommended Reply:     │    │
│  │  "Based on the context, │    │
│  │   you could respond..." │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

### US-1.7 — Payment Flows

**As a** user,
**I want to** pay for Pro features or MRI unlimited,
**so that** I can access advanced analysis capabilities.

**Acceptance Criteria:**

**Pro Features ($20/conversation):**
- Triggered when user clicks a locked tab or selects Pro on offering page
- Stripe Checkout with clear description: "Pro Features for [Contact Name] conversation — $20"
- Upon successful payment, all three tabs unlock for that specific conversation
- Payment recorded with conversation_id in metadata

**MRI Unlimited (+$10/conversation):**
- Triggered after 2 free MRI queries are exhausted
- Inline paywall within MRI tab: "Unlock Unlimited MRI — $10"
- Upon payment, query counter removed, unlimited queries enabled
- Applies only to the current conversation

**Chat Recommender (pay-per-use):**
- Stripe metered billing — charges accumulate based on token usage
- Cost estimate shown before each recommendation is generated
- User confirms before processing

---

## Epic 2: Returning User Journey

### US-2.1 — Chat-Based Dashboard

**As a** returning user,
**I want to** see all my previously analyzed conversations grouped by person,
**so that** I can quickly find and resume previous analyses.

**Acceptance Criteria:**
- After login, dashboard shows all conversations grouped by contact (Person A, Person B, Person C)
- Each conversation card displays:
  - Contact name (anonymized)
  - Last analysis date
  - Pro status (Free / Pro / Pro + MRI Unlimited)
  - Number of MRI queries used
  - Quick preview of analysis status
- "New Analysis" button to start a new conversation upload
- Conversations sorted by most recent activity

**UI Layout:**
```
┌─────────────────────────────────────────┐
│  My Conversations          [+ New Analysis]  │
│                                              │
│  ┌──────────────────────────────────┐        │
│  │ Person A          Pro ✓          │        │
│  │ Last analyzed: Feb 10, 2026      │        │
│  │ 3 MRI queries · Deep Analysis ✓  │        │
│  └──────────────────────────────────┘        │
│                                              │
│  ┌──────────────────────────────────┐        │
│  │ Person B          Free           │        │
│  │ Last analyzed: Feb 5, 2026       │        │
│  │ Analysis only                    │        │
│  └──────────────────────────────────┘        │
│                                              │
│  ┌──────────────────────────────────┐        │
│  │ Person C          Pro + MRI ∞    │        │
│  │ Last analyzed: Jan 28, 2026      │        │
│  │ 12 MRI queries · Chat Rec ×5    │        │
│  └──────────────────────────────────┘        │
└──────────────────────────────────────────────┘
```

---

### US-2.2 — Resume Previous Conversation Analysis

**As a** returning user,
**I want to** select a previous conversation and see all my analysis, MRI, and chat recommendations,
**so that** I can continue from where I left off.

**Acceptance Criteria:**
- Clicking a conversation opens the tabbed analysis view
- Default tab: **Analysis** (always shown first)
- Top tabs: Analysis | Deep Analysis | MRI | Chat Recommender
- If user has not purchased Pro for this conversation, tabs are locked with upgrade CTA
- If user has Pro:
  - Deep Analysis tab shows previous results (or "Run" button if not yet run)
  - MRI tab shows full Q&A history with input box for new questions
  - Chat Recommender tab shows history of past recommendations with upload for new ones
- All state is fully preserved between sessions

---

### US-2.3 — Locked Tab Experience for Free Users

**As a** free user viewing a conversation,
**I want to** see what Pro features are available (even if locked),
**so that** I understand the value of upgrading.

**Acceptance Criteria:**
- Free users see all 4 tabs but Deep Analysis, MRI, and Chat Recommender show a lock icon
- Clicking a locked tab shows:
  - Brief description of the feature
  - Sample/preview of what the output looks like (blurred or teaser)
  - Clear CTA: "Unlock Pro Features — $20"
  - Payment flow triggers on click
- After payment, tabs unlock without page reload

---

### US-2.4 — Add New Chat Data to Existing Conversation

**As a** returning user,
**I want to** upload additional chat data to an existing conversation,
**so that** the analysis reflects the latest messages.

**Acceptance Criteria:**
- Within a conversation view, "Add More Data" button available
- Upload additional files to the same conversation
- Timeline re-stitched with new messages
- Free analysis re-runs automatically
- Deep Analysis shows "New data available — Re-run?" prompt
- MRI queries continue to work with updated context
- Pro purchase status carries over (no need to re-purchase)

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Insufficient data (<50 messages) | Show warning, allow free analysis only, block Deep Analysis with explanation |
| Screenshot OCR failure | Show error message, suggest retaking screenshot with clearer image |
| Concurrent MRI queries | Queue sequentially, show "Processing previous question..." indicator |
| Token budget exceeded (Chat Recommender) | Show cost estimate before processing, require user confirmation |
| Non-English content | Detect language, inform user of limitations, process with best-effort |
| Payment failure mid-flow | Retain unlock state, retry payment, show clear error |
| User uploads same chat twice | Detect duplicates, ask to merge or create new conversation |
| Abuse/severe patterns detected | Prioritize safety resources (hotlines, crisis support), then show analysis |

---

## Data Model Changes

### New Tables

**`conversations`**
| Column | Type | Description |
|--------|------|-------------|
| conversation_id | UUID (PK) | Unique conversation identifier |
| user_id | UUID (FK → users) | Owner |
| contact_name | VARCHAR | Anonymized contact name (Person A, etc.) |
| pro_purchased | BOOLEAN | Whether Pro is active for this conversation |
| pro_purchased_at | TIMESTAMP | When Pro was purchased |
| mri_queries_used | INTEGER | Number of MRI queries used (default 0) |
| mri_unlimited | BOOLEAN | Whether unlimited MRI is active (default false) |
| mri_unlimited_purchased_at | TIMESTAMP | When MRI unlimited was purchased |
| created_at | TIMESTAMP | Creation time |
| last_analyzed_at | TIMESTAMP | Last analysis timestamp |

**`mri_queries`**
| Column | Type | Description |
|--------|------|-------------|
| query_id | UUID (PK) | Unique query identifier |
| conversation_id | UUID (FK → conversations) | Parent conversation |
| user_id | UUID (FK → users) | Query author |
| question | TEXT | User's question |
| answer | TEXT | AI-generated answer |
| created_at | TIMESTAMP | Query timestamp |

**`chat_recommendations`**
| Column | Type | Description |
|--------|------|-------------|
| recommendation_id | UUID (PK) | Unique recommendation identifier |
| conversation_id | UUID (FK → conversations) | Parent conversation |
| user_id | UUID (FK → users) | User |
| screenshot_url | VARCHAR | S3 URL of uploaded screenshot |
| recommendation | TEXT | AI-generated recommended reply |
| tokens_used | INTEGER | Tokens consumed |
| cost_cents | INTEGER | Cost in cents |
| created_at | TIMESTAMP | Timestamp |

### Modified Tables

**`users`** — No subscription fields needed (Pro is per-conversation, tracked in `conversations`)

**`cases`** — Add columns:
- `conversation_id` (UUID FK → conversations) — links case to conversation
- `case_type` values updated: `'analysis' | 'deep_analysis' | 'mri_query' | 'chat_recommendation'`

**`payments`** — Add product types:
- `'pro_features'` ($20/conversation)
- `'mri_unlimited'` ($10/conversation)
- `'chat_recommendation'` (variable amount)
- Remove: `'tactical_scan_pro'`, `'mri'`, `'mri_expedited'`
