import { MessageAttachment } from './MessageAttachment';

export interface PipelineOptions {
  baseUrl: string;
  id: string;
}

export interface PipelineExecutionActionResponse {
  pipeline: string;
  status: string;
  _id: string;
  started: string;
  log: any[];
}

export interface PipelineExecutionResponse {
  status: string;
}

export enum PipelineExecutionStatus {
  NONE,
  STARTED,
  FAILED,
  SKIPPED,
}

export interface PipelineState {
  currentExecAction?: PipelineExecutionActionResponse;
  messageAttachments: MessageAttachment[];
  lastExecutionStatus: PipelineExecutionStatus;
}
