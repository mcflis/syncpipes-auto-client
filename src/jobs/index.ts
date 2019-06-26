import { CronCommand, CronJob } from 'cron';

const jobs: { [key: string]: CronJob } = {};

export function add(id: string, time: string, job: CronCommand) {
  if (jobs[id]) {
    throw new Error(`Job with id '${id}' already exits!`);
  }
  jobs[id] = new CronJob(time, job, undefined, true);
}

export { default as runPipeline } from './run-pipeline';
