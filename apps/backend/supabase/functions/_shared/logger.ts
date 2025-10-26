import { throwError } from '@first2apply/core';
import { Logger as MezmoLogger, createLogger } from 'npm:@logdna/logger';

export interface ILogger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  addMeta(key: string, value: string): void;
  flush(): void;
}

/**
 * Custom logger class that wraps the Mezmo logger.
 */
class Logger implements ILogger {
  constructor(private _logger: MezmoLogger) {}

  debug(message: string, data?: Record<string, any>) {
    console.log(message, data);
    this._logger.debug &&
      this._logger.debug(message, {
        meta: data,
      });
  }

  info(message: string, data?: Record<string, any>) {
    console.log(message, data);
    this._logger.info &&
      this._logger.info(message, {
        meta: data,
      });
  }

  error(message: string, data?: Record<string, any>) {
    console.error(message, data);
    this._logger.error &&
      this._logger.error(message, {
        meta: data,
      });
  }

  addMeta(key: string, value: string) {
    this._logger.addMetaProperty(key, value);
  }

  flush() {
    this._logger.flush();
  }
}

export const createLoggerWithMeta = (meta: Record<string, string>) => {
  const mezmoLogger = createLogger(Deno.env.get('MEZMO_API_KEY') ?? throwError(''), {
    level: 'info',
    app: 'first2apply',
    env: 'all',
    hostname: 'edge-functions',
    meta,
    indexMeta: true,
  });

  return new Logger(mezmoLogger);
};
