/**
 * Races a promise against a timeout so the UI never hangs forever waiting on
 * a network call that never resolves (paused project, bad DNS, dropped
 * connection, etc.).
 */
export class TimeoutError extends Error {
  constructor(message = 'A operação demorou demais para responder.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new TimeoutError()), ms);
    Promise.resolve(promise).then(
      value => { window.clearTimeout(timer); resolve(value); },
      error => { window.clearTimeout(timer); reject(error); },
    );
  });
}
