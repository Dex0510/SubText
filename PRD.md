Subtext 2.1: Complete Technical Documentation

PART 1: PRD (Product Requirements Document)
Product Requirements Document
Product: Subtext 2.1 - The Relationship Intelligence Laboratory
Version: 2.1.0
Date: February 2026
Owner: Product Team
Status: Pre-Development

1. Executive Summary
1.1 Product Vision
Subtext is a forensic intelligence platform that analyzes digital communication data to provide clinical-grade relationship insights. It is NOT a chatbot or coaching tool—it is a diagnostic laboratory that ingests objective data and produces evidence-based analysis.
1.2 Product Mission
To eliminate the "Am I crazy?" cognitive dissonance in relationships by providing objective, privacy-first, forensic analysis of digital communication patterns.
1.3 Success Metrics

Revenue Target: $50,000/month within 18 months
User Acquisition: 2,000+ Pro upgrades/month (across conversations)
Viral Coefficient: 0.25+ (each user brings 0.25 new users)
Share Rate: 25-30% of users share results publicly
Conversion Rate: 20-30% from free Analysis to Pro Features ($20/conversation)
Analysis Quality: 4.5+ star average rating
Month 2 Retention: 15%+ (for repeat analysis on new conversations)
MRI Unlimited Upgrade Rate: 40%+ of Pro users purchase unlimited MRI ($10/conversation)
Chat Recommender Adoption: 30%+ of Pro users use Chat Recommender at least once


2. Problem Statement
2.1 User Pain Points
Primary Persona: "The Anxious Detective"

Demographics: 24-38 years old, 75% female, urban/suburban
Psychographics: High emotional intelligence, therapy-aware, tech-comfortable
Situation: In ambiguous relationship ("situationship"), experiencing mixed signals
Pain: Cognitive dissonance between what they observe and what partner claims

Specific Problems:

The Gaslighting Gap: Partner denies events the user remembers clearly; no objective record exists
The Texting Black Box: Cannot decode silence, vague replies, or mixed signals objectively
The Friend Filter: Friends are biased; user needs clinical, unbiased third-party analysis
The Privacy Barrier: Afraid to share intimate conversations with human analysts

2.2 Existing Solutions & Gaps
SolutionLimitationChatGPT/ClaudeGeneric advice, no memory, requires manual context, safety-biased responsesTherapyExpensive ($150/session), relies on user's subjective account, no data analysisFriendsBiased, not clinical, privacy concernsSelf-analysisCompromised judgment due to emotional involvement
Key Gap: No tool exists that provides objective, data-driven, privacy-first forensic analysis of relationship communication patterns.

3. Product Overview
3.1 Product Positioning
What Subtext IS:

A forensic data laboratory
A relationship MRI scanner
An objective pattern analyzer
A privacy-first intelligence platform

What Subtext IS NOT:

A chatbot or AI companion
A therapy replacement
A coaching or advice service
A relationship improvement tool

3.2 Core Value Proposition

"Don't guess. Know. Get a clinical-grade forensic analysis of your relationship—completely private, data-driven, and objective."

3.3 Key Differentiators

Zero-Knowledge Architecture: We literally cannot see user data
Multi-Agent Verification: Council of specialized AI agents with blind review
Forensic Rigor: 90%+ confidence through automated fact-checking
Timeline Intelligence: Retroactive insights from stitched chronological data
Per-Conversation Pricing: Pay only for conversations you want deep insights on — no subscription lock-in


4. Product Requirements
4.1 Product A: Free Analysis (Lead Magnet)
Purpose: Low-friction entry point — upload any chat conversation and get a basic analysis for free
Input Requirements:

Chat exports from WhatsApp, iMessage, Telegram, Instagram, SMS (.txt, .zip)
Screenshots (PNG, JPG, HEIC) — batch upload, max 100 files
CSV/JSON text logs
Combined inputs (any mix of above)
Maximum total upload: 500MB

Processing Requirements:

Client-side PII detection and masking
OCR extraction with 95%+ accuracy (for screenshots)
Text normalization and timestamp parsing
Timeline stitching across sources
Scout Agent triage (identify hot zones and basic patterns)
Processing time: <5 minutes

Output Requirements:
Free Analysis results displayed inline (Analysis tab) including:

Overall Relationship Health Indicator (Healthy / Moderate / Concerning)
Top 3 detected communication patterns
Message frequency and response latency overview
Key hot zones identified (high-conflict episodes)
Basic tone analysis (positive/neutral/negative distribution)
Confidence scores for each finding

