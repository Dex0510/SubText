import { redis } from '../config/redis';

const CASE_FILES_TTL = 24 * 60 * 60; // 24 hours
const REPORT_TTL = 7 * 24 * 60 * 60; // 7 days

export class StorageService {
  // Store tokenized files in Redis (ephemeral, 24-hour TTL)
  static async storeFiles(caseId: string, files: Array<{ filename: string; mimetype: string; buffer: string }>): Promise<void> {
    await redis.setex(
      `case:${caseId}:files`,
      CASE_FILES_TTL,
      JSON.stringify(files)
    );
  }

  static async getFiles(caseId: string): Promise<Array<{ filename: string; mimetype: string; buffer: string }> | null> {
    const data = await redis.get(`case:${caseId}:files`);
    return data ? JSON.parse(data) : null;
  }

  // Store encrypted identity map (server cannot decrypt)
  static async storeEncryptedIdentityMap(caseId: string, encryptedMap: unknown): Promise<void> {
    await redis.setex(
      `case:${caseId}:identity_map`,
      REPORT_TTL,
      JSON.stringify(encryptedMap)
    );
  }

  static async getEncryptedIdentityMap(caseId: string): Promise<unknown | null> {
    const data = await redis.get(`case:${caseId}:identity_map`);
    return data ? JSON.parse(data) : null;
  }

  // Store processed timeline
  static async storeTimeline(caseId: string, timeline: unknown): Promise<void> {
    await redis.setex(
      `case:${caseId}:timeline`,
      CASE_FILES_TTL,
      JSON.stringify(timeline)
    );
  }

  static async getTimeline(caseId: string): Promise<unknown | null> {
    const data = await redis.get(`case:${caseId}:timeline`);
    return data ? JSON.parse(data) : null;
  }

  // Store agent findings
  static async storeFindings(caseId: string, agentName: string, findings: unknown): Promise<void> {
    await redis.setex(
      `case:${caseId}:findings:${agentName}`,
      CASE_FILES_TTL,
      JSON.stringify(findings)
    );
  }

  static async getFindings(caseId: string, agentName: string): Promise<unknown | null> {
    const data = await redis.get(`case:${caseId}:findings:${agentName}`);
    return data ? JSON.parse(data) : null;
  }

  // Store generated report data
  static async storeReport(caseId: string, reportData: unknown): Promise<void> {
    await redis.setex(
      `case:${caseId}:report`,
      REPORT_TTL,
      JSON.stringify(reportData)
    );
  }

  static async getReport(caseId: string): Promise<unknown | null> {
    const data = await redis.get(`case:${caseId}:report`);
    return data ? JSON.parse(data) : null;
  }

  // Store processing progress
  static async setProgress(caseId: string, progress: number, stage: string): Promise<void> {
    await redis.setex(
      `case:${caseId}:progress`,
      CASE_FILES_TTL,
      JSON.stringify({ progress, stage, updated_at: new Date().toISOString() })
    );
  }

  static async getProgress(caseId: string): Promise<{ progress: number; stage: string; updated_at: string } | null> {
    const data = await redis.get(`case:${caseId}:progress`);
    return data ? JSON.parse(data) : null;
  }

  // Cleanup all case data
  static async cleanupCase(caseId: string): Promise<void> {
    const keys = await redis.keys(`case:${caseId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
