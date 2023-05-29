import { Err, None, Ok, Result } from 'ts-results';
import { IGrainState } from './grain';
import { IServiceProvider } from './service_provider';

/**
 * Provides method for operating on grain storage.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Core/IStorage.cs
 */
export interface IStorage {
  // LEGACY export interface IStorage<TState> {

  /**
   * LEGACY. Gets or sets the state.
   *
   * It should be implemented as getter and setters.
   */
  // state: TState;

  /**
   * Gets a value indicating whether the record already exists.
   */
  readonly recordExists: boolean;
  /**
   * Write data function for this storage instance.
   *
   * @returns {Promise} Completion promise for the write operation on the specified grain.
   */
  writeState(): Promise<Result<None, void>>;

  /**
   * Reads grain state from storage.
   */
  readState(): Promise<Result<None, void>>;

  /**
   * Delete/clear data function for this storage instance.
   *
   * @param {string} stateName - Name of the state for this grain.
   * @param {string} grainId - Grain identifier.
   * @param {IGrainState<T>} grainState - Copy of last-known state data object for this grain.
   * @returns {Promise} Completion promise for the read operation on the specified grain.
   */
  clearState(): Promise<Result<None, void>>;
}

/**
 * Interface to be implemented for a storage able to read and write Orleans grain state data.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core/Providers/IGrainStorage.cs
 */
export interface IGrainStorage {
  /**
   * Read data function for this storage instance.
   *
   * @param {string} stateName - Name of the state for this grain.
   * @param {string} grainId - Grain identifier.
   * @param {IGrainState<TState>} grainState - State data object to be populated for this grain.
   * @returns {Promise} Completion promise for the read operation on the specified grain.
   */
  readState<TState>(
    stateName: string,
    grainId: string,
    grainState: IGrainState<TState>
  ): Promise<Result<None, void>>;

  /**
   * Write data function for this storage instance.
   *
   * @param {string} stateName - Name of the state for this grain.
   * @param {string} grainId - Grain identifier.
   * @param {IGrainState<T>} grainState - State data object to be written for this grain.
   * @returns {Promise} Completion promise for the write operation on the specified grain.
   */
  writeState<TState>(
    stateName: string,
    grainId: string,
    grainState: IGrainState<TState>
  ): Promise<Result<None, void>>;

  /**
   * Delete/clear data function for this storage instance.
   *
   * @param {string} stateName - Name of the state for this grain.
   * @param {string} grainId - Grain identifier.
   * @param {IGrainState<TState>} grainState - Copy of last-known state data object for this grain.
   * @returns {Promise} Completion promise for the read operation on the specified grain.
   */
  clearState<TState>(
    stateName: string,
    grainId: string,
    grainState: IGrainState<TState>
  ): Promise<Result<None, void>>;
}

/**
 * Utility functions for grain storage.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core/Providers/GrainStorageHelpers.cs
 */
export class GrainStorageHelpers {
  /**
   * Gets the IGrainStorage associated with the specified grain type.
   *
   * @param grainType - The grain type.
   * @param services - The service provider.
   * @returns The IGrainStorage associated with the specified grain type.
   */
  public static getGrainStorage<T>(
    grainType: { new (...args: any[]): T },
    services: IServiceProvider
  ): Result<IGrainStorage, Error> {
    if (!grainType) throw new Error('grainType cannot be null');

    const attrs = grainType.getCustomAttributes(StorageProviderAttribute, true);
    const attr A=
      attrs.length > 0 ? (attrs[0] as StorageProviderAttribute) : null;
    const storageProvider = attr
      ? services.getServiceByName<IGrainStorage>(attr.providerName)
      : services.getService<IGrainStorage>();

    if (!storageProvider) {
      Err(this.throwMissingProviderException(grainType, attr?.providerName));
    }

    return Ok(storageProvider);
  }

  /**
   * Throws an error indicating that the storage provider is missing.
   *
   * @param grainType - The grain type.
   * @param name - The name of the missing storage provider.
   */
  private static throwMissingProviderException<T>(
    grainType: { new (...args: any[]): T },
    name?: string
  ): never {
    const grainTypeName = grainType.name;
    const errMsg = !name
      ? `No default storage provider found loading grain type ${grainTypeName}.`
      : `No storage provider named "${name}" found loading grain type ${grainTypeName}.`;

    throw new Error(errMsg);
  }
}

/**
 * The StorageProviderAttribute is used to define which storage provider to use for persistence of grain state.
 * Specifying StorageProviderAttribute property is recommended for all grains which extend Grain<T>.
 * If no StorageProviderAttribute is specified, then a "Default" storage provider will be used.
 * If a suitable storage provider cannot be located for this grain, then the grain will fail to load into the Silo.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Providers/ProviderGrainAttributes.cs
 */
export class StorageProviderAttribute {
  /**
   * Gets or sets the name of the provider to be used for persisting of grain state.
   */
  public providerName: string;

  /**
   * Initializes a new instance of the StorageProviderAttribute class.
   */
  constructor() {
    // this.providerName = ProviderConstants.DEFAULT_STORAGE_PROVIDER_NAME;
    this.providerName = 'default';
  }
}
