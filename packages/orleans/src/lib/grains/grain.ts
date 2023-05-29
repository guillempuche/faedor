import { None, Option, Result, Some } from 'ts-results';

import {
  IGrainFactory,
  IGrainRuntime,
  IServiceProvider,
  IGrainContext,
  RuntimeContext,
} from '.';
import { CancellationToken } from '../utils';

export interface IGrain {
  // activationId: string;
  onActivate(): Promise<void>;
  onDeactivate(): Promise<void>;
}

// https://github.com/dotnet/orleans/blob/main/src/Orleans.Core/CodeGeneration/IGrainState.cs
export interface IGrainState<TState> {
  version: number;
  state: TState;
  recordExists: boolean;
}

export interface IGrainMessage {
  type: string;
  version: number; // Added version field
  payload: unknown;
}

// It provides a set of properties and methods that help manage the grain's lifecycle, access services, and interact with other grains. Here's a list of the key properties and methods provided by the Grain class:

// Properties:
//     GrainIdentity (IAddressable): Represents the identity of the grain, including the grain type and primary key.
//     Logger (ILogger): Provides a logging facility for the grain to log diagnostic information.
//     GrainCancellationTokenSource (GrainCancellationTokenSource): Provides a cancellation token source that is tied to the grain's lifecycle, allowing you to cancel asynchronous operations when the grain is deactivated.
//     ServiceProvider (IServiceProvider): Provides access to the dependency injection container, allowing you to resolve services registered with the container.
//     GrainFactory (IGrainFactory): Provides a factory for creating references to other grains, enabling grain-to-grain communication.
// Methods:
//     OnActivateAsync (Task): A virtual method that is called when the grain is activated. You can override this method to perform custom initialization logic.
//     OnDeactivateAsync (Task): A virtual method that is called when the grain is deactivated. You can override this method to perform custom cleanup logic.
//     RegisterTimer (IDisposable): Registers a timer to periodically invoke a specified callback method.
//     UnregisterTimer (bool): Unregisters a previously registered timer.
//     RegisterOrUpdateReminder (Task<IGrainReminder>): Registers or updates a persistent reminder.
//     UnregisterReminder (Task<bool>): Unregisters a previously registered reminder.
//     GetReminder (Task<IGrainReminder>): Gets a previously registered reminder by its name.
//     GetReminders (Task<ImmutableDictionary<string, IGrainReminder>>): Gets all registered reminders for the current grain.
//     OnReminderTickAsync (Task): A virtual method that is called when a reminder is triggered. You can override this method to perform custom logic when a reminder fires.
//     DeferAsync (Task): Defers the execution of an asynchronous operation until after the current grain method has completed.

/**
 * The abstract base class for all grain classes.
 *
 * Orleans docs: https://learn.microsoft.com/en-us/dotnet/orleans/grains/, https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Core/Grain.cs
 */
export abstract class Grain implements IGrain {
  // Do not use this directly because we currently don't provide a way to inject it;
  // any interaction with it will result in non unit-testable code. Any behavior that can be accessed
  // from within client code (including subclasses of this class), should be exposed through IGrainRuntime.
  // The better solution is to refactor this interface and make it injectable through the constructor.
  protected grainContext: IGrainContext | null = null;

  protected runtime: IGrainRuntime | null = null;

  /**
   * Provides access to the dependency injection container, allowing you to resolve
   * services registered with the container.
   */
  protected get serviceProvider(): Option<IServiceProvider> {
    return this.grainContext?.activationServices
      ? Some(this.grainContext?.activationServices)
      : this.runtime?.serviceProvider
      ? Some(this.runtime?.serviceProvider)
      : None;
  }

  /**
   * Gets an object which can be used to access other grains. Provides a factory
   * for creating references to other grains, enabling grain-to-grain communication.
   *
   * Null if this grain is not associated with a Runtime, such as when created directly for unit testing.
   */
  get grainFactory(): IGrainFactory | null {
    return this.runtime?.grainFactory || null;
  }

  /**
   * Gets the grain identifier associated with the current grain context.
   */
  get grainId(): string {
    return this.grainContext!.grainId;
  }

  /**
   * Gets the grain reference associated with the current grain context.
   */
  get grainReference(): string {
    return this.grainContext!.grainReference;
  }

  /**
   * This constructor should never be invoked. We expose it so that client code
   * (subclasses of this class) do not have to add a constructor.
   *
   * Client code should use the GrainFactory property to get a reference to a Grain.
   * @param grainContext The grain context associated with the current grain.
   * @param grainRuntime The grain runtime associated with the current grain.
   */
  protected constructor(
    grainContext?: IGrainContext,
    grainRuntime?: IGrainRuntime
  ) {
    this.grainContext = grainContext ?? null;

    const runtime =
      grainContext?.activationServices.getRequiredService<IGrainRuntime>();
    this.runtime =
      grainRuntime ||
      (runtime !== undefined && runtime.ok ? runtime.val : null);
  }
  // constructor(storage: IStorage<TGrainState>) {
  // constructor() {
  //   //   this.storage = storage;
  //   // constructor(id: string, state: IGrainState) {
  //   // this.state = state;
  //   this._id = uuid();
  //   // this.activationId = `${id}-${Date.now()}`;
  // }

  /**
   * Gets the string representation of the grain's identity, including its type and primary key.
   */
  public get identityString(): string {
    return this.grainId.toString();
  }

  /**
   * Gets a unique identifier for the current silo.
   * There is no semantic content to this string, but it may be useful for logging.
   */
  public get runtimeIdentity(): string {
    return this.runtime?.siloIdentity ?? '';
  }

