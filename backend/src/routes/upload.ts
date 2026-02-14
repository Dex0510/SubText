import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { CaseModel } from '../models/Case';
import { ConversationModel } from '../models/Conversation';
import { StorageService } from '../services/storage';
import { jobQueue } from '../services/jobQueue';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
    files: 100,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/png', 'image/jpeg', 'image/heic',
      'text/plain', 'text/csv',
      'application/zip', 'application/json',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// Upload chat for analysis — creates conversation + free analysis case
router.post(
  '/analysis',
  authenticateJWT,
  rateLimit(10, 60),
  upload.array('files', 100),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const userId = req.user!.user_id;
      const platform = req.body.platform || 'unknown';
      const contactName = req.body.contact_name || 'Person A';
      const conversationId = req.body.conversation_id; // If adding data to existing conversation

      let conversation;
      if (conversationId) {
        // Adding data to existing conversation
        conversation = await ConversationModel.findById(conversationId);
        if (!conversation || conversation.user_id !== userId) {
          res.status(404).json({ error: 'Conversation not found' });
          return;
        }
      } else {
        // Create new conversation
        conversation = await ConversationModel.create(userId, contactName, { platform });
      }

      // Create case record (free analysis, price = 0)
      const caseRecord = await CaseModel.create(userId, 'analysis', 0, {
        file_count: files.length,
        platform,
      }, conversation.conversation_id);

      // Store files in Redis
      const fileData = files.map(file => ({
        filename: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer.toString('base64'),
      }));
      await StorageService.storeFiles(caseRecord.case_id, fileData);

      // Store encrypted identity map
      if (req.body.encrypted_identity_map) {
        await StorageService.storeEncryptedIdentityMap(
          caseRecord.case_id,
          JSON.parse(req.body.encrypted_identity_map)
        );
      }

      // Queue processing job
      const jobId = await jobQueue.addJob({
        type: 'process_analysis',
        case_id: caseRecord.case_id,
        analysis_type: 'analysis',
        user_id: userId,
        platform,
      });

      // Update conversation last_analyzed_at
      await ConversationModel.updateLastAnalyzed(conversation.conversation_id);

      res.status(201).json({
        conversation_id: conversation.conversation_id,
        case_id: caseRecord.case_id,
        job_id: jobId,
        status: 'queued',
        estimated_time_minutes: 5,
      });
    } catch (err) {
      console.error('Analysis upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// Upload screenshot for Chat Recommender
router.post(
  '/chat-recommend',
  authenticateJWT,
  rateLimit(20, 60),
  upload.single('screenshot'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No screenshot uploaded' });
        return;
      }

      const userId = req.user!.user_id;
      const conversationId = req.body.conversation_id;

      if (!conversationId) {
        res.status(400).json({ error: 'conversation_id is required' });
        return;
      }

      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation || conversation.user_id !== userId) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      if (!conversation.pro_purchased) {
        res.status(403).json({ error: 'Pro features required. Please upgrade.' });
        return;
      }

      // Store screenshot in Redis temporarily
      const screenshotKey = `screenshot:${conversationId}:${Date.now()}`;
      await StorageService.storeFiles(screenshotKey, [{
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer.toString('base64'),
      }]);

      res.status(201).json({
        conversation_id: conversationId,
        screenshot_key: screenshotKey,
        message: 'Screenshot uploaded successfully.',
      });
    } catch (err) {
      console.error('Chat recommend upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// Check processing status
router.get(
  '/status/:caseId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const caseRecord = await CaseModel.findById(req.params.caseId);
      if (!caseRecord) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      if (caseRecord.user_id !== req.user!.user_id) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      const progress = await StorageService.getProgress(req.params.caseId);

      res.json({
        case_id: caseRecord.case_id,
        conversation_id: caseRecord.conversation_id,
        status: caseRecord.status,
        case_type: caseRecord.case_type,
        created_at: caseRecord.created_at,
        completed_at: caseRecord.completed_at,
        progress: progress?.progress || 0,
        stage: progress?.stage || caseRecord.status,
        report_url: caseRecord.report_url,
      });
    } catch (err) {
      console.error('Status check error:', err);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
);

export default router;
