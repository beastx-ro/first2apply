/**
 * Get an error string from an exception.
 */
export function getExceptionMessage(error: unknown, noStackTrace = false) {
  if (error instanceof Error) {
    return noStackTrace ? error.message : (error.stack ?? error.message);
  } else if (typeof error === 'object') {
    if (error && 'message' in error && 'details' in error && 'hint' in error && 'code' in error) {
      // @ts-ignore
      return `${error.message} - ${error.details}`;
    }

    return JSON.stringify(error);
  } else if (typeof error === 'string') {
    return error;
  }

  return `${error}`;
}

/**
 * Helper method used to throw an error.
 * Useful in situations where you want to assign a value or throw an error inline.
 *
 * e.g. const foo = obj.foo ?? throwError('obj.foo is undefined');
 */
export function throwError(message: string): never {
  throw new Error(message);
}
