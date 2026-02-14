import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { CaseModel } from '../models/Case';
import { StorageService } from '../services/storage';

const router = Router();

// Get report data for client-side decryption
router.get(
  '/:caseId',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const caseRecord = await CaseModel.findById(req.params.caseId);
      if (!caseRecord) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      if (caseRecord.user_id !== req.user!.user_id) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
      if (caseRecord.status !== 'completed') {
        res.status(202).json({
          error: 'Report not ready',
          status: caseRecord.status,
        });
        return;
      }

      // Get report data and encrypted identity map
      const reportData = await StorageService.getReport(caseRecord.case_id);
      const encryptedIdentityMap = await StorageService.getEncryptedIdentityMap(caseRecord.case_id);

      res.json({
        case_id: caseRecord.case_id,
        case_type: caseRecord.case_type,
        report_data: reportData,
        encrypted_identity_map: encryptedIdentityMap,
        created_at: caseRecord.created_at,
        completed_at: caseRecord.completed_at,
      });
    } catch (err) {
      console.error('Report retrieval error:', err);
      res.status(500).json({ error: 'Failed to retrieve report' });
    }
  }
);

// Get user's past cases
router.get(
  '/',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const cases = await CaseModel.findByUserId(req.user!.user_id);
      res.json({
        cases: cases.map(c => ({
          case_id: c.case_id,
          case_type: c.case_type,
          status: c.status,
          created_at: c.created_at,
          completed_at: c.completed_at,
        })),
      });
    } catch (err) {
      console.error('List cases error:', err);
      res.status(500).json({ error: 'Failed to list cases' });
    }
  }
);

// Delete report and all associated data
router.delete(
  '/:caseId',
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

      // Clean up Redis data
      await StorageService.cleanupCase(req.params.caseId);
      // Delete case record
      await CaseModel.deleteById(req.params.caseId);

      res.json({ message: 'Report and all associated data deleted' });
    } catch (err) {
      console.error('Delete report error:', err);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
);

export default router;
