import { IncomingWebhook, IncomingWebhookResult, IncomingWebhookSendArguments } from '@slack/webhook';
import * as notifier from '@sky-tech-tools/slack-webhook-notifier';
import { SlackNotifier } from '@sky-tech-tools/slack-webhook-notifier';

const dummy: IncomingWebhook = Object.assign({
  send(): Promise<IncomingWebhookResult> {
    return Promise.resolve({
      text: 'Webhook not registered!',
    });
  },
});

export const getWebhook: Promise<IncomingWebhook> = new Promise<IncomingWebhook>(resolve => {
  if (!process.env.SLACK_WEBHOOK_URL) {
    resolve(dummy);
  }

  function hook(this: SlackNotifier, webhook: IncomingWebhook) {
    const defaultOpts = this.getWebhookSendOpts();
    resolve(
      Object.assign({}, webhook, {
        send(message: IncomingWebhookSendArguments): Promise<IncomingWebhookResult> {
          return webhook.send({ ...defaultOpts, ...message });
        },
      }),
    );
  }

  const service = new notifier.SlackNotifier({ name: 'syncpipes-auto-client' });
  service.hook = hook.bind(service);
  notifier.attachService(service);
});
