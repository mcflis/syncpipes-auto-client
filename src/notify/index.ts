import { AxiosResponse } from 'axios';
import { PipelineExecutionStatus } from '../jobs/util/types';
import { getWebhook } from './webhook';
import { MessageAttachment } from '../jobs/util/MessageAttachment';
import { logger } from '../logger';
import { NotifySlackOpts } from './types';

// TODO make this configurable (i.e. api endpoint)
const maxAmountOfAccumulatedAttachments = 12;

export async function slack({ jobName, pipeline, result, previousPipelineState }: NotifySlackOpts): Promise<void> {
  const webhook = await getWebhook;
  const pipelineName = await pipeline.name;
  const currentPipelineExecutionStatus = pipeline.getState().executionStatus;
  const messageAttachments = previousPipelineState.messageAttachments;
  const messageAttachment = (messageAttachments[currentPipelineExecutionStatus] = messageAttachments[currentPipelineExecutionStatus] || new MessageAttachment({ author_name: jobName }));
  messageAttachment.title = `Pipeline ${pipelineName}`;
  messageAttachment.title_link = pipeline.uri;
  messageAttachment.fields.push({
    title: '',
    value: '',
  });
  const fieldIndex = messageAttachment.fields.length - 1;

  switch (currentPipelineExecutionStatus) {
    case PipelineExecutionStatus.SKIPPED:
      messageAttachment.color = '#00fffa';
      messageAttachment.fields[fieldIndex].title = fieldIndex === 0 ? 'Pipeline Execution skipped' : '';
      messageAttachment.fields[fieldIndex].value = 'skipped at ' + new Date().toLocaleString();
      break;
    case PipelineExecutionStatus.STARTED:
      messageAttachment.color = '#36a64f';
      messageAttachment.fields[fieldIndex].title = fieldIndex === 0 ? 'Pipeline Execution started' : '';
      messageAttachment.fields[fieldIndex].value = (result as AxiosResponse).data._id + ' started at ' + new Date().toLocaleString();
      break;
    case PipelineExecutionStatus.FAILED:
      messageAttachment.color = '#de2531';
      messageAttachment.fields[fieldIndex].title = fieldIndex === 0 ? 'Pipeline Execution failed' : '';
      messageAttachment.fields[fieldIndex].value = (result as Error).toString() + ' failed at ' + new Date().toLocaleString();
  }

  // TODO instead of fallback message, use message description to provide summary
  messageAttachment.fallback = `${messageAttachment.title}`;
  pipeline.updateState({ messageAttachments });
  if (previousPipelineState.executionStatus == pipeline.getState().executionStatus && messageAttachment.fields.length < maxAmountOfAccumulatedAttachments) {
    return;
  }
  const attachments = pipeline
    .getState()
    .messageAttachments.filter(a => a)
    .map(a => {
      a.fields[0].title += ` (${a.fields.length}x)`;
      return a;
    });
  logger.info(JSON.stringify(attachments));
  webhook
    .send({ attachments })
    .then(msg => {
      logger.info(`webhook ${JSON.stringify(msg)}`);
      pipeline.updateState({ messageAttachments: [] });
    })
    .catch(logger.error);
}
