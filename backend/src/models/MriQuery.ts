import { pool } from '../config/database';

export interface MriQuery {
  query_id: string;
  conversation_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
}

export class MriQueryModel {
  static async create(
    conversation_id: string,
    user_id: string,
    question: string
  ): Promise<MriQuery> {
    const result = await pool.query(
      `INSERT INTO mri_queries (conversation_id, user_id, question)
       VALUES ($1, $2, $3) RETURNING *`,
      [conversation_id, user_id, question]
    );
    return result.rows[0];
  }

  static async findById(query_id: string): Promise<MriQuery | null> {
    const result = await pool.query(
      `SELECT * FROM mri_queries WHERE query_id = $1`,
      [query_id]
    );
    return result.rows[0] || null;
  }

  static async findByConversationId(conversation_id: string): Promise<MriQuery[]> {
    const result = await pool.query(
      `SELECT * FROM mri_queries WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversation_id]
    );
    return result.rows;
  }

  static async updateAnswer(query_id: string, answer: string): Promise<void> {
    await pool.query(
      `UPDATE mri_queries SET answer = $1, status = 'completed' WHERE query_id = $2`,
      [answer, query_id]
    );
  }

  static async updateStatus(query_id: string, status: MriQuery['status']): Promise<void> {
    await pool.query(
      `UPDATE mri_queries SET status = $1 WHERE query_id = $2`,
      [status, query_id]
    );
  }

  static async countByConversationId(conversation_id: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM mri_queries WHERE conversation_id = $1`,
      [conversation_id]
    );
    return result.rows[0].count;
  }
}
