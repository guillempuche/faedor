// Assembly.ts
export abstract class Assembly {
  // Implement any common functionality for assemblies here
  abstract initialize(): void;
}

// Service.ts
export abstract class Service {
  // Implement any common functionality for services here
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}

// StreamProvider.ts
export interface Stream<T> {
  subscribe(callback: (event: T) => void): void;
  unsubscribe(callback: (event: T) => void): void;
  produce(event: T): Promise<void>;
}

export abstract class StreamProvider<T> {
  // Implement common functionality for stream providers here
  abstract createStream(
    streamId: string,
    namespace: string
  ): Promise<Stream<T>>;
}

// StorageProvider.ts
export interface StatefulGrain<TState> {
  readState(): Promise<TState>;
  writeState(state: TState): Promise<void>;
  clearState(): Promise<void>;
}

export abstract class StorageProvider<TState> {
  // Implement common functionality for storage providers here
  abstract createStatefulGrain(
    grainId: string,
    namespace: string
  ): Promise<StatefulGrain<TState>>;
}

export class ApplicationPartManager {
  private assemblies: Assembly[] = [];

  addAssembly(assembly: Assembly): ApplicationPartManager {
    this.assemblies.push(assembly);
    return this;
  }

  initializeAssemblies(): void {
    for (const assembly of this.assemblies) {
      assembly.initialize();
    }
  }
}
