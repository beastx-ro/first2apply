import { Router } from 'express';

export function setupRoutes(): Router {
  const router = Router();

  router.get('/health', (_, res) => {
    res.status(200).send('OK');
  });

  return router;
}
