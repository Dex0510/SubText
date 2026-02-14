import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

export function rateLimit(maxRequests: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `ratelimit:${req.ip}:${req.path}`;
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (current > maxRequests) {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
      }
      next();
    } catch {
      // If Redis is down, allow the request
      next();
    }
  };
}
