import { parseEnv } from './env';

import { errorMiddleware, getExceptionMessage } from '@first2apply/core';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import express from 'express';
import helmet from 'helmet';
import { Server as HttpServer } from 'http';
import pino from 'pino';

import { setupRoutes } from './routes';

// augment the Express Request object
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      logger: pino.Logger;
    }
  }
}

const env = parseEnv();
const systemLogger = pino({
  name: env.appName,
  level: env.nodeEnv === 'development' ? 'debug' : 'info',
  ...(env.nodeEnv === 'development' && {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
      },
    },
  }),
  formatters: {
    // need to print the label instead of the number to work in datadog
    level(label) {
      return { level: label };
    },
  },
});

async function bootstrap(logger: pino.Logger) {
  let server: HttpServer | undefined;

  try {
    logger.info(`bootstrapping ....`);

    // create express app and add default middleware
    const serverApp = express();
    serverApp.use(helmet());
    serverApp.use(bodyParser.json({ limit: '1mb' }));
    serverApp.use((req, _, next) => {
      req.logger = logger.child({
        requestId: crypto.randomUUID(),
        route: req.path,
      });
      next();
    });

    serverApp.use(setupRoutes());

    // custom error middleware
    serverApp.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) =>
      errorMiddleware({ logger: req.logger ?? logger })(err, req, res, next),
    );

    // start listening for HTTP requests
    const port = env.port;
    server = serverApp.listen(env.port, () => {
      logger.info(`app listening on ${port}`);
    });
  } catch (error) {
    logger.error(`failed to boostrap: ${getExceptionMessage(error)}`);
    await teardown({
      logger,
      server,
    });
  }

  return { server };
}

async function teardown({ logger, server }: { logger: pino.Logger; server: HttpServer | undefined }) {
  try {
    logger.info(`trying to gracefully close the nodejs process ...`);

    if (server) {
      await server.close();
      logger.info('http server closed');
    }

    logger.info('process shut down gracefully');

    // exit the process
    process.exit(0);
  } catch (error) {
    logger.error(`failed to teardown app ${getExceptionMessage(error)}`);

    // exit the process with error
    process.exit(1);
  }
}

// start boostrapping the app
bootstrap(systemLogger).then((runtime) => {
  /**
   * Handle process signals for graceful shutdown.
   * @see signals: http://man7.org/linux/man-pages/man7/signal.7.html
   * @see node signal events: https://nodejs.org/dist/latest-v11.x/docs/api/process.html#process_signal_events
   * @see kubernetes shutdown: https://cloud.google.com/blog/products/gcp/kubernetes-best-practices-terminating-with-grace
   */
  process.on('SIGINT', () => teardown({ logger: systemLogger, ...runtime }));
  process.on('SIGTERM', () => teardown({ logger: systemLogger, ...runtime }));
  process.on('SIGHUP', () => teardown({ logger: systemLogger, ...runtime })); // pointless? debatable
});