Format Requirements:

Mobile-responsive web view (inline in Analysis tab)
No PDF download for free tier
Shareable anonymized insight cards (Instagram Story size: 1080x1920)

Privacy Requirements:

Client-side PII detection and masking
No server-side storage of original content
Ephemeral processing (data deleted after 24 hours)

Pricing:

Free — no payment required
Unlimited free analyses across conversations

Conversion Goal:

20-30% conversion to Pro Features ($20/conversation) within 7 days


4.2 Product B: Pro Features (Core Revenue — $20/conversation)
Purpose: Unlock advanced analysis capabilities for a specific conversation
Pro Features unlocks three capabilities per conversation:

4.2.1 Deep Analysis
Purpose: Comprehensive multi-agent forensic analysis of relationship dynamics
Trigger: User clicks "Run" button in the Deep Analysis tab (requires Pro)
Input: Uses the chat data already uploaded in the conversation

Processing Requirements (Deep Analysis):
Uses the same multi-agent pipeline as described in Free Analysis, but runs the FULL council:

Stage 1: Scout Agent identifies 5-10 critical episodes (hot zones)
Stage 2: Multi-Agent Council (parallel execution):
  - Clinician Agent: Gottman's Four Horsemen coding (Criticism, Contempt, Defensiveness, Stonewalling)
  - Pattern Matcher Agent: Systems theory, attachment dynamics, Demand/Withdraw cycles
  - Historian Agent: Longitudinal timeline analysis, recurring themes, turning points
Stage 3: Forensic Auditor verifies all claims, calculates confidence scores, VETOs <70% confidence

Total Processing Time: 10-20 minutes

Output Requirements (Deep Analysis):
Results displayed inline in the Deep Analysis tab (NOT as PDF):

Executive Summary: Health score (0-100), top 3 patterns, risk level
Gottman Scorecard: Four Horsemen frequency with examples and baseline comparison
Attachment Map: Attachment styles, pronoun analysis, emotional bid patterns
Communication Audit: Tone distribution, vocabulary patterns, turn-taking balance
Event Log: 5-10 critical episodes with context, triggers, resolution
Red Flags Report: Manipulation tactics with confidence scores and evidence
Longitudinal Analysis: Relationship trajectory, recurring themes, predictions
Action Guide: Response scripts, improvement strategies, professional resources

Visualizations (rendered inline):
- Timeline graph (emotional velocity)
- Message frequency heatmap
- Gottman scorecard bar chart
- Interaction loop diagrams

4.2.2 MRI Q&A (Interactive Relationship Intelligence)
Purpose: Ask specific questions about the relationship and get AI-powered, context-aware answers
Trigger: User types a question in the MRI tab (requires Pro)
Input: User's question + full conversation context

Processing:
- Load conversation timeline and analysis context
- Construct targeted LLM prompt with conversation summary + user question
- Generate nuanced, evidence-based answer using Claude Sonnet
- Processing time: 10-30 seconds per query

Output: AI-generated answer displayed in Q&A thread format
- Cites specific evidence from the conversation
- Provides confidence level
- Q&A history preserved and scrollable

Pricing:
- 2 free MRI queries included with Pro ($20/conversation)
- Unlimited MRI queries: +$10/conversation

4.2.3 Chat Recommender (Tactical Reply Assistant)
Purpose: Upload a screenshot of a recent message and get an AI-recommended reply
Trigger: User uploads screenshot in Chat Recommender tab (requires Pro)
Input: Screenshot image + conversation context

Processing:
- OCR the screenshot (AWS Textract)
- Analyze in context of existing conversation data
- Generate empathetic, strategically sound recommended reply
- Processing time: 15-45 seconds

Output: Recommended reply text displayed below the screenshot upload
- Explains reasoning behind the recommendation
- Provides alternative phrasings
- History of past recommendations preserved

Pricing:
- Pay-per-use: Token-level cost via Stripe metered billing
- Cost estimate shown before processing (e.g., "Est. cost: $0.15")
- User confirms before processing

Overall Pro Features Pricing:

Pro Features: $20/conversation (unlocks Deep Analysis + 2 MRI queries + Chat Recommender access)
MRI Unlimited: +$10/conversation (unlimited MRI Q&A after 2 free queries)
Chat Recommender: Pay-per-use (token-level cost, Stripe metered billing)

Privacy Requirements:

