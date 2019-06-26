import axios from 'axios';
import { getWebhook } from '../notify/webhook';
import { IncomingWebhookSendArguments } from '@slack/webhook';

const syncpipesApiUrl = process.env.SYNCPIPES_SERVER_API_BASE_URL || 'http://localhost:3010/api/v1';

async function getPipelineName(id: string): Promise<string> {
  return axios({ method: 'get', url: `${syncpipesApiUrl}/pipelines/${id}` })
    .then(res => res.data.name || id)
    .catch(() => id);
}

export default async function runPipeline(pipelineId: string) {
  const webhook = await getWebhook;
  const url = `${syncpipesApiUrl}/pipelines/${pipelineId}/actions/execute`;
  const pipelineName = await getPipelineName(pipelineId);
  const result: IncomingWebhookSendArguments = await axios({ method: 'post', url })
    .then(res => {
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
