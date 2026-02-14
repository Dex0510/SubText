import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { ConversationModel } from '../models/Conversation';
import { CaseModel } from '../models/Case';
import { MriQueryModel } from '../models/MriQuery';
import { ChatRecommendationModel } from '../models/ChatRecommendation';
import { StorageService } from '../services/storage';
import { jobQueue } from '../services/jobQueue';

const router = Router();

// Run Deep Analysis for a conversation (Pro feature)
router.post(
  '/:conversationId/deep-analysis',
  authenticateJWT,
  rateLimit(5, 60),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const conversation = await ConversationModel.findById(req.params.conversationId);

      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      if (!conversation.pro_purchased) {
        res.status(403).json({ error: 'Pro features required. Unlock for $20.' });
        return;
      }

      // Check if there's already a completed or running deep analysis
      const existingCase = await CaseModel.findByConversationAndType(
        conversation.conversation_id, 'deep_analysis'
      );
      if (existingCase && (existingCase.status === 'processing' || existingCase.status === 'queued')) {
        res.status(409).json({
          error: 'Deep analysis is already in progress',
          case_id: existingCase.case_id,
        });
        return;
      }

      // Find the latest analysis case to get the timeline data
      const analysisCase = await CaseModel.findByConversationAndType(
        conversation.conversation_id, 'analysis'
      );
      if (!analysisCase || analysisCase.status !== 'completed') {
        res.status(400).json({ error: 'Free analysis must be completed first' });
        return;
      }

      // Create deep analysis case
      const caseRecord = await CaseModel.create(
        userId, 'deep_analysis', 0, {
          source_case_id: analysisCase.case_id,
        }, conversation.conversation_id
      );

      // Queue deep analysis job
      const jobId = await jobQueue.addJob({
        type: 'process_analysis',
        case_id: caseRecord.case_id,
        analysis_type: 'deep_analysis',
        user_id: userId,
      });

      res.status(201).json({
        case_id: caseRecord.case_id,
        job_id: jobId,
        status: 'queued',
        estimated_time_minutes: 20,
      });
    } catch (err) {
      console.error('Deep analysis error:', err);
      res.status(500).json({ error: 'Failed to start deep analysis' });
    }
  }
);

// Submit MRI query (Pro feature)
router.post(
  '/:conversationId/mri-query',
  authenticateJWT,
  rateLimit(30, 60),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const { question } = req.body;
      const conversation = await ConversationModel.findById(req.params.conversationId);

      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      if (!conversation.pro_purchased) {
        res.status(403).json({ error: 'Pro features required. Unlock for $20.' });
        return;
      }

      if (!question || question.trim().length === 0) {
        res.status(400).json({ error: 'Question is required' });
        return;
      }

      // Check if user has free queries left or unlimited
      const FREE_MRI_QUERIES = 2;
      if (!conversation.mri_unlimited && conversation.mri_queries_used >= FREE_MRI_QUERIES) {
        res.status(402).json({
          error: 'Free MRI queries exhausted',
          mri_queries_used: conversation.mri_queries_used,
          free_limit: FREE_MRI_QUERIES,
          requires_upgrade: true,
          upgrade_product: 'mri_unlimited',
          upgrade_price: 1000,
        });
        return;
      }

      // Create MRI query record
      const mriQuery = await MriQueryModel.create(
        conversation.conversation_id,
        userId,
        question.trim()
      );

      // Increment query count
      const newCount = await ConversationModel.incrementMriQueries(conversation.conversation_id);

      // Queue MRI query processing
      const jobId = await jobQueue.addJob({
        type: 'process_analysis',
        case_id: mriQuery.query_id, // Using query_id as case_id for the job
        analysis_type: 'mri_query',
        user_id: userId,
      });

      const freeRemaining = conversation.mri_unlimited ? null : Math.max(0, FREE_MRI_QUERIES - newCount);

      res.status(201).json({
        query_id: mriQuery.query_id,
        job_id: jobId,
        status: 'pending',
        mri_queries_used: newCount,
        free_remaining: freeRemaining,
        is_unlimited: conversation.mri_unlimited,
      });
    } catch (err) {
      console.error('MRI query error:', err);
      res.status(500).json({ error: 'Failed to submit MRI query' });
    }
  }
);

// Get MRI query result
router.get(
  '/:conversationId/mri-query/:queryId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const mriQuery = await MriQueryModel.findById(req.params.queryId);

      if (!mriQuery || mriQuery.user_id !== userId) {
        res.status(404).json({ error: 'Query not found' });
        return;
      }

      res.json({
        query_id: mriQuery.query_id,
        question: mriQuery.question,
        answer: mriQuery.answer,
        status: mriQuery.status,
        created_at: mriQuery.created_at,
      });
    } catch (err) {
      console.error('Get MRI query error:', err);
      res.status(500).json({ error: 'Failed to get MRI query' });
    }
  }
);

// Submit Chat Recommendation request (Pro feature)
router.post(
  '/:conversationId/chat-recommend',
  authenticateJWT,
  rateLimit(10, 60),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const { screenshot_key } = req.body;
      const conversation = await ConversationModel.findById(req.params.conversationId);

      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      if (!conversation.pro_purchased) {
        res.status(403).json({ error: 'Pro features required. Unlock for $20.' });
        return;
      }

      if (!screenshot_key) {
        res.status(400).json({ error: 'screenshot_key is required. Upload a screenshot first.' });
        return;
      }

      // Create recommendation record
      const recommendation = await ChatRecommendationModel.create(
        conversation.conversation_id,
        userId,
        screenshot_key
      );

      // Queue processing
      const jobId = await jobQueue.addJob({
        type: 'process_analysis',
        case_id: recommendation.recommendation_id,
        analysis_type: 'chat_recommendation',
        user_id: userId,
      });

      // Estimate cost (rough estimate based on typical token usage)
      const estimatedCostCents = 15; // ~$0.15

      res.status(201).json({
        recommendation_id: recommendation.recommendation_id,
        job_id: jobId,
        status: 'pending',
        estimated_cost_cents: estimatedCostCents,
      });
    } catch (err) {
      console.error('Chat recommend error:', err);
      res.status(500).json({ error: 'Failed to submit chat recommendation' });
    }
  }
);

// Get Chat Recommendation result
router.get(
  '/:conversationId/chat-recommend/:recommendationId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const recommendation = await ChatRecommendationModel.findById(req.params.recommendationId);

      if (!recommendation || recommendation.user_id !== userId) {
        res.status(404).json({ error: 'Recommendation not found' });
        return;
      }

      res.json({
        recommendation_id: recommendation.recommendation_id,
        recommendation: recommendation.recommendation,
        tokens_used: recommendation.tokens_used,
        cost_cents: recommendation.cost_cents,
        status: recommendation.status,
        created_at: recommendation.created_at,
      });
    } catch (err) {
      console.error('Get chat recommend error:', err);
      res.status(500).json({ error: 'Failed to get chat recommendation' });
    }
  }
);

export default router;
