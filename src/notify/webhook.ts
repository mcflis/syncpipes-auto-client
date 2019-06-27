import { IncomingWebhook, IncomingWebhookResult, IncomingWebhookSendArguments } from '@slack/webhook';
import { SlackNotifier } from '../types';

const dummy: IncomingWebhook = Object.assign({
  send(): Promise<IncomingWebhookResult> {
    return Promise.resolve({
      text: 'Webhook not registered!',
    });
  },
});

export const getWebhook: Promise<IncomingWebhook> = (async function getWebhook(): Promise<IncomingWebhook> {
  // @ts-ignore
  const notifier = await import('@sky-tech-tools/slack-webhook-notifier').catch((err: Error) => {
    console.warn(err.toString());
  });

  return new Promise<IncomingWebhook>(resolve => {
    if (!process.env.SLACK_WEBHOOK_URL || !notifier) {
      console.warn(`Notifier module not loaded or SLACK_WEBHOOK_URL environment var not set. Notifier functionality will be disabled.`);
      resolve(dummy);
      return;
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

    const service: SlackNotifier = new notifier.SlackNotifier({ name: 'syncpipes-auto-client', icon_emoji: ':syncpipes-auto-client:' });
    service.hook = hook.bind(service);
    notifier.attachService(service);
  });
})();
