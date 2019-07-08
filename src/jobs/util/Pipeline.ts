import axios, { AxiosResponse } from 'axios';
import { PipelineExecutionActionResponse, PipelineExecutionResponse, PipelineOptions, PipelineState } from './types';

const pipelineRunStates = ['Running', 'Queued'];
const pipelines: Map<string, Pipeline> = new Map<string, Pipeline>();

export class Pipeline {
  public readonly uri: string;
  public readonly execUri: string;
  public readonly execActionUri: string;
  public readonly name: Promise<string>;
  public readonly id: string;
  private state: PipelineState;
  private constructor(opts: PipelineOptions) {
    this.id = opts.id;
    this.uri = `${opts.baseUrl}/pipelines/${this.id}`;
    this.execUri = `${opts.baseUrl}/pipeline-executions`;
    this.execActionUri = `${this.uri}/actions/execute`;
    this.state = {};
    this.name = axios({ method: 'get', url: this.uri })
      .then(res => res.data.name || this.id)
      .catch(() => this.id);
  }

  public async run(): Promise<AxiosResponse<PipelineExecutionActionResponse>> {
    if (await this.isRunning()) {
      throw new Error(`Pipeline ${this.name} is already running`);
    }
    return axios({ method: 'post', url: this.execActionUri }).then(res => {
      this.state.currentExecAction = res.data;
      return res;
    });
  }

  public async isRunning(): Promise<boolean> {
    try {
      const res = await this.getCurrentPipelineExecution();
      return pipelineRunStates.includes(res.data.status);
    } catch (e) {
      console.error(e.toString());
      return false;
    }
  }

  private getCurrentPipelineExecution(): Promise<AxiosResponse<PipelineExecutionResponse>> {
    if (!this.state.currentExecAction) {
      throw new Error('Cannot get exec data because exec id is missing');
    }
    const url = `${this.execUri}/${this.state.currentExecAction._id}`;
    return axios({ method: 'get', url });
  }

  public static get(opts: Omit<PipelineOptions, 'id'>, pipelineId: string): Pipeline {
    let pipeline = pipelines.get(pipelineId) || new Pipeline({ id: pipelineId, ...opts });
    if (!pipelines.has(pipelineId)) {
      pipelines.set(pipelineId, pipeline);
    }
    return pipeline;
  }
}
