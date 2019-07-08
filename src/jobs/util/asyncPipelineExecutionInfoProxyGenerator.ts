import { EventEmitter } from 'events';

type PromiseResolve<T> = (value?: T | PromiseLike<T>) => void;

type PipelineExecutionInfo = PipelineExecutionActionResponse | undefined;

export interface PipelineExecutionActionResponse {
  pipeline: string;
  status: string;
  _id: string;
  started: string;
  log: any[];
}

export async function* asyncPipelineExecutionInfoProxyGenerator(eventEmitter: EventEmitter, eventName: string): AsyncIterableIterator<PipelineExecutionInfo | string> {
  let resolve: PromiseResolve<PipelineExecutionInfo>;
  let promise = new Promise<PipelineExecutionInfo>(r => (resolve = r));
  const promises: Promise<PipelineExecutionInfo>[] = [];
  eventEmitter.on(eventName, data => {
    resolve(data);
    promises.push(promise);
    promise = new Promise(r => (resolve = r));
  });
  yield Promise.resolve('ready');
  while (true) {
    yield promises.shift();
  }
}
