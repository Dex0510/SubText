import { pool } from '../config/database';

export type CaseType = 'analysis' | 'deep_analysis' | 'mri_query' | 'chat_recommendation';
export type CaseStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Case {
  case_id: string;
  user_id: string;
  conversation_id: string | null;
  case_type: CaseType;
  status: CaseStatus;
  created_at: Date;
  completed_at: Date | null;
  report_url: string | null;
  price_paid: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

export class CaseModel {
  static async create(
    user_id: string,
    case_type: CaseType,
    price_paid: number = 0,
    metadata: Record<string, unknown> = {},
    conversation_id?: string
  ): Promise<Case> {
    const result = await pool.query(
      `INSERT INTO cases (user_id, conversation_id, case_type, price_paid, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, conversation_id || null, case_type, price_paid, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async findById(case_id: string): Promise<Case | null> {
    const result = await pool.query(
      `SELECT * FROM cases WHERE case_id = $1`,
      [case_id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(user_id: string): Promise<Case[]> {
    const result = await pool.query(
      `SELECT * FROM cases WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  static async findByConversationId(conversation_id: string): Promise<Case[]> {
    const result = await pool.query(
      `SELECT * FROM cases WHERE conversation_id = $1 ORDER BY created_at DESC`,
      [conversation_id]
    );
    return result.rows;
  }

  static async findByConversationAndType(conversation_id: string, case_type: CaseType): Promise<Case | null> {
    const result = await pool.query(
      `SELECT * FROM cases WHERE conversation_id = $1 AND case_type = $2 ORDER BY created_at DESC LIMIT 1`,
      [conversation_id, case_type]
    );
    return result.rows[0] || null;
  }

  static async updateStatus(case_id: string, status: CaseStatus, error_message?: string): Promise<void> {
    const completed_at = status === 'completed' ? 'NOW()' : 'NULL';
    await pool.query(
      `UPDATE cases SET status = $1, error_message = $2, completed_at = ${completed_at} WHERE case_id = $3`,
      [status, error_message || null, case_id]
    );
  }

  static async setReportUrl(case_id: string, report_url: string): Promise<void> {
    await pool.query(
      `UPDATE cases SET report_url = $1, status = 'completed', completed_at = NOW() WHERE case_id = $2`,
      [report_url, case_id]
    );
  }

  static async deleteById(case_id: string): Promise<void> {
    await pool.query(`DELETE FROM cases WHERE case_id = $1`, [case_id]);
  }
}
