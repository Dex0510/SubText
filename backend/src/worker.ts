import { Job } from 'bullmq';
import { createAnalysisWorker, AnalysisJobData } from './services/jobQueue';
import { processAnalysis } from './services/processingPipeline';
import { StorageService } from './services/storage';

console.log('Starting Subtext analysis worker...');

const worker = createAnalysisWorker(async (job: Job<AnalysisJobData>) => {
  const { case_id, analysis_type } = job.data;
  console.log(`Processing ${analysis_type} for case ${case_id}`);

  await processAnalysis(
    case_id,
    analysis_type,
    async (progress: number, stage: string) => {
      await job.updateProgress(progress);
      await StorageService.setProgress(case_id, progress, stage);
      console.log(`Case ${case_id}: ${progress}% - ${stage}`);
    }
  );
});

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs');
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing worker...');
  await worker.close();
  process.exit(0);
});
