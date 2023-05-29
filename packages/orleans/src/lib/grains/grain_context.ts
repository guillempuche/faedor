import { IGrainLifecycle, IGrainTimer, IServiceProvider } from '.';
import { CancellationToken } from '../utils';

/**
 * Represents a grain from the perspective of the runtime.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Core/IGrainContext.cs
 */
export interface IGrainContext {
  /**
   * Gets a reference to this grain.
   */
  grainReference: string;

  /**
   * Gets the grain identity.
   */
  grainId: string;

  /**
   * Gets the grain instance, or `null` if the grain instance has not been set yet.
   */
  grainInstance: object | null;

  /**
   * Gets the activation id.
   */
  activationId: string;

  /**
   * Gets the activation address.
   */
  address: string;

  /**
   * Gets the `IServiceProvider` that provides access to the grain activation's service container.
   */
  activationServices: IServiceProvider;

  /**
   * Gets the observable `Grain` lifecycle, which can be used to add lifecycle hooks.
   */
  observableLifecycle: IGrainLifecycle;

  // /**
  //  * Gets the scheduler.
  //  */
  // scheduler: IWorkItemScheduler;

  /**
   * Gets the `Promise` which completes when the grain has deactivated.
   */
  deactivated: Promise<void>;

  /**
   * Sets the provided value as the component for type `TComponent`.
   * `TComponent` is type used to lookup this component.
   * @param value - The component instance.
   */
  setComponent<TComponent>(value: TComponent): void;

  /**
   * Submits an incoming message to this instance.
   * @param message - The message.
   */
  receiveMessage(message: object): void;

  /**
   * Start activating this instance.
   * @param requestContext - The request context of the request which is causing this instance to be activated, if any.
   * @param cancellationToken - A cancellation token which when canceled, indicates that the process should complete promptly.
   */
  activate(
    requestContext: Record<string, object>,
    cancellationToken?: CancellationToken
  ): void;

  /**
   * Start deactivating this instance.
   * @param cancellationToken - A cancellation token which when canceled, indicates that the process should complete promptly.
   */
  deactivate(cancellationToken?: CancellationToken): void;

  /**
   * Deactivates the provided grain.
   * @param grainContext The grain context.
   * @param deactivationReason The deactivation reason.
   * @param cancellationToken A cancellation token which when canceled, indicates that the process should complete promptly.
   * @returns A Promise which will complete once the grain has deactivated.
   */
  deactivateAsync(
    grainContext: IGrainContext,
    cancellationToken?: CancellationToken
  ): Promise<void>;
}

/**
 * Extensions for IGrainContext.
 */
export class GrainContextExtensions {
  /**
   * Deactivates the provided grain.
   * @param grainContext The grain context.
   * @param deactivationReason The deactivation reason.
   * @param cancellationToken A cancellation token which when canceled, indicates that the process should complete promptly.
   * @returns A Promise which will complete once the grain has deactivated.
   */
  static async deactivateAsync(
    grainContext: IGrainContext,
    cancellationToken?: CancellationToken
  ): Promise<void> {
    grainContext.deactivate(cancellationToken);
    await grainContext.deactivated;
  }
}

/**
 * Defines functionality required for grains which are subject to activation collection.
 */
export interface ICollectibleGrainContext extends IGrainContext {
  readonly isValid: boolean;
  readonly isExemptFromCollection: boolean;
  readonly isInactive: boolean;
  readonly collectionAgeLimit: number;
  readonly keepAliveUntil: Date;
  collectionTicket: Date;

  isStale(): boolean;
  getIdleness(): number;
  delayDeactivation(timeSpan: number): void;
}

/**
 * Provides functionality to record the creation and deletion of grain timers.
 */
export interface IGrainTimerRegistry {
  onTimerCreated(timer: IGrainTimer): void;
  onTimerDisposed(timer: IGrainTimer): void;
}

/**
 * Functionality to schedule tasks on a grain.
 */
export interface IWorkItemScheduler {
  queueAction(action: () => void): void;
  queueTask(task: Promise<void>): void;
  // queueWorkItem(workItem: IThreadPoolWorkItem): void;
}

/**
 * Provides access to the currently executing grain context.
 */
export interface IGrainContextAccessor {
  readonly grainContext: IGrainContext;
}

/**
 * Functionality for accessing or installing an extension on a grain.
 */
export interface IGrainExtensionBinder {
  getExtension<TExtensionInterface>(): TExtensionInterface;

  getOrSetExtension<TExtension, TExtensionInterface>(
    newExtensionFunc: () => TExtension
  ): [TExtension, TExtensionInterface];
}
