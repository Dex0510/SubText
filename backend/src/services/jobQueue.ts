import { Queue, Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';

const connection = createRedisConnection();

export interface AnalysisJobData {
  type: 'process_analysis';
  case_id: string;
  analysis_type: 'analysis' | 'deep_analysis' | 'mri_query' | 'chat_recommendation';
  user_id: string;
  platform?: string;
  analysis_focus?: string;
}

export class JobQueue {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('analysis-jobs', { connection });
  }

  async addJob(data: AnalysisJobData): Promise<string> {
    const job = await this.queue.add('process_analysis', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 60 * 60,
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60,
      },
    });
    return job.id || '';
  }

  async getJobStatus(jobId: string): Promise<{ state: string; progress: number } | null> {
    const job = await Job.fromId(this.queue, jobId);
    if (!job) return null;
    const state = await job.getState();
    return { state, progress: job.progress as number || 0 };
  }

  getQueue(): Queue {
    return this.queue;
  }
}

export function createAnalysisWorker(
  processor: (job: Job<AnalysisJobData>) => Promise<void>
): Worker {
  const worker = new Worker<AnalysisJobData>('analysis-jobs', processor, {
    connection: createRedisConnection(),
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`Job ${job.id} progress: ${progress}%`);
  });

  return worker;
}

export const jobQueue = new JobQueue();
