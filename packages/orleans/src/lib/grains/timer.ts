import { IGrainContext } from '.';

/**
 * Functionality for managing grain timers.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Timers/ITimerRegistry.cs
 */
export interface ITimerRegistry {
  /**
   * Creates a grain timer.
   * @param grainContext The grain which the timer is associated with.
   * @param asyncCallback The timer callback, which will fire whenever the timer becomes due.
   * @param state The state object passed to the callback.
   * @param dueTime The amount of time to delay before the asyncCallback is invoked.
   *                Specify -1 to prevent the timer from starting.
   *                Specify 0 to invoke the callback promptly.
   * @param period The time interval between invocations of asyncCallback.
   *               Specify -1 to disable periodic signaling.
   * @returns A function that disposes the timer when called.
   */
  registerTimer(
    grainContext: IGrainContext,
    asyncCallback: (state: any) => Promise<void>,
    state: any,
    dueTime: number,
    period: number
  ): () => void;
}

/**
 * Represents a grain timer and its functionality.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Runtime/IGrainTimer.cs
 */
export interface IGrainTimer {
  /**
   * Starts the timer.
   */
  start(): void;

  /**
   * Stops the timer.
   */
  stop(): void;

  /**
   * Gets the currently executing grain timer task.
   * @returns The currently executing grain timer task.
   */
  getCurrentlyExecutingTickTask(): Promise<void>;
}
