import { Pipeline } from '../jobs/util';
import { AxiosResponse } from 'axios';
import { PipelineState } from '../jobs/util/types';

export interface NotifySlackOpts {
  jobName: string;
  pipeline: Pipeline;
  result: AxiosResponse | Error;
  previousPipelineState: PipelineState;
}
