import { pool } from '../config/database';

export interface ChatRecommendation {
  recommendation_id: string;
  conversation_id: string;
  user_id: string;
  screenshot_url: string | null;
  recommendation: string | null;
  tokens_used: number;
  cost_cents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
}

export class ChatRecommendationModel {
  static async create(
    conversation_id: string,
    user_id: string,
    screenshot_url: string
  ): Promise<ChatRecommendation> {
    const result = await pool.query(
      `INSERT INTO chat_recommendations (conversation_id, user_id, screenshot_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [conversation_id, user_id, screenshot_url]
    );
    return result.rows[0];
  }

  static async findById(recommendation_id: string): Promise<ChatRecommendation | null> {
    const result = await pool.query(
      `SELECT * FROM chat_recommendations WHERE recommendation_id = $1`,
      [recommendation_id]
    );
    return result.rows[0] || null;
  }

  static async findByConversationId(conversation_id: string): Promise<ChatRecommendation[]> {
    const result = await pool.query(
      `SELECT * FROM chat_recommendations WHERE conversation_id = $1 ORDER BY created_at DESC`,
      [conversation_id]
    );
    return result.rows;
  }

  static async updateRecommendation(
    recommendation_id: string,
    recommendation: string,
    tokens_used: number,
    cost_cents: number
  ): Promise<void> {
    await pool.query(
      `UPDATE chat_recommendations
       SET recommendation = $1, tokens_used = $2, cost_cents = $3, status = 'completed'
       WHERE recommendation_id = $4`,
      [recommendation, tokens_used, cost_cents, recommendation_id]
    );
  }

  static async updateStatus(recommendation_id: string, status: ChatRecommendation['status']): Promise<void> {
    await pool.query(
      `UPDATE chat_recommendations SET status = $1 WHERE recommendation_id = $2`,
      [status, recommendation_id]
    );
  }
}
