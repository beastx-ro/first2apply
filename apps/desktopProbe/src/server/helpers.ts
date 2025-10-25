/**
 * Run multiple promises in sequence and return the results as array.
 * Similar to Promise.all(), but instead of running in parallel it runs in sequence.
 */
export async function promiseAllSequence<ElementType, PromisedReturnType>(
  items: ElementType[],
  functor: (item: ElementType) => Promise<PromisedReturnType>,
): Promise<PromisedReturnType[]> {
  return items.reduce(
    (promiseChain, item) =>
      promiseChain.then((resultsSoFar) => functor(item).then((currentResult) => [...resultsSoFar, currentResult])),
    Promise.resolve<PromisedReturnType[]>([]),
  );
}

/**
 * Creates an array of elements split into groups the length of `size`.
 * If `array` can't be split evenly, the final chunk will be the remaining
 * elements.
 *
 * @param {Array} array The array to process.
 * @param {number} [size=1] The length of each chunk
 * @returns {Array} Returns the new array of chunks.
 * @example
 *
 * chunk(['a', 'b', 'c', 'd'], 2)
 * // => [['a', 'b'], ['c', 'd']]
 *
 * chunk(['a', 'b', 'c', 'd'], 3)
 * // => [['a', 'b', 'c'], ['d']]
 */
export function chunk<T>(array: T[], size = 1): T[][] {
  size = Math.max(size, 0);
  if (!array.length || size < 1) {
    return [];
  }

  let index = 0;
  let resIndex = 0;
  const result = new Array(Math.ceil(array.length / size));

  while (index < array.length) {
    result[resIndex++] = array.slice(index, (index += size));
  }
  return result;
}

/**
 * Promisified setTimeout().
 */
export function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Method used to wait a random amount of time between a min and max value
 */
export function waitRandomBetween(min: number, max: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));
}
