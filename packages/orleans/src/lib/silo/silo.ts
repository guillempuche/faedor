import { ServiceBroker, BrokerOptions } from 'moleculer';

import { StreamProvider, StorageProvider } from '.';
import { IGrain } from '../grains';

export class ApplicationParts {
  private readonly parts: Array<IGrain>;

  constructor() {
    this.parts = [];
  }

  addApplicationPart(applicationPart: IGrain): ApplicationParts {
    this.parts.push(applicationPart);
    return this;
  }

  initializeParts(): void {
    for (const applicationPart of this.parts) {
      require(applicationPart.toString());
    }
  }
}

export interface Broker {
  start(): Promise<void>;
  stop(): Promise<void>;
  createService(service: any): void;
  call(actionName: string, params: any): Promise<any>;
}

export interface SiloConfig {
  applicationParts: ApplicationParts;
  services: Array<any>;
  streamProviders: Array<StreamProvider<any>>;
  storageProviders: Array<StorageProvider>;
}

// https://learn.microsoft.com/en-us/dotnet/orleans/overview#what-are-silos
export class Silo {
  private activatedGrains: Map<string, IGrain> = new Map();
  private config: SiloConfig;
  private broker: Broker;

  constructor(config: SiloConfig, options: BrokerOptions) {
    this.broker = new ServiceBroker(options) as Broker;
    this.config = config;
    this.initialize();
  }

  private initialize() {
    this.registerServices();
    this.configureStreamProvider();
    this.configureStorageProvider();
  }

  /**
   * The ApplicationParts is responsible for discovering and managing the grain
   * types in the app, which includes both grain interfaces and grain implementations.
   * By specifying the application parts containing your grain types and their
   * dependencies, you inform the Orleans runtime about which types should be
   * used for grain activation and communication.
   */
  private configureApplicationParts(
    configure: (parts: ApplicationParts) => void
  ): void {
    configure(this.config.applicationParts);
  }

  // private loadAssemblies() {
  //   // Load assemblies using ApplicationPartManager
  //   this.config.applicationPartManager.initializeAssemblies();
  // }

  private registerServices() {
    // Register services specified in the config
    for (const service of this.config.services) {
      // Use Faedor's internal mechanism for service registration
      // Faedor.registerService(service);
    }
  }

  private configureStreamProviders() {
    // Configure the stream providers specified in the config
    for (const streamProvider of this.config.streamProviders) {
      // Use Faedor's internal mechanism for stream provider registration
      // Faedor.registerStreamProvider(streamProvider);
    }
  }

  private configureStorageProviders() {
    // Configure the storage providers specified in the config
    for (const storageProvider of this.config.storageProviders) {
      // Use Faedor's internal mechanism for storage provider registration
      // Faedor.registerStorageProvider(storageProvider);
    }
  }

  // Start the silo and register the grain services
  async start(): Promise<void> {
    // Hosting grains & Grain activation
    // Register grain services (Moleculer manages the lifecycle, activation, and deactivation)
    this.broker.createService(MyGrain);

    // Start the broker
    await this.broker.start();

    this.config.applicationParts.initializeParts();

    for (const service of this.services) {
      await service.start();
    }
  }

  // Stop the silo and gracefully shut down the broker
  async stop(): Promise<void> {
    await this.broker.stop();
  }

  activateGrain(grain: IGrain): void {
    this.activatedGrains.set(grain.id, grain);
    console.log(`Activated grain: ${grain.id}`);
  }

  deactivateGrain(grainId: string): void {
    this.activatedGrains.delete(grainId);
    console.log(`Deactivated grain: ${grainId}`);
  }

  // Grain placement & Message routing
  // Send a message to another grain in the cluster
  async sendMessage(
    grainName: string,
    methodName: string,
    params: unknown
  ): Promise<unknown> {
    // Moleculer handles grain placement and message routing
    return this.broker.call(`${grainName}.${methodName}`, params);
  }

  // Stream processing
  // This method should be customized to integrate with a specific streaming platform (e.g., Kafka, RabbitMQ)
  async processStream(streamName: string, message: any): Promise<void> {
    // Implement stream processing logic
    // Implement stream processing logic here
    // For example, produce a message to the stream, consume messages, and route them to the appropriate grains
  }

  // State management
  // Configure state management for grains by setting the correct storage provider in the Moleculer broker options.
  // You can create custom storage providers if needed and pass them in the options during the FaedorSilo instantiation.
}
