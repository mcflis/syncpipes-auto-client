import axios, { AxiosResponse } from 'axios';
import { getWebhook } from '../notify/webhook';
import { IncomingWebhookSendArguments } from '@slack/webhook';
import { EventEmitter } from 'events';
import { asyncPipelineExecutionInfoProxyGenerator, PipelineExecutionActionResponse } from './util';

const syncpipesApiUrl = process.env.SYNCPIPES_SERVER_API_BASE_URL || 'http://localhost:3010/api/v1';
const eventName = 'pipeline-execution-info-received';
const emitter = new EventEmitter();
const pipelineExecutionInfo = asyncPipelineExecutionInfoProxyGenerator(emitter, eventName);
const pipelineExecutionInfoGeneratorIsReady = pipelineExecutionInfo.next();

async function getPipelineName(id: string): Promise<string> {
  return axios({ method: 'get', url: `${syncpipesApiUrl}/pipelines/${id}` })
    .then(res => res.data.name || id)
    .catch(() => id);
}

async function getPipelineExecutionById(executionActionResponse: PipelineExecutionActionResponse): Promise<AxiosResponse> {
  const url = `${syncpipesApiUrl}/pipeline-executions/${executionActionResponse._id}`;
  return axios({ method: 'get', url });
}

async function getPipelineExecutionInfo(): Promise<{ isPipelineRunning: boolean; info?: PipelineExecutionActionResponse }> {
  const value = (await pipelineExecutionInfoGeneratorIsReady).value;
  const info = (await pipelineExecutionInfo.next()).value;

  if (value !== 'ready') {
    console.error(new Error('Pipeline info cannot be retrieved at this moment as the generator is not ready'));
  }
  if (!info || typeof info === 'string') {
    return {
      isPipelineRunning: false,
    };
  }
  return {
    isPipelineRunning: await getPipelineExecutionById(info)
      .then(res => res.data.status === 'Running' || res.data.status === 'Queued')
      .catch(() => false),
    info,
  };
}

function pipelineIdMatches(pipelineId: string, info?: PipelineExecutionActionResponse): boolean {
  return !!info && info.pipeline == pipelineId;
}

export default async function runPipeline(pipelineId: string) {
  const webhook = await getWebhook;
  const pipelineName = await getPipelineName(pipelineId);
  const execInfo = await getPipelineExecutionInfo();
  if (execInfo.isPipelineRunning && pipelineIdMatches(pipelineId, execInfo.info)) {
    emitter.emit(eventName, execInfo.info);
    webhook
      .send({
        attachments: [
          {
            fallback: `Pipeline ${pipelineName}: running`,
            color: '#e0d900',
            author_name: runPipeline.name,
            title: `Pipeline ${pipelineName}`,
            title_link: `${syncpipesApiUrl}/pipelines/${pipelineId}`,
            fields: [
              {
                title: 'Pipeline Execution',
                value: 'skipped',
              },
            ],
          },
        ],
      })
      .then(console.log)
      .catch(console.error);
    return;
  }

  const url = `${syncpipesApiUrl}/pipelines/${pipelineId}/actions/execute`;
  const result: IncomingWebhookSendArguments = await axios({ method: 'post', url })
    .then(res => {
      emitter.emit(eventName, res.data);
      return {
        attachments: [
          {
            fallback: `Pipeline ${pipelineName}: started`,
            color: '#36a64f',
            author_name: runPipeline.name,
            title: `Pipeline ${pipelineName}`,
            title_link: `${syncpipesApiUrl}/pipelines/${pipelineId}`,
            fields: [
              {
                title: 'Pipeline Execution',
                value: res.data._id,
              },
            ],
          },
        ],
      };
    })
    .catch((err: Error) => {
      return {
        attachments: [
          {
            fallback: `Pipeline ${pipelineName}: failed`,
            color: '#de2531',
            author_name: runPipeline.name,
            title: `Pipeline ${pipelineName}`,
            title_link: `${syncpipesApiUrl}/pipelines/${pipelineId}`,
            fields: [
              {
                title: 'Error',
                value: err.toString(),
              },
            ],
          },
        ],
      };
    });
  webhook
    .send(result)
    .then(console.log)
    .catch(console.error);
}
