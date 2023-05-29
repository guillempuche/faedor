import { CancellationToken, IDisposable } from '../utils';

/**
 * The observable grain lifecycle.
 *
 * This type is usually used as the generic parameter in `ILifecycleParticipant<IGrainLifecycle>` as
 * a means of participating in the lifecycle stages of a grain activation.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Lifecycle/IGrainLifecycle.cs
 */
export interface IGrainLifecycle extends ILifecycleObservable {}

/**
 * Observable lifecycle.
 * Each stage of the lifecycle is observable. All observers will be notified when the stage is reached when starting, and stopping.
 * Stages are started in ascending order, and stopped in descending order.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Lifecycle/ILifecycleObservable.cs
 */
export interface ILifecycleObservable {
  /**
   * Subscribe for notification when a stage is reached while starting or stopping.
   * @param observerName - The name of the observer, for reporting purposes.
   * @param stage - The stage of to subscribe to.
   * @param observer - The observer.
   * @returns A disposable that can be disposed of to unsubscribe.
   */
  subscribe(
    observerName: string,
    stage: number,
    observer: ILifecycleObserver
  ): IDisposable;
}

/**
 * Lifecycle observer used to handle start and stop notification.
 */
export interface ILifecycleObserver {
  /**
   * Handle start notifications.
   * @param cancellationToken - The cancellation token which indicates that the
   * operation should be aborted promptly when it is canceled.
   * @returns Represents the operation.
   */
  onStart(cancellationToken?: CancellationToken): Promise<void>;

  /**
   * Handle stop notifications.
   * @param cancellationToken - The cancellation token which indicates that the
   * operation should be stopped promptly when it is canceled.
   * @returns Represents the operation.
   */
  onStop(cancellationToken?: CancellationToken): Promise<void>;
}

/**
 * Observable lifecycle.
 * Each stage of the lifecycle is observable. All observers will be notified when
 * the stage is reached when starting, and stopping.
 *
 * Stages are started in ascending order, and stopped in descending order.
 */
export interface ILifecycleObservable {
  /**
   * Subscribe for notification when a stage is reached while starting or stopping.
   * @param observerName - The name of the observer, for reporting purposes.
   * @param stage - The stage of to subscribe to.
   * @param observer - The observer.
   * @returns A disposable that can be disposed of to unsubscribe.
   */
  subscribe(
    observerName: string,
    stage: number,
    observer: ILifecycleObserver
  ): IDisposable;
}

/**
 * Provides hook to take part in lifecycle.
 * Also may act as a signal interface indicating that an object can take part in lifecycle.
 *
 * `TLifecycleObservable` is a type of lifecycle being observed.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Lifecycle/ILifecycleParticipant.cs
 */
export interface ILifecycleParticipant<
  TLifecycleObservable extends ILifecycleObservable
> {
  /**
   * Adds the provided observer as a participant in the lifecycle.
   * @param observer - The observer.
   */
  participate(observer: TLifecycleObservable): void;
}

/**
 * Both a lifecycle observer and observable lifecycle.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Lifecycle/ILifecycleSubject.cs
 */
export interface ILifecycleSubject
  extends ILifecycleObservable,
    ILifecycleObserver {}
