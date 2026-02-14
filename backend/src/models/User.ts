import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  stripe_customer_id: string | null;
}

export class UserModel {
  static async create(email: string, password: string): Promise<User> {
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
      [email, password_hash]
    );
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(user_id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT * FROM users WHERE user_id = $1`,
      [user_id]
    );
    return result.rows[0] || null;
  }

  static async updateStripeCustomerId(user_id: string, stripe_customer_id: string): Promise<void> {
    await pool.query(
      `UPDATE users SET stripe_customer_id = $1, updated_at = NOW() WHERE user_id = $2`,
      [stripe_customer_id, user_id]
    );
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async deleteById(user_id: string): Promise<void> {
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
  }
}