All processing uses tokenized data
Client-side encryption maintained
Ephemeral storage for conversation data
MRI Q&A and recommendations stored in PostgreSQL (anonymized)
User can delete all data on demand


4.3 Feature: Universal Case File System
Purpose: Handle messy real-world data uploads seamlessly
Requirements:
The Timeline Stitcher:

Accept uploads in any order
Parse timestamps from:

EXIF data (images)
OCR text extraction
File metadata
Manual user input (fallback)


Normalize to single timezone (user's local time)
Merge duplicate messages
Detect and flag gaps in timeline
Generate unified chronological stream

The Retro-Active Insight Engine:

Trigger: New historical data added after initial analysis
Action: Re-analyze previous findings with new context
Output: "Update Notification" with new insights
Example: "The screenshot you uploaded yesterday now makes sense—it's connected to the unresolved trust issue from March 2023"

Multi-Source Intelligence:

Cross-reference between sources
Image OCR → verify against text logs
Context enhancement (image shows location mentioned in text)
Conflict resolution (which source is authoritative?)


4.4 Feature: Zero-Knowledge Privacy Architecture
Purpose: Mathematical guarantee that Subtext cannot access user data
Requirements:
Client-Side Processing (The Airlock):

WebAssembly module runs in browser
PII detection algorithm:

Named Entity Recognition (NER) for names
Regex patterns for phone numbers, emails, addresses
Image analysis for faces (blur detected faces)


Semantic masking:

Replace detected entities with generic tokens
Maintain relationship structure ([Person A] always refers to same person)
Preserve context (location type, not specific location)


Generate encryption key (256-bit AES)
Store Identity Map locally (browser storage or encrypted download)
Send only tokenized data to server

Server-Side Blind Processing (The Enclave):

Receive tokenized data
Process using stateless functions
No persistent storage of identifiable data
Ephemeral compute (data purged after processing)
Audit logs (anonymized activity only)

Client-Side Decryption (The Unlock):

Download tokenized report + encrypted Identity Map
Use locally stored session key
Re-hydrate names/entities in browser
Display unredacted report
Option to save locally or print

Verification:

Open-source client-side code
Third-party security audit
Penetration testing
SOC 2 Type II compliance (future)

User Controls:

View what data is being masked (preview)
Manual corrections (if masking fails)
Permanent deletion (right to be forgotten)
Export encrypted data package


4.5 Non-Functional Requirements
Performance:

Free Analysis: <5 minutes processing
Deep Analysis: <20 minutes processing
MRI Q&A: <30 seconds per query
Chat Recommender: <45 seconds per recommendation
99.5% uptime SLA
<3 second page load time

Scalability:

Support 10,000 concurrent users
Process 1,000 reports/day capacity
Horizontal scaling capability
CDN for global access

Security:

SOC 2 Type II compliance (within 12 months)
End-to-end encryption
Zero-knowledge architecture
Regular penetration testing
Bug bounty program

Reliability:

Automated failover
Daily encrypted backups
Disaster recovery plan (RPO: 24 hours, RTO: 4 hours)
Error monitoring and alerting

Accessibility:

WCAG 2.1 AA compliance
Screen reader compatible
Keyboard navigation
Mobile responsive (iOS/Android)

Localization (Future):

English (US, UK, AU)
Spanish (MX, ES)
Portuguese (BR)
Support for non-Latin scripts (future)


5. User Stories

For comprehensive user stories with acceptance criteria, UI flows, and data model implications, see **user_stories.md**.

5.1 Core User Journeys (Summary)

Journey 1: New User — Free Analysis
As a new user, I want to create an account, upload a chat conversation, and get a free analysis so I can evaluate the platform.
Flow: Sign up → See offerings → Upload chat → Get free analysis in Analysis tab → See locked Pro tabs with upgrade CTA

Journey 2: New User — Pro Upgrade
As a user who has seen their free analysis, I want to upgrade to Pro ($20) so I can access Deep Analysis, MRI Q&A, and Chat Recommender for this conversation.
Flow: Click locked tab → Pay $20 → Tabs unlock → Run Deep Analysis / Ask MRI questions / Get chat recommendations

Journey 3: Returning User — Resume Session
As a returning user, I want to see all my conversations grouped by person, select one, and continue where I left off.
Flow: Login → Dashboard (Person A, B, C) → Click conversation → Tabbed view opens with previous state preserved

Journey 4: MRI Power User
As a Pro user who has used 2 free MRI queries, I want to purchase unlimited MRI queries ($10) so I can keep asking questions about my relationship.
Flow: Ask 3rd MRI question → Paywall shown → Pay $10 → Unlimited queries unlocked

Journey 5: The Privacy-Conscious User
As someone concerned about data privacy, I want complete control over my sensitive data, so that I can trust the platform with intimate conversations.
Acceptance Criteria:
- Clear explanation of zero-knowledge architecture
- Preview of masked data before submission
- Option to manually correct masking
- Download encrypted data package
- Permanent deletion on demand
- No human ever sees my data

5.2 Edge Cases
Edge Case 1: Insufficient Data
Given: User uploads only 10 messages
When: Attempting to run Deep Analysis
Then: System warns "Need at least 50 messages for reliable analysis"
And: Free analysis still runs, Deep Analysis blocked with explanation
Edge Case 2: Ambiguous Language
Given: Text contains heavy sarcasm or inside jokes
When: Pattern Matcher analyzes
Then: Flag as "Low confidence" with explanation
And: Request user context (optional)
Edge Case 3: Non-English Content
Given: User uploads Spanish conversation
When: Current version only supports English
Then: Detect language and inform user
And: Offer to join waitlist for Spanish support
Edge Case 4: Technical Abuse Detection
Given: Analysis detects severe abuse (threats, violence)
When: Analysis is generated
Then: Prioritize safety resources
And: Recommend immediate professional help
And: Suppress "relationship improvement" suggestions
Edge Case 5: Manipulated Uploads
Given: User cherry-picks messages to bias outcome
When: Historian detects timeline gaps
Then: Flag analysis as "Incomplete Data"
And: Note "Analysis limited by data availability"
Edge Case 6: MRI Query Limit Reached
Given: Pro user has used 2 free MRI queries
When: User tries to ask a 3rd question
Then: Show paywall "Unlock Unlimited MRI — $10"
And: Previous Q&A history remains visible
Edge Case 7: Chat Recommender OCR Failure
Given: User uploads blurry or unreadable screenshot
When: OCR processing fails
Then: Show error "Could not read screenshot. Please try a clearer image."
And: No charge applied

6. Success Criteria
6.1 Launch Criteria (MVP)
Must Have:

 Free Analysis functional (chat upload → inline analysis results)
 Pro Features functional (Deep Analysis, MRI Q&A, Chat Recommender)
 Tabbed analysis interface (Analysis | Deep Analysis | MRI | Chat Recommender)
 Conversation-based dashboard (grouped by person)
 Zero-knowledge encryption working
 Payment processing (Stripe — Pro $20/conversation, MRI Unlimited $10, Chat Recommender metered)
 Mobile-responsive web app
 Basic analytics (conversion tracking)
 Legal ToS/Privacy Policy
 95%+ uptime in beta

Should Have:

 Timeline stitching (multi-source)
 Shareable cards generation
 Email notifications (analysis complete, Pro features unlocked)
 User account system with conversation management
 Basic SEO optimization

Could Have:

 Voice message analysis
 Comparative analysis (multiple conversations side-by-side)
 iOS/Android apps
 API for partners

Won't Have (v1):

Video call analysis
Multi-language support
Therapist portal
Group chat analysis


6.2 Success Metrics (First 6 Months)
Acquisition:

10,000+ free analyses completed
3,000+ Pro upgrades ($20/conversation)
CAC <$40
50,000+ website visitors

Activation:

60%+ complete upload process
80%+ successfully view analysis results
20-30% conversion (free → Pro)

Engagement:

25%+ share results publicly
4.5+ average rating
<5% refund rate
50+ organic social mentions
40%+ of Pro users purchase MRI Unlimited
30%+ of Pro users try Chat Recommender

Revenue:

$50k+ MRR
90%+ gross margin
LTV:CAC >1.5
10%+ month-over-month growth

Retention:

15%+ analyze second conversation
5%+ recommend to friend
40%+ return to site within 30 days (higher due to MRI Q&A and Chat Recommender ongoing use)


7. Out of Scope (v1)
Not Building:

Live chat or AI companion features
Behavioral change coaching or therapy
Couples mode (two-sided analysis)
Integration with messaging apps (WhatsApp API)
Mobile apps (iOS/Android native)
Video analysis (FaceTime, Zoom calls)
Voice-only conversation analysis
Group chat analysis (3+ people)
Professional/work relationship analysis
Social media post analysis
Dating app message analysis (requires API partnerships)

Deferred to Future Versions:

Multi-language support (Spanish, Portuguese, etc.)
Therapist portal and B2B features
API for third-party integrations
White-label licensing
Enterprise/corporate wellness version
Insurance billing integration
Outcome tracking (did user leave relationship?)
Community features (forums, support groups)


8. Risks & Mitigations
RiskImpactProbabilityMitigationPoor insight quality (generic/obvious)CRITICALHigh (40%)Manual testing with 50+ real users before launch; A/B test report formatsViral coefficient <0.15HIGHMedium (30%)Optimize shareability; influencer partnerships; paid ads as backupLegal liability (bad advice)HIGHLow (15%)Strong disclaimers; E&O insurance; lawyer review; never claim to "diagnose"Privacy breachCRITICALVery Low (5%)Security audit; penetration testing; bug bounty; open-source client codeCompetition copies in 6 monthsMEDIUMHigh (60%)Move fast; build brand; create data moat; lock in partnershipsFalse positive (wrong analysis)MEDIUMMedium (25%)Confidence scores; verification layer; "patterns consistent with" languageEthical misuse (weaponization)MEDIUMMedium (20%)Abuse detection; safety resources; right to refuse serviceFounder burnoutMEDIUMLow (10%)Automate support; set boundaries; hire early; take breaks

9. Timeline & Milestones
Phase 1: Validation (Weeks 1-4)

 Manual analysis of 50 real conversations
 Create 50 hand-crafted reports
 User feedback sessions (20 people)
 Iterate on report format (5+ versions)
Go/No-Go Decision: 40%+ say "This is exactly what I needed"

Phase 2: MVP Development (Weeks 5-14)

 Client-side encryption module
 Screenshot OCR pipeline
 Free Analysis pipeline (Scout Agent)
 Tabbed analysis viewer (Analysis | Deep Analysis | MRI | Chat Recommender)
 Pro Features: Deep Analysis (full multi-agent pipeline), MRI Q&A, Chat Recommender
 Conversation-based dashboard (grouped by person)
 Payment integration (Stripe: $20 Pro/conversation, $10 MRI unlimited, metered Chat Recommender)
 Landing page + blog
Launch: Private beta (100 users)

Phase 3: Public Launch (Weeks 15-18)

 Timeline stitcher
 Multi-agent council
 Verification layer
 Shareable cards
 SEO content (20 posts)
Launch: Product Hunt + Reddit
Target: 500 free analyses, 100 Pro upgrades

Phase 4: Scale (Weeks 19-52)

 Paid acquisition ($5k/month)
 Content machine (50+ posts)
 Viral optimization (10+ A/B tests)
 Voice message add-on
 Comparative analysis
 Therapist partnerships (5+)
Target: $50k/month revenue


10. Appendix
10.1 Glossary

Free Analysis: Basic relationship analysis from uploaded chat data (free product, lead magnet)
Pro Features: Per-conversation unlock ($20) granting access to Deep Analysis, MRI Q&A, and Chat Recommender
Deep Analysis: Comprehensive multi-agent forensic analysis using the full Council pipeline (Pro feature)
MRI Q&A: Interactive question-and-answer interface for targeted relationship insights (Pro feature, 2 free + $10 unlimited)
Chat Recommender: Screenshot-based reply recommendation engine (Pro feature, pay-per-use)
Conversation: A grouped set of uploaded chat data from one relationship/contact (e.g., "Person A")
The Council: Multi-agent AI system (Clinician, Pattern Matcher, Historian)
The Forensic Auditor: Verification agent that fact-checks Council findings
Zero-Knowledge: Architecture where service provider cannot access user data
Timeline Stitching: Merging multi-source uploads into chronological sequence
Retroactive Insight: New analysis triggered when historical data is added
Red Flag: Specific pattern indicating potential manipulation or toxicity
Four Horsemen: Gottman's predictors of relationship failure (Criticism, Contempt, Defensiveness, Stonewalling)
DARVO: Deny, Attack, Reverse Victim and Offender (manipulation tactic)

10.2 References

Gottman, J. M. (1994). What Predicts Divorce?
Johnson, S. (2008). Hold Me Tight: Seven Conversations for a Lifetime of Love
Levine, A., & Heller, R. (2010). Attached: The New Science of Adult Attachment
Walker, P. (2013). Complex PTSD: From Surviving to Thriving
Herman, J. (1992). Trauma and Recovery