import { basename } from 'path';
import { Pipeline } from './util';
import { logger } from '../logger';
import { AxiosResponse } from 'axios';
import * as notify from '../notify';

const getPipeline = Pipeline.get.bind(Pipeline, {
  baseUrl: process.env.SYNCPIPES_SERVER_API_BASE_URL || 'http://localhost:3010/api/v1',
});
const jobName =
  basename(__filename)
    .split('.')
    .shift() || 'run-pipeline';

export default async function runPipeline(pipelineId: string): Promise<void> {
  logger.info(`${jobName} ${pipelineId}`);
  const pipeline = getPipeline(pipelineId);
  const previousPipelineState = pipeline.getState();
  let result: AxiosResponse | Error = await pipeline.run().catch(err => err);
  return notify.slack({ jobName, pipeline, result, previousPipelineState });
}
