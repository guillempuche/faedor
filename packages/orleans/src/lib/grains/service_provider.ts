import { None, Option, Result, Some } from 'ts-results';

/**
 * Defines a mechanism for retrieving a service object; that is, an object that
 * provides custom support to other objects.
 *
 * https://learn.microsoft.com/en-us/dotnet/api/system.iserviceprovider
 */
export interface IServiceProvider {
  getService<T>(): Option<T>;
  getServices<T>(): Option<T[]>;
  getRequiredService<T>(): Result<T, Error>;
}

/**
 * Represents a basic, dependency injection container.
 */
export class ServiceProvider implements IServiceProvider {
  private services: any[];

  constructor() {
    this.services = [];
  }

  /**
   * Registers a service with the specified service type and instance.
   * @param serviceType - The type of the service.
   * @param instance - The instance of the service.
   */
  register<T>(instance: T): void {
    this.services.push(instance);
  }

  /**
   * Dispose of the ServiceProvider and its services.
   */
  dispose(): void {
    this.services = [];
  }

  /**
   * Get a service of type T from the ServiceProvider.
   * @param serviceType - The type of the service.
   * @returns - The `Option` of the service's instance.
   */
  getService<T>(): Option<T> {
    // Retrieve the service from the services map
    const service = this.services.find((service) => service instanceof T);

    if (service !== undefined) return Some(service);
    else return None;
  }

  /**
   * Get an enumeration of services of type T from the IServiceProvider.
   * @param provider - The IServiceProvider instance.
   * @returns - The `Option` of an array of service's instances.
   */
  getServices<T>(): Option<T[]> {
    const entries = this.services.filter((service) => service instanceof T);
    if (!entries) {
      return None;
    }
    return Some(entries);
  }

  /**
   * Get a required service of type T from the ServiceProvider.
   * @param provider - The IServiceProvider instance.
   * @returns - A result of the instance of the service or error if the service is not registered.
   */
  getRequiredService<T>(): Result<T, Error> {
    const service = this.getService<T>();

    // Throw an error if the service is not registered
    return service.toResult(Error(`Service of type '${T}' is not registered.`));
  }

  // /**
  //  * Get a service of type T from the ServiceProvider.
  //  * @param serviceType - The type of the service.
  //  * @returns - The instance of the service or null if not registered.
  //  */
  // getService<T>(serviceType: string): T | null {
  //   const serviceInfo = this.services.get(serviceType);
  //   if (!serviceInfo) {
  //     return null;
  //   }

  //   if (serviceInfo.scope === 'singleton' || serviceInfo.scope === 'scoped') {
  //     if (!serviceInfo.instance) {
  //       serviceInfo.instance = serviceInfo.factory();
  //     }
  //     return serviceInfo.instance as T;
  //   } else {
  //     return serviceInfo.factory() as T;
  //   }
  // }

  // /**
  //  * Get a service of type T from the IServiceProvider.
  //  * @param serviceProvider - The IServiceProvider instance.
  //  * @param serviceType - The type of the service.
  //  * @returns - The instance of the service or null if not registered.
  //  */
  // static getService<T>(
  //   serviceProvider: IServiceProvider,
  //   serviceType: string
  // ): T | null {
  //   // Retrieve the service from the serviceProvider
  //   return serviceProvider.getService<T>(serviceType);
  // }

  // /**
  //  * Get an enumeration of services of type T from the ServiceProvider.
  //  * @param serviceType - The type of the service.
  //  * @returns - An array of instances of the service.
  //  */
  // getServices<T>(serviceType: string): T[] {
  //   const serviceInfo = this.services.get(serviceType);
  //   if (!serviceInfo) {
  //     return [];
  //   }

  //   const instances: T[] = [];
  //   if (serviceInfo.scope === 'singleton' || serviceInfo.scope === 'scoped') {
  //     if (!serviceInfo.instance) {
  //       serviceInfo.instance = serviceInfo.factory();
  //     }
  //     instances.push(serviceInfo.instance as T);
  //   } else {
  //     instances.push(serviceInfo.factory() as T);
  //   }

  //   return instances;
  // }

  // /**
  //  * Retrieves an instance of the specified service type by its name from the container.
  //  * @param name - The name of the service.
  //  * @returns The instance of the specified service type.
  //  */
  // getServiceByName<T>(name: string): T | null {
  //   // Iterate through the services, and if the service type name matches, return the instance
  //   for (const [serviceType, registration] of this.services.entries()) {
  //     if (serviceType === name) {
  //       if (registration.instance) {
  //         return registration.instance as T;
  //       }

  //       return registration.factory() as T;
  //     }
  //   }

  //   return null;
  // }

  // /**
  //  * Retrieves the required service instance of the specified service type from the container.
  //  * @param serviceProvider - The IServiceProvider instance.
  //  * @param serviceType - The type of the service.
  //  * @returns - The instance of the service.
  //  * @throws - If the service is not registered.
  //  */
  // static getRequiredService<T>(
  //   serviceProvider: IServiceProvider,
  //   serviceType: string
  // ): T {
  //   // Retrieve the service from the serviceProvider
  //   const service = serviceProvider.getService<T>(serviceType);

  //   // Throw an error if the service is not registered
  //   if (!service) {
  //     throw new Error(`Service of type '${serviceType}' is not registered.`);
  //   }

  //   return service;
  // }

  // /**
  //  * Retrieves the required service instance of the specified service type from the container.
  //  * @param serviceType - The type of the service.
  //  * @throws {Error} If the service is not registered.
  //  * @returns The instance of the specified service type.
  //  */
  // getRequiredService<T>(serviceType: string): T {
  //   const service = this.getService<T>(serviceType);

  //   if (!service) {
  //     throw new Error(
  //       `No service of type '${serviceType}' has been registered.`
  //     );
  //   }

  //   return service;
  // }

  // /**
  //  * Adds a singleton service to the container.
  //
  // * The purpose of scope in .NET, it refers to the lifetime of the registered
  // * services in a dependency injection container. There are three types of scopes
  // * in .NET:
  // * - Transient: A new instance is created each time the service is requested.
  // * These services are ideal for lightweight, stateless services.
  // * - Scoped: A single instance is created per scope. This is often used for
  // * services that maintain state during the lifetime of a request or a single user session.
  // * - Singleton: A single instance is created and shared throughout the entire
  // * application. These services are ideal for services that maintain global state or configurations.
  //
  //  * @param serviceType - The type of the service.
  //  * @param instance - The instance of the service.
  //  */
  // addSingleton(serviceType: string, instance: any): void {
  //   this.services.set(serviceType, {
  //     serviceType,
  //     instance,
  //     factory: () => instance,
  //   });
  // }
  // /**
  //  * Adds a transient service to the container.
  //  * @param serviceType - The type of the service.
  //  * @param factory - The factory function for creating instances of the service.
  //  */
  // addTransient(serviceType: string, factory: () => any): void {
  //   this.services.set(serviceType, { serviceType, instance: null, factory });
  // }
}
