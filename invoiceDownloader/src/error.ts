/**
 * Get an error string from an exception.
 */
export function getExceptionMessage(error: unknown, noStackTrace = false) {
  if (error instanceof Error) {
    return noStackTrace ? error.message : error.stack ?? error.message;
  } else if (typeof error === "object") {
    return JSON.stringify(error);
  } else if (typeof error === "string") {
    return error;
  }

  return "(unkown exception reason)";
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

/**
 * Custom error classes.
 */
export class Warning extends Error {} // used for non-critical errors
