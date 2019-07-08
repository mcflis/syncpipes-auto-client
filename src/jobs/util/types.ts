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

export interface PipelineState {
  currentExecAction?: PipelineExecutionActionResponse;
}
