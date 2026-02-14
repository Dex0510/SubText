import { IngestionService } from './ingestion';
import { TimelineStitcher, Timeline } from './timeline';
import { StorageService } from './storage';
import { CaseModel } from '../models/Case';
import { MriQueryModel } from '../models/MriQuery';
import { ChatRecommendationModel } from '../models/ChatRecommendation';
import { ScoutAgent, ScoutFindings } from '../agents/scout';
import { ClinicianAgent } from '../agents/clinician';
import { PatternMatcherAgent } from '../agents/patternMatcher';
import { HistorianAgent } from '../agents/historian';
import { ForensicAuditor } from '../agents/auditor';
import { ReportGenerator } from './reportGenerator';

export type AnalysisType = 'analysis' | 'deep_analysis' | 'mri_query' | 'chat_recommendation';

export async function processAnalysis(
  caseId: string,
  analysisType: AnalysisType,
  progressCallback: (progress: number, stage: string) => void
): Promise<void> {
  try {
    // For mri_query and chat_recommendation, caseId is actually the query/recommendation ID
    if (analysisType === 'mri_query') {
      await processMriQuery(caseId, progressCallback);
      return;
    }
    if (analysisType === 'chat_recommendation') {
      await processChatRecommendation(caseId, progressCallback);
      return;
    }

    await CaseModel.updateStatus(caseId, 'processing');

    // Step 1: Retrieve files from Redis
    progressCallback(5, 'Retrieving files');
    const files = await StorageService.getFiles(caseId);

    if (analysisType === 'deep_analysis') {
      // Deep analysis uses timeline from the source analysis case
      await processDeepAnalysis(caseId, progressCallback);
      return;
    }

    if (!files) throw new Error('Files not found in storage');

    // Step 2: Ingestion - parse all files
    progressCallback(10, 'Parsing files');
    const ingestion = new IngestionService();
    const messages = await ingestion.processFiles(files);

    if (messages.length === 0) {
      throw new Error('No messages could be extracted from uploaded files');
    }

    // Step 3: Timeline stitching
    progressCallback(20, 'Building timeline');
    const stitcher = new TimelineStitcher();
    const timeline = stitcher.stitch(messages);

    await StorageService.storeTimeline(caseId, timeline);

    // Free Analysis path
    await processFreeAnalysis(caseId, timeline, messages, progressCallback);

    // Cleanup raw files from Redis
    await StorageService.storeFiles(caseId, []); // Clear file data
    progressCallback(100, 'Complete');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Processing failed for case ${caseId}:`, errorMessage);
    if (analysisType !== 'mri_query' && analysisType !== 'chat_recommendation') {
      await CaseModel.updateStatus(caseId, 'failed', errorMessage);
    }
    throw err;
  }
}

async function processFreeAnalysis(
  caseId: string,
  timeline: Timeline,
  messages: { content: string }[],
  progressCallback: (progress: number, stage: string) => void
): Promise<void> {
  // Scout Agent performs initial analysis
  progressCallback(40, 'Analyzing communication patterns');
  const scout = new ScoutAgent();
  const combinedText = messages.map(m => m.content).join('\n');
  const findings = await scout.analyzeTactical(combinedText);

  progressCallback(70, 'Generating analysis');
  await StorageService.storeFindings(caseId, 'scout', findings);

  // Generate inline report (JSON)
  const reportGenerator = new ReportGenerator();
  const reportData = reportGenerator.generateTacticalScanReport(caseId, findings as ScoutFindings & Record<string, unknown>, timeline);
  await StorageService.storeReport(caseId, reportData);

  progressCallback(90, 'Finalizing');
  await CaseModel.setReportUrl(caseId, `internal:${caseId}`);
}

async function processDeepAnalysis(
  caseId: string,
  progressCallback: (progress: number, stage: string) => void
): Promise<void> {
  const caseRecord = await CaseModel.findById(caseId);
  if (!caseRecord) throw new Error('Case not found');

  const sourceCaseId = (caseRecord.metadata as Record<string, string>)?.source_case_id;

  // Get timeline from source analysis case
  let timeline: Timeline | null = null;
  if (sourceCaseId) {
    timeline = await StorageService.getTimeline(sourceCaseId) as Timeline | null;
  }

  if (!timeline) {
    throw new Error('Source analysis timeline not found. Run free analysis first.');
  }

  if (timeline.total_count < 50) {
    throw new Error('Need at least 50 messages for deep analysis.');
  }

  // Step 1: Scout Agent (identify critical episodes)
  progressCallback(30, 'Identifying critical episodes');
  const scout = new ScoutAgent();
  const scoutFindings = await scout.analyze(timeline);
  await StorageService.storeFindings(caseId, 'scout', scoutFindings);

  // Step 2: Run specialist agents in parallel
  progressCallback(40, 'Running deep analysis');
  const clinician = new ClinicianAgent();
  const patternMatcher = new PatternMatcherAgent();
  const historian = new HistorianAgent();

  const [clinicianFindings, patternFindings, historianFindings] = await Promise.all([
    clinician.analyze(scoutFindings.hot_zones, timeline),
    patternMatcher.analyze(timeline),
    historian.analyze(timeline),
  ]);

  progressCallback(60, 'Storing analysis results');
  await Promise.all([
    StorageService.storeFindings(caseId, 'clinician', clinicianFindings),
    StorageService.storeFindings(caseId, 'pattern_matcher', patternFindings),
    StorageService.storeFindings(caseId, 'historian', historianFindings),
  ]);

  // Step 3: Forensic Auditor (verification)
  progressCallback(70, 'Verifying findings');
  const auditor = new ForensicAuditor();
  const verifiedFindings = await auditor.verify(
    {
      clinician: clinicianFindings,
      pattern_matcher: patternFindings,
      historian: historianFindings,
    },
    timeline
  );
  await StorageService.storeFindings(caseId, 'auditor', verifiedFindings);

  // Step 4: Generate deep analysis report (JSON)
  progressCallback(80, 'Generating deep analysis report');
  const reportGenerator = new ReportGenerator();
  const reportData = reportGenerator.generateMRIReport(caseId, {
    scout: scoutFindings,
    clinician: clinicianFindings,
    pattern_matcher: patternFindings,
    historian: historianFindings,
    auditor: verifiedFindings,
  }, timeline);

  await StorageService.storeReport(caseId, reportData);

  progressCallback(95, 'Finalizing');
  await CaseModel.setReportUrl(caseId, `internal:${caseId}`);
  progressCallback(100, 'Complete');
}

async function processMriQuery(
  queryId: string,
  progressCallback: (progress: number, stage: string) => void
): Promise<void> {
  try {
    await MriQueryModel.updateStatus(queryId, 'processing');
    progressCallback(10, 'Processing question');

    const query = await MriQueryModel.findById(queryId);
    if (!query) throw new Error('MRI query not found');

    // Get analysis context from the conversation
    const analysisCase = await CaseModel.findByConversationAndType(query.conversation_id, 'analysis');
    if (!analysisCase) throw new Error('No analysis data available for this conversation');

    const timeline = await StorageService.getTimeline(analysisCase.case_id);
    const report = await StorageService.getReport(analysisCase.case_id);

    progressCallback(30, 'Analyzing context');

    // Build context for the AI response
    const context = {
      question: query.question,
      timeline_summary: timeline ? JSON.stringify(timeline).substring(0, 5000) : 'No timeline data',
      analysis_summary: report ? JSON.stringify(report).substring(0, 5000) : 'No analysis data',
    };

    progressCallback(50, 'Generating answer');

    // TODO: Replace with actual LLM call using the context
    const answer = `Based on the analysis of your conversation, here's what I found regarding your question: "${query.question}"\n\n` +
      `The analysis data shows patterns in your communication that are relevant to your question. ` +
      `Please note that this is AI-generated analysis and should be discussed with a qualified professional for clinical guidance.\n\n` +
      `[This is a placeholder response. The full MRI Responder service will use your conversation context to provide detailed, evidence-based answers.]`;

    await MriQueryModel.updateAnswer(queryId, answer);
    progressCallback(100, 'Complete');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`MRI query processing failed for ${queryId}:`, errorMessage);
    await MriQueryModel.updateStatus(queryId, 'failed');
    throw err;
  }
}

