import { None } from 'ts-results';

import { Grain, IGrainContext, IGrainStorage, IStorage } from '.';

/**
 * Provides access to grain state with functionality to save, clear, and refresh the state.
 *
 * `TState` is the type of state to persist.
 */
export interface IPersistentState<TState> extends IStorage {}

/**
 * Configuration for persistent state.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Runtime/Facet/Persistent/IPersistentStateConfiguration.cs
 */
export interface IPersistentStateConfiguration {
  /**
   * Gets the name of the state.
   */
  readonly stateName: string;
  /**
   * Gets the name of the storage provider.
   */
  readonly storageName: string | None;
}

export class IPersistentStateAttribute
  implements IPersistentStateConfiguration
{
  private _stateName: string;
  private _storageName: string | None;

  constructor(stateName: string, storageName?: string) {
    this._stateName = stateName;
    this._storageName = storageName ?? None;
  }

  get stateName(): string {
    return this._stateName;
  }

  get storageName(): string | None {
    return this._storageName;
  }
}

/**
 * Decorator for PersistentState (in Orleans, decorators are called attributes).
 */
export function PersistentState<TState>(
  stateName: string,
  storageName: string
) {
  return function (target: any, propertyKey: string) {
    const getter = function (this: Grain) {
      return this.readState<TState>(stateName, storageName);
    };

    const setter = function (this: Grain, newState: T) {
      this.writeState<TState>(stateName, storageName, newState);
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
    });
  };
}

/**
 * Factory for constructing `IPersistentState{TState}` instances for a grain.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Runtime/Facet/Persistent/IPersistentStateFactory.cs
 */
export interface IPersistentStateFactory {
  /**
   * Creates a persistent state instance for the provided grain.
   *
   * @returns {IPersistentState<TState>} - A persistent state instance for the provided grain with the specified configuration.
   */
  create<TState>(
    context: IGrainContext,
    config: IPersistentStateConfiguration
  ): IPersistentState<TState>;
}

/**
 * Specifies options for the IPersistentState constructor argument which it is applied to.
 */
export class PersistentStateAttribute {
  constructor(public stateName: string, public storageName?: string) {}
}

/**
 * Attribute mapper which maps persistent state attributes to a corresponding factory instance.
 */
export class PersistentStateAttributeMapper {
  /**
   * Create a persistent state object using the provided context and configuration.
   * @param context - The grain context.
   * @param genericCreate - The function that creates the persistent state object.
   * @param config - The configuration for the persistent state object.
   * @returns The created persistent state object.
   */
  create<TState>(
    context: IGrainContext,
    genericCreate: (...args: any[]) => any,
    config: IPersistentStateConfiguration
  ): any {
    // Get the IPersistentStateFactory from the grain context
    const factory =
      context.activationServices.getRequiredService<IPersistentStateFactory>();

    // Invoke the genericCreate function with the factory, context, and configuration as arguments
    return genericCreate.call(factory, context, config);
  }
}

/**
 * Creates IPersistentState instances for grains.
 */
export class PersistentStateFactory implements IPersistentStateFactory {
  create<TState>(
    context: IGrainContext,
    config: IPersistentStateConfiguration
  ): IPersistentState<TState> {
    const storageProvider: IGrainStorage | null = config.storageName
      ? context.activationServices.getServiceByName<IGrainStorage>(
          config.storageName
        )
      : context.activationServices.getService<IGrainStorage>();

    if (!storageProvider) {
      throw new Error(`Missing provider exception: ${context.grainId}`);
    }

    const fullStateName = config.stateName;
    const bridge = new PersistentStateBridge<TState>(
      fullStateName,
      context,
      storageProvider
    );
    bridge.participate(context.observableLifecycle);
    return bridge;
  }
}