  /**
   * Registers a timer to send periodic callbacks to this grain.
   * - This timer will not prevent the current grain from being deactivated.
   *   If the grain is deactivated, then the timer will be discarded.
   * - Until the Promise returned from the asyncCallback is resolved,
   *   the next timer tick will not be scheduled.
   *   That is to say, timer callbacks never interleave their turns.
   * - The timer may be stopped at any time by calling the `dispose` method
   *   on the timer handle returned from this call.
   * - Any exceptions thrown by or faulted Promise's returned from the asyncCallback
   *   will be logged, but will not prevent the next timer tick from being queued.
   * @param asyncCallback Callback function to be invoked when timer ticks.
   * @param state State object that will be passed as argument when calling the asyncCallback.
   * @param dueTime Due time for the first timer tick.
   * @param period Period of subsequent timer ticks.
   * @returns A function that disposes the timer when called.
   */
  protected registerTimer(
    asyncCallback: (state: any) => Promise<void>,
    state: any,
    dueTime: number,
    period: number
  ): () => void {
    if (!asyncCallback) {
      throw new Error('asyncCallback must be provided');
    }

    this.ensureRuntime();

    // Registers the timer using the runtime's timer registry
    return this.runtime!.timerRegistry.registerTimer(
      this.grainContext || RuntimeContext.current,
      asyncCallback,
      state,
      dueTime,
      period
    );
  }

  /**
   * Deactivates this activation of the grain after the current grain method call is completed.
   * This call will mark this activation of the current grain to be deactivated and removed at the end of the current method.
   * The next call to this grain will result in a different activation to be used, which typically means a new activation will be created automatically by the runtime.
   */
  protected deactivateOnIdle(): void {
    this.ensureRuntime();
    this.runtime!.deactivateOnIdle(this.grainContext || RuntimeContext.current);
  }

  /**
   * Delays the deactivation of this activation for at least the specified time duration.
   * A positive `timeSpan` value means “prevent GC of this activation for that time span”.
   * A negative `timeSpan` value means “cancel the previous setting of the delayDeactivation call and make this activation behave based on the regular Activation Garbage Collection settings”.
   * The deactivateOnIdle method would undo/override any current “keep alive” setting,
   * making this grain immediately available for deactivation.
   * @param timeSpan Time duration to delay deactivation.
   */
  protected delayDeactivation(timeSpan: number): void {
    this.ensureRuntime();
    this.runtime?.delayDeactivation(
      this.grainContext || RuntimeContext.current,
      timeSpan
    );
  }

  /**
   * This method is called at the end of the process of activating a grain.
   * It is called before any messages have been dispatched to the grain.
   * For grains with declared persistent state, this method is called after the state property has been populated.
   * @param cancellationToken A cancellation token which signals when activation is being canceled.
   * @returns A Promise that resolves when the activation process is completed.
   */
  async onActivate(cancellationToken: CancellationToken): Promise<void> {
    return Promise.resolve();
  }

  /**
   * This method is called at the beginning of the process of deactivating a grain.
   * @param reason The reason for deactivation. Informational only.
   * @param cancellationToken A cancellation token which signals when deactivation should complete promptly.
   * @returns A Promise that resolves when the deactivation process is completed.
   */
  async onDeactivate(cancellationToken: CancellationToken): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Ensures that the runtime is available.
   * Throws an error if the runtime is not available.
   */
  private ensureRuntime(): void {
    if (!this.runtime) {
      throw new Error(
        'Grain was created outside of the Orleans creation process and no runtime was specified.'
      );
    }
  }

  // protected readState(): Promise<Result<None, void>> {
  //   return this.storage.readState();
  // }

  // protected writeState(): Promise<Result<None, void>> {
  //   return this.storage.writeState();
  // }

  // protected clearState(): Promise<Result<None, void>> {
  //   return this.storage.clearState();
  // }

  // // Process an incoming message and update the grain's state if necessary
  // async sendMessage(message: IGrainMessage): Promise<Result<None, string>> {
  //   const versionedMessage = await this.convertToLatestMessageVersion(message);
  //   const newState = await this.applyMessageToState(versionedMessage);
  //   this.state = produce(this.state, (draft: Draft<IGrainState>) => {
  //     return newState;
  //   });
  //   await this.notifySubscribers();

  //   return Ok(None);
  // }

  // // Convert the incoming message to the latest version and apply it to the state
  // protected abstract applyMessageToState(
  //   message: IGrainMessage
  // ): Promise<IGrainState>;

  // protected abstract convertToLatestMessageVersion(
  //   message: IGrainMessage
  // ): Promise<IGrainMessage>;

  // public async subscribe(subscriber: () => void) {
  //   this.subscribers.push(subscriber);
  // }

  // public async unsubscribe(subscriber: () => void) {
  //   this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  // }

  // // Notify all the subscribers about the state change
  // private async notifySubscribers() {
  //   for (const subscriber of this.subscribers) {
  //     subscriber();
  //   }
  // }
}

// export class GrainState<IGrainState> extends Grain {
//   public participate(lifecycle: IGrainLifecycle): void {
//     lifecycle.subscribe(
//       this.constructor.name,
//       GrainLifecycleStage.SetupState,
//       this.onSetupState.bind(this)
//     );
//   }

//   private onSetupState(): Promise<void> {
//     this.storage = this.runtime!.getStorage<TGrainState>(this.grainContext!);
//     return this.readState();
//   }
// }

export abstract class GrainReference {
  constructor(public id: string) {}

  // Send a message to the associated grain
  abstract sendMessage(message: IGrainMessage): Promise<Result<None, string>>;
}
