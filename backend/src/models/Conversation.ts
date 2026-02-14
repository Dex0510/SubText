import { pool } from '../config/database';

export interface Conversation {
  conversation_id: string;
  user_id: string;
  contact_name: string;
  pro_purchased: boolean;
  pro_purchased_at: Date | null;
  mri_queries_used: number;
  mri_unlimited: boolean;
  mri_unlimited_purchased_at: Date | null;
  created_at: Date;
  last_analyzed_at: Date | null;
  metadata: Record<string, unknown>;
}

export class ConversationModel {
  static async create(
    user_id: string,
    contact_name: string = 'Person A',
    metadata: Record<string, unknown> = {}
  ): Promise<Conversation> {
    const result = await pool.query(
      `INSERT INTO conversations (user_id, contact_name, metadata)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, contact_name, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async findById(conversation_id: string): Promise<Conversation | null> {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE conversation_id = $1`,
      [conversation_id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(user_id: string): Promise<Conversation[]> {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE user_id = $1 ORDER BY last_analyzed_at DESC NULLS LAST, created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  static async findByUserIdWithStats(user_id: string): Promise<Array<Conversation & {
    case_count: number;
    deep_analysis_completed: boolean;
    recommendation_count: number;
  }>> {
    const result = await pool.query(
      `SELECT c.*,
        COALESCE((SELECT COUNT(*) FROM cases WHERE conversation_id = c.conversation_id), 0)::int AS case_count,
        EXISTS(SELECT 1 FROM cases WHERE conversation_id = c.conversation_id AND case_type = 'deep_analysis' AND status = 'completed') AS deep_analysis_completed,
        COALESCE((SELECT COUNT(*) FROM chat_recommendations WHERE conversation_id = c.conversation_id), 0)::int AS recommendation_count
       FROM conversations c
       WHERE c.user_id = $1
       ORDER BY c.last_analyzed_at DESC NULLS LAST, c.created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  static async updateLastAnalyzed(conversation_id: string): Promise<void> {
    await pool.query(
      `UPDATE conversations SET last_analyzed_at = NOW() WHERE conversation_id = $1`,
      [conversation_id]
    );
  }

  static async purchasePro(conversation_id: string): Promise<void> {
    await pool.query(
      `UPDATE conversations SET pro_purchased = true, pro_purchased_at = NOW() WHERE conversation_id = $1`,
      [conversation_id]
    );
  }

  static async purchaseMriUnlimited(conversation_id: string): Promise<void> {
    await pool.query(
      `UPDATE conversations SET mri_unlimited = true, mri_unlimited_purchased_at = NOW() WHERE conversation_id = $1`,
      [conversation_id]
    );
  }

  static async incrementMriQueries(conversation_id: string): Promise<number> {
    const result = await pool.query(
      `UPDATE conversations SET mri_queries_used = mri_queries_used + 1 WHERE conversation_id = $1 RETURNING mri_queries_used`,
      [conversation_id]
    );
    return result.rows[0].mri_queries_used;
  }

  static async updateContactName(conversation_id: string, contact_name: string): Promise<void> {
    await pool.query(
      `UPDATE conversations SET contact_name = $1 WHERE conversation_id = $2`,
      [contact_name, conversation_id]
    );
  }

  static async deleteById(conversation_id: string): Promise<void> {
    await pool.query(`DELETE FROM conversations WHERE conversation_id = $1`, [conversation_id]);
  }
}
