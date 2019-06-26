import { CronCommand, CronJob } from 'cron';

const jobs: { [key: string]: CronJob } = {};

export function add(id: string, time: string, job: CronCommand): void {
  if (jobs[id]) {
    throw new Error(`Job with id '${id}' already exits!`);
  }
  jobs[id] = new CronJob(time, job, undefined, true);
}

export function remove(id: string): void {
  const job = jobs[id];
  if (!job) {
    throw new Error('Job not found!');
  }
  if (job.running) {
    job.stop();
  }
  delete jobs[id];
}

export { default as runPipeline } from './run-pipeline';
