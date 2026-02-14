import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { UserModel } from '../models/User';
import { CaseModel } from '../models/Case';
import { StorageService } from '../services/storage';

const router = Router();

// GET /user/profile
router.get(
  '/profile',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await UserModel.findById(req.user!.user_id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({
        user_id: user.user_id,
        email: user.email,
        created_at: user.created_at,
        stripe_customer_id: user.stripe_customer_id,
      });
    } catch (err) {
      console.error('Get profile error:', err);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
);

// GET /user/cases — list all cases for the authenticated user
router.get(
  '/cases',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const cases = await CaseModel.findByUserId(req.user!.user_id);
      res.json({ cases });
    } catch (err) {
      console.error('Get cases error:', err);
      res.status(500).json({ error: 'Failed to get cases' });
    }
  }
);

// DELETE /user/account — GDPR: delete all user data
router.delete(
  '/account',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.user_id;

      // 1. Get all user's cases
      const cases = await CaseModel.findByUserId(userId);

      // 2. Delete all case data from Redis (files + reports)
      for (const c of cases) {
        await StorageService.cleanupCase(c.case_id);
      }

      // 3. Delete all cases from PostgreSQL
      for (const c of cases) {
        await CaseModel.deleteById(c.case_id);
      }

      // 4. Delete user from PostgreSQL (cascades payments via FK)
      await UserModel.deleteById(userId);

      res.json({ message: 'All user data has been permanently deleted' });
    } catch (err) {
      console.error('Account deletion error:', err);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
);

export default router;
