import { getWebhook } from '../notify/webhook';
import { Pipeline } from './util';

const getPipeline = Pipeline.get.bind(Pipeline, {
  baseUrl: process.env.SYNCPIPES_SERVER_API_BASE_URL || 'http://localhost:3010/api/v1',
});

export default async function runPipeline(pipelineId: string): Promise<void> {
  const webhook = await getWebhook;
  const pipeline = getPipeline(pipelineId);
  const pipelineName = await pipeline.name;
  const messageAttachment = {
    fallback: `Pipeline ${pipelineName}`,
    color: '',
    author_name: runPipeline.name,
    title: `Pipeline ${pipelineName}`,
    title_link: pipeline.uri,
    fields: [
      {
        title: 'Pipeline Execution',
        value: '',
      },
    ],
  };

  if (await pipeline.isRunning()) {
    messageAttachment.fallback += ' is running';
    messageAttachment.color = '#00fffa';
    messageAttachment.fields[0].value = 'skipped';
  } else {
    await pipeline
      .run()
      .then(res => {
        messageAttachment.fallback += ' started';
        messageAttachment.color = '#36a64f';
        messageAttachment.fields[0].value = res.data._id;
      })
      .catch((err: Error) => {
        messageAttachment.fallback += ' failed';
        messageAttachment.color = '#de2531';
        messageAttachment.fields[0].title = 'Error';
        messageAttachment.fields[0].value = err.toString();
      });
  }

  webhook
    .send({ attachments: [messageAttachment] })
    .then(console.log)
    .catch(console.error);
}
