interface MessageAttachmentField {
  title: string;
  value: string;
}

export type MessageAttachmentOpts = Partial<{
  fallback: string;
  color: string;
  author_name: string;
  title: string;
  title_link: string;
  fields: MessageAttachmentField[];
}>;

export class MessageAttachment {
  public fallback: string = '';
  public color: string = '';
  public author_name: string = '';
  public title: string = '';
  public title_link: string = '';
  public fields: MessageAttachmentField[] = [];
  public constructor(opts?: Partial<MessageAttachmentOpts>) {
    Object.assign(this, opts);
  }
}
