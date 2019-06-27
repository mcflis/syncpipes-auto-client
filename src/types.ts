import { EventEmitter } from 'events';
import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook';

export class ServerError extends Error {
  public readonly status: number;
  public constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface SlackNotifier extends EventEmitter {
  getWebhookSendOpts(): IncomingWebhookSendArguments;
  hook(webhook: IncomingWebhook): void;
  getName(): string;
}
