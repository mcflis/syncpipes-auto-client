import { getWebhook } from '../notify/webhook';
import { Pipeline } from './util';
import { PipelineExecutionStatus } from './util/types';
import { MessageAttachment } from './util/MessageAttachment';
import { logger } from '../logger';

const getPipeline = Pipeline.get.bind(Pipeline, {
  baseUrl: process.env.SYNCPIPES_SERVER_API_BASE_URL || 'http://localhost:3010/api/v1',
});
const maxAmountOfAccumulatedAttachments = 10;

export default async function runPipeline(pipelineId: string): Promise<void> {
  const webhook = await getWebhook;
  const pipeline = getPipeline(pipelineId);
  const pipelineName = await pipeline.name;
  const messageAttachment = new MessageAttachment({ author_name: runPipeline.name, fields: [{ title: '', value: '' }] });
  messageAttachment.title = `Pipeline ${pipelineName}`;
  messageAttachment.title_link = pipeline.uri;
  messageAttachment.fields[0].title = 'Pipeline Execution';
  const cachedPipelineState = pipeline.getState();

  if (await pipeline.isRunning()) {
    messageAttachment.title += ' is running';
    messageAttachment.color = '#00fffa';
    messageAttachment.fields[0].value = 'skipped';
    pipeline.updateState({ lastExecutionStatus: PipelineExecutionStatus.SKIPPED });
  } else {
    await pipeline
      .run()
      .then(res => {
        messageAttachment.title += ' started at ' + new Date().toLocaleString();
        messageAttachment.color = '#36a64f';
        messageAttachment.fields[0].value = res.data._id;
        pipeline.updateState({ lastExecutionStatus: PipelineExecutionStatus.STARTED });
      })
      .catch((err: Error) => {
        messageAttachment.title += ' failed at ' + new Date().toLocaleString();
        messageAttachment.color = '#de2531';
        messageAttachment.fields[0].title = 'Error';
        messageAttachment.fields[0].value = err.toString();
        pipeline.updateState({ lastExecutionStatus: PipelineExecutionStatus.FAILED });
      });
  }

  logger.info(runPipeline.name, { message: messageAttachment.title });

  messageAttachment.fallback = messageAttachment.title;
  pipeline.updateState({ messageAttachments: cachedPipelineState.messageAttachments.concat([messageAttachment]) });
  if (cachedPipelineState.lastExecutionStatus == pipeline.getState().lastExecutionStatus && cachedPipelineState.messageAttachments.length < maxAmountOfAccumulatedAttachments) {
    return;
  }
  webhook
    .send({ attachments: pipeline.getState().messageAttachments })
    .then(msg => {
      logger.info(`webhook ${JSON.stringify(msg)}`);
      pipeline.updateState({ messageAttachments: [] });
    })
    .catch(logger.error);
}
