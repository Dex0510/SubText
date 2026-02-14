import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';
import { authenticateJWT, generateToken } from '../middleware/auth';
import { UserModel } from '../models/User';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

router.post(
  '/register',
  rateLimit(10, 60),
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const user = await UserModel.create(email, password);
      const token = generateToken({ user_id: user.user_id, email: user.email });

      res.status(201).json({
        user: { user_id: user.user_id, email: user.email, created_at: user.created_at },
        token,
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  rateLimit(20, 60),
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = generateToken({ user_id: user.user_id, email: user.email });

      res.json({
        user: { user_id: user.user_id, email: user.email },
        token,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get(
  '/me',
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
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
);

// Logout (client-side token removal + guidance)
router.post(
  '/logout',
  authenticateJWT,
  async (_req: Request, res: Response): Promise<void> => {
    // For stateless JWT, client discards the token
    // Future: add token to Redis blacklist with TTL matching remaining JWT lifetime
    res.json({ message: 'Logged out successfully' });
  }
);

// Refresh token — issue new JWT if current one is still valid
router.post(
  '/refresh',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await UserModel.findById(req.user!.user_id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const newToken = generateToken({ user_id: user.user_id, email: user.email });
      res.json({ token: newToken });
    } catch (err) {
      console.error('Token refresh error:', err);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }
);

export default router;
