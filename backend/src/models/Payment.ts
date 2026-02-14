import { pool } from '../config/database';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  payment_id: string;
  user_id: string;
  case_id: string | null;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: Date;
}

export class PaymentModel {
  static async create(
    user_id: string,
    stripe_payment_intent_id: string,
    amount: number,
    currency: string = 'usd',
    case_id?: string
  ): Promise<Payment> {
    const result = await pool.query(
      `INSERT INTO payments (user_id, case_id, stripe_payment_intent_id, amount, currency)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, case_id || null, stripe_payment_intent_id, amount, currency]
    );
    return result.rows[0];
  }

  static async updateStatus(stripe_payment_intent_id: string, status: PaymentStatus): Promise<void> {
    await pool.query(
      `UPDATE payments SET status = $1 WHERE stripe_payment_intent_id = $2`,
      [status, stripe_payment_intent_id]
    );
  }

  static async findByPaymentIntentId(stripe_payment_intent_id: string): Promise<Payment | null> {
    const result = await pool.query(
      `SELECT * FROM payments WHERE stripe_payment_intent_id = $1`,
      [stripe_payment_intent_id]
    );
    return result.rows[0] || null;
  }

  static async linkCase(payment_id: string, case_id: string): Promise<void> {
    await pool.query(
      `UPDATE payments SET case_id = $1 WHERE payment_id = $2`,
      [case_id, payment_id]
    );
  }
}
