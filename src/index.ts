import express, { NextFunction, Request, Response } from 'express';
import { ServerError } from './types';
import * as jobs from './jobs';

const app = express();
const port = process.env.SYNCPIPES_AUTO_CLIENT_PORT || 3123;
const cronTime = process.env.SYNCPIPES_AUTO_CLIENT_CRON_TIME || '0 */5 * * * *';

app.get('/health', (req, res) => res.json({ message: 'ok' }));
app.post('/start', (req, res, next) => next(new ServerError(400, 'Missing pipeline id')));
app.post('/start/:pipelineId', (req, res) => {
  try {
    jobs.add(req.params.pipelineId, cronTime, jobs.runPipeline.bind(null, req.params.pipelineId));
    res.status(204).send();
  } catch (e) {
    res.status(200).json({ message: 'Job is already running' });
  }
});
app.post('/stop', (req, res, next) => next(new ServerError(400, 'Missing pipeline id')));
app.post('/stop/:pipelineId', (req, res, next) => {
  try {
    jobs.remove(req.params.pipelineId);
    res.status(204).send();
  } catch (e) {
    next(new ServerError(404, `Job with id ${req.params.pipelineId} not found.`));
  }
});
app.all('*', (req: Request, res, next) => next(new ServerError(404, `${req.method} ${req.path} not found`)));
// the fourth argument is required although it's not used. Express won't use this error handler if the fourth arg is missing.
app.use((error: ServerError, req: Request, res: Response, next: NextFunction) => res.status(error.status).json({ message: error.message, status: error.status }));
app.listen(port, () => console.log(`Syncpipes Auto Client listening on port ${port}!`));
