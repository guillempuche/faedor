import { Err, None, Ok, Result } from 'ts-results';

import {
  ICollectibleGrainContext,
  IGrainContext,
  IGrainFactory,
  IServiceProvider,
  ITimerRegistry,
} from '.';

/**
 * The gateway of the Grain to the Orleans runtime. The Grain should only interact with the runtime through this interface.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Runtime/IGrainRuntime.cs
 */
export interface IGrainRuntime {
  /**
   * Gets a unique identifier for the current silo.
   * There is no semantic content to this string, but it may be useful for logging.
   */
  readonly siloIdentity: string;

  /**
   * Gets the silo address associated with this instance.
   */
  readonly siloAddress: string;

  /**
   * Gets the grain factory.
   */
  readonly grainFactory: IGrainFactory;

  /**
   * Gets the timer registry.
   */
  readonly timerRegistry: ITimerRegistry;

  /**
   * Gets the service provider.
   */
  readonly serviceProvider: IServiceProvider;

  /**
   * Deactivates the provided grain when it becomes idle.
   * @param grainContext The grain context.
   */
  deactivateOnIdle(grainContext: IGrainContext): void;

  /**
   * Delays idle activation collection of the provided grain due to inactivity until at least the specified time has elapsed.
   * @param grainContext The grain context.
   * @param timeSpan The time to delay idle activation collection for.
   */
  delayDeactivation(grainContext: IGrainContext | null, timeSpan: number): void;

  // /**
  //  * Gets grain storage for the provided grain.
  //  * @typeparam TGrainState The grain state type.
  //  * @param grainContext The grain context.
  //  * @returns The grain storage for the provided grain.
  //  */
  // getStorage<TGrainState>(grainContext: IGrainContext): IStorage<TGrainState>;
}

/**
 * GrainRuntime is a class that implements the IGrainRuntime interface.
 */
export class GrainRuntime implements IGrainRuntime {
  public readonly siloIdentity: string;
  public readonly siloAddress: string;
  // private readonly loggerFactory: ILoggerFactory;
  private readonly _serviceProvider: IServiceProvider;
  private readonly _timerRegistry: ITimerRegistry;
  private readonly _grainFactory: IGrainFactory;

  get grainFactory(): IGrainFactory {
    return this._grainFactory;
  }

  /**
   * Constructs a new instance of the GrainRuntime class.
   *
   * @param localSiloDetails - The local silo details.
   * @param grainFactory - The grain factory.
   * @param timerRegistry - The timer registry.
   * @param serviceProvider - The service provider.
   * @param loggerFactory - The logger factory.
   */
  constructor(
    localSiloDetails: ILocalSiloDetails,
    grainFactory: IGrainFactory,
    timerRegistry: ITimerRegistry,
    serviceProvider: IServiceProvider
    // loggerFactory: ILoggerFactory
  ) {
    this.siloAddress = localSiloDetails.siloAddress;
    this.siloIdentity = this.siloAddress;
    this._grainFactory = grainFactory;
    this._timerRegistry = timerRegistry;
    this._serviceProvider = serviceProvider;
    // this.loggerFactory = loggerFactory;
  }

  public get GrainFactory(): IGrainFactory {
    // GrainRuntime.checkRuntimeContext(RuntimeContext.Current);
    return this.grainFactory;
  }

  public get timerRegistry(): ITimerRegistry {
    // GrainRuntime.checkRuntimeContext(RuntimeContext.Current);
    return this._timerRegistry;
  }

  public get serviceProvider(): IServiceProvider {
    // GrainRuntime.checkRuntimeContext(RuntimeContext.current);
    return this._serviceProvider;
  }

  public deactivateOnIdle(grainContext: IGrainContext): void {
    GrainRuntime.checkRuntimeContext(grainContext);
    grainContext
      .deactivate
      // new DeactivationReasonCode(
      //   DeactivationReasonCode.ApplicationRequested,
      //   `${instanfe(DeactivateOnIdle)} was called.`
      // )
      ();
  }

