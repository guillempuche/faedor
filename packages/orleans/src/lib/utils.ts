/**
 * Represents an object that can be disposed.
 */
export interface IDisposable {
  /**
   * Performs application-defined tasks associated with freeing, releasing, or
   * resetting unmanaged resources.
   */
  dispose(): void;
}

/**
 * Represents a cancellation token that can be used to cancel asynchronous operations.
 *
 * https://learn.microsoft.com/en-us/dotnet/api/system.threading.cancellationtoken
 */
export class CancellationToken {
  private isCanceled = false;
  private onCancelCallbacks: (() => void)[] = [];

  /**
   * Cancels the token.
   */
  cancel() {
    this.isCanceled = true;
    this.onCancelCallbacks.forEach((callback) => callback());
  }

  /**
   * Checks if the token has been canceled.
   * @returns true if the token is canceled, false otherwise.
   */
  isCancellationRequested(): boolean {
    return this.isCanceled;
  }

  /**
   * Registers a callback function that will be called when the token is canceled.
   * @param callback - The callback function to be called when the token is canceled.
   */
  register(callback: () => void): void {
    this.onCancelCallbacks.push(callback);
  }
}
