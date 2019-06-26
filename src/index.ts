import express, { Request, Response } from 'express';
import { ServerError } from './types';
import * as jobs from './jobs';

const app = express();
const port = process.env.SYNCPIPES_AUTO_CLIENT_PORT || 3123;

app.get('/health', (req, res) => res.json({ message: 'ok' }));
app.post('/start', (req, res, next) => next(new ServerError(400, 'Missing pipeline id')));
app.post('/start/:pipelineId', (req, res, next) => {
  try {
    jobs.add(req.params.pipelineId, '0 */2 * * * *', jobs.runPipeline.bind(null, req.params.pipelineId));
    res.status(204).send();
  } catch (e) {
    next(new ServerError(400, e.toString()));
  }
});
app.all('*', (req: Request, res, next) => next(new ServerError(404, `${req.method} ${req.path} not found`)));
app.use((error: ServerError, req: Request, res: Response) => res.status(error.status).json({ message: error.message, status: error.status }));
app.listen(port, () => console.log(`Syncpipes Auto Client listening on port ${port}!`));
