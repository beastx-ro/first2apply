import { chunk } from 'lodash';

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

export async function promiseAllBatched<ElementType, PromisedReturnType>(
  items: ElementType[],
  batchSize: number,
  functor: (item: ElementType) => Promise<PromisedReturnType>,
): Promise<PromisedReturnType[]> {
  const batches = chunk(items, batchSize);
  const processBatch = (batch: ElementType[]) => Promise.all(batch.map(functor));
  return promiseAllSequence(batches, processBatch).then((results) => results.flat());
}