  public delayDeactivation(
    grainContext: IGrainContext,
    timeSpan: number
  ): void {
    GrainRuntime.checkRuntimeContext(grainContext);
    // if (!(grainContext instanceof ICollectibleGrainContext)) {
    //   throw new Error(
    //     `Grain context ${grainContext} does not implement ${nameof(
    //       ICollectibleGrainContext
    //     )} and therefore ${nameof(DelayDeactivation)} is not supported`
    //   );
    // }

    (grainContext as ICollectibleGrainContext).delayDeactivation(timeSpan);
  }

  // // It uses legacy IStorage<TState> https://github.com/dotnet/orleans/blob/main/src/Orleans.Runtime/Storage/StateStorageBridge.cs
  // public getStorage<TGrainState>(
  //   grainContext: IGrainContext
  // ): Result<IStorage, Error> {
  //   if (!grainContext) Err(Error('grainContext is null'));
  //   const grainType = grainContext.grainInstance?.constructor;
  //   if (!grainType) Err(Error('grainContext.GrainInstance is null'));
  //   const grainStorage = GrainStorageHelpers.getGrainStorage(
  //     grainType,
  //     this._serviceProvider
  //   );
  //   if (grainStorage.ok) {
  //     return new StateStorageBridge<TGrainState>(
  //       'state',
  //       grainContext.grainId,
  //       grainStorage.val,
  //       // this.loggerFactory
  //     );
  //   } else {
  //     return Err(grainStorage.val);
  //   }
  // }

  /**
   * Check if the provided context is valid and throw an error if it is not.
   *
   * @param context - The grain context to check.
   */
  public static checkRuntimeContext(
    context: IGrainContext
  ): Result<None, Error> {
    if (!context) {
      return Err(throwMissingContext());
    }

    // if (
    //   context instanceof ActivationData &&
    //   (context.State === ActivationState.Invalid ||
    //     context.State === ActivationState.FailedToActivate)
    // ) {
    //   return Err(throwInvalidActivation(context));
    // }

    function throwMissingContext(): never {
      throw new Error(
        'Activation access violation. A non-activation thread attempted to access activation services.'
      );
    }

    // function throwInvalidActivation(activationData: ActivationData): never {
    //   throw new Error(
    //     `Attempt to access an invalid activation: ${activationData}`
    //   );
    // }

    return Ok(None);
  }
}

/**
 * Details of the local silo.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core/Runtime/ILocalSiloDetails.cs
 */
interface ILocalSiloDetails {
  /**
   * Gets the name of this silo.
   */
  readonly name: string;

  /**
   * Gets the cluster identity. This used to be called DeploymentId before Orleans 2.0 name.
   */
  readonly clusterId: string;

  /**
   * Gets the host name of this silo.
   * @remarks This is equal to `os.hostname()`.
   */
  readonly dnsHostName: string;

  /**
   * Gets the address of this silo's inter-silo endpoint.
   */
  readonly siloAddress: string;

  /**
   * Gets the address of this silo's gateway proxy endpoint.
   */
  readonly gatewayAddress: string;
}

/**
 * Functionality for managing the current grain context.
 *
 * Since JavaScript/TypeScript is single-threaded, thread-local storage in [Orleans](https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Core/Grain.cs)
 * is not applicable. Instead, we can use a simple singleton pattern to store the
 * context.
 */
export class RuntimeContext {
  /**
   * The singleton context.
   */
  private static _context: IGrainContext;

  /**
   * Gets the current grain context.
   */
  public static get current(): IGrainContext {
    return RuntimeContext._context;
  }

  /**
   * Sets the current grain context.
   * @param newContext The new context.
   */
  public static setExecutionContext(newContext: IGrainContext): void {
    RuntimeContext._context = newContext;
  }

  /**
   * Sets the current grain context.
   * @param newContext The new context.
   * @param existingContext The existing context.
   */
  // public static setExecutionContext(
  //   newContext: IGrainContext,
  //   existingContext: IGrainContext
  // ): void {
  //   existingContext = RuntimeContext._context;
  //   RuntimeContext._context = newContext;
  // }

  /**
   * Resets the current grain context.
   */
  // public static resetExecutionContext(): void {
  //   RuntimeContext._context = null;
  // }
}
