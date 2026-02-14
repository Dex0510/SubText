import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ConversationModel } from '../models/Conversation';
import { CaseModel } from '../models/Case';
import { MriQueryModel } from '../models/MriQuery';
import { ChatRecommendationModel } from '../models/ChatRecommendation';
import { StorageService } from '../services/storage';

const router = Router();

// List all conversations for the authenticated user (dashboard)
router.get(
  '/',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const conversations = await ConversationModel.findByUserIdWithStats(userId);

      res.json({
        conversations: conversations.map(c => ({
          conversation_id: c.conversation_id,
          contact_name: c.contact_name,
          pro_purchased: c.pro_purchased,
          mri_queries_used: c.mri_queries_used,
          mri_unlimited: c.mri_unlimited,
          created_at: c.created_at,
          last_analyzed_at: c.last_analyzed_at,
          deep_analysis_completed: c.deep_analysis_completed,
          recommendation_count: c.recommendation_count,
        })),
      });
    } catch (err) {
      console.error('List conversations error:', err);
      res.status(500).json({ error: 'Failed to list conversations' });
    }
  }
);

// Get a single conversation with all its data
router.get(
  '/:conversationId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const conversation = await ConversationModel.findById(req.params.conversationId);

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      if (conversation.user_id !== userId) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      // Get cases for this conversation
      const cases = await CaseModel.findByConversationId(conversation.conversation_id);

      // Get analysis case and its report data
      const analysisCase = cases.find(c => c.case_type === 'analysis' && c.status === 'completed');
      const deepAnalysisCase = cases.find(c => c.case_type === 'deep_analysis' && c.status === 'completed');

      let analysisReport = null;
      let deepAnalysisReport = null;

      if (analysisCase) {
        analysisReport = await StorageService.getReport(analysisCase.case_id);
      }
      if (deepAnalysisCase) {
        deepAnalysisReport = await StorageService.getReport(deepAnalysisCase.case_id);
      }

      // Get MRI queries
      const mriQueries = await MriQueryModel.findByConversationId(conversation.conversation_id);

      // Get chat recommendations
      const chatRecommendations = await ChatRecommendationModel.findByConversationId(conversation.conversation_id);

      // Get encrypted identity map from the latest analysis case
      let encryptedIdentityMap = null;
      if (analysisCase) {
        encryptedIdentityMap = await StorageService.getEncryptedIdentityMap(analysisCase.case_id);
      }

      res.json({
        conversation,
        cases: cases.map(c => ({
          case_id: c.case_id,
          case_type: c.case_type,
          status: c.status,
          created_at: c.created_at,
          completed_at: c.completed_at,
        })),
        analysis_report: analysisReport,
        deep_analysis_report: deepAnalysisReport,
        mri_queries: mriQueries.map(q => ({
          query_id: q.query_id,
          question: q.question,
          answer: q.answer,
          status: q.status,
          created_at: q.created_at,
        })),
        chat_recommendations: chatRecommendations.map(r => ({
          recommendation_id: r.recommendation_id,
          recommendation: r.recommendation,
          tokens_used: r.tokens_used,
          cost_cents: r.cost_cents,
          status: r.status,
          created_at: r.created_at,
        })),
        encrypted_identity_map: encryptedIdentityMap,
      });
    } catch (err) {
      console.error('Get conversation error:', err);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  }
);

// Update conversation contact name
router.patch(
  '/:conversationId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const conversation = await ConversationModel.findById(req.params.conversationId);

      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      if (req.body.contact_name) {
        await ConversationModel.updateContactName(conversation.conversation_id, req.body.contact_name);
      }

      const updated = await ConversationModel.findById(conversation.conversation_id);
      res.json({ conversation: updated });
    } catch (err) {
      console.error('Update conversation error:', err);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  }
);

// Delete a conversation and all associated data
router.delete(
  '/:conversationId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;
      const conversation = await ConversationModel.findById(req.params.conversationId);

      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Clean up Redis data for all cases in this conversation
      const cases = await CaseModel.findByConversationId(conversation.conversation_id);
      for (const c of cases) {
        await StorageService.cleanupCase(c.case_id);
      }

      // Delete conversation (cascades to cases, mri_queries, chat_recommendations)
      await ConversationModel.deleteById(conversation.conversation_id);

      res.json({ message: 'Conversation and all associated data deleted' });
    } catch (err) {
      console.error('Delete conversation error:', err);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }
);

export default router;