async function processChatRecommendation(
  recommendationId: string,
  progressCallback: (progress: number, stage: string) => void
): Promise<void> {
  try {
    await ChatRecommendationModel.updateStatus(recommendationId, 'processing');
    progressCallback(10, 'Processing screenshot');

    const recommendation = await ChatRecommendationModel.findById(recommendationId);
    if (!recommendation) throw new Error('Chat recommendation not found');

    // Get screenshot data
    const screenshotFiles = await StorageService.getFiles(recommendation.screenshot_url || '');

    progressCallback(30, 'Analyzing conversation context');

    // Get analysis context
    const analysisCase = await CaseModel.findByConversationAndType(recommendation.conversation_id, 'analysis');
    const report = analysisCase ? await StorageService.getReport(analysisCase.case_id) : null;

    progressCallback(60, 'Generating recommendation');

    // TODO: Replace with actual OCR + LLM call
    const recommendedReply = `Based on the screenshot and your conversation history, here's a suggested response:\n\n` +
      `"I appreciate you sharing that with me. I've been thinking about this too, and I feel like we should have an open conversation about it."\n\n` +
      `[This is a placeholder. The full Chat Recommender will use OCR to read the screenshot and combine it with your conversation analysis for personalized recommendations.]`;

    const tokensUsed = 500;
    const costCents = 15; // ~$0.15

    await ChatRecommendationModel.updateRecommendation(
      recommendationId,
      recommendedReply,
      tokensUsed,
      costCents
    );

    progressCallback(100, 'Complete');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Chat recommendation processing failed for ${recommendationId}:`, errorMessage);
    await ChatRecommendationModel.updateStatus(recommendationId, 'failed');
    throw err;
  }
}
