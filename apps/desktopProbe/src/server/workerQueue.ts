import { EventEmitter } from 'events';

type AsyncTask<T> = () => Promise<T>;

/**
 * A simple queue for managing concurrency of async tasks.
 */
export class WorkerQueue extends EventEmitter {
  private _queue: AsyncTask<unknown>[] = [];
  private _currentlyActive = 0;

  /**
   * Class constructor.
   */
  constructor(private _concurrency = 1) {
    super();
  }

  /**
   * Enqueue a task to be executed.
   */
  enqueue<T>(task: AsyncTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this._queue.push(() => task().then(resolve).catch(reject));
      this.next();
    });
  }

  /**
   * Start the next task in the queue.
   */
  next() {
    if (this._currentlyActive >= this._concurrency) {
      // too many tasks already running
      return;
    }

    // nothing to do if the queue is empty
    if (this._queue.length === 0) {
      // emit the empty event if the queue is empty and there are no tasks running
      if (this._currentlyActive === 0) this.emit('empty');

      return;
    }

    // start the next task
    this._currentlyActive++;
    const task = this._queue.shift();

    task().finally(() => {
      this._currentlyActive--;
      this.next();
    });
  }
}
