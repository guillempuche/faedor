/**
 * Proxy classes handle the communication between grains, allowing developers
 * to call methods on other grains as if they were local methods. This will
 * abstract away the underlying communication mechanism and provide a more
 * straightforward way for grains to interact with each other.
 */
import { Silo } from '../silo/silo';

/**
 * The function creates a proxy for a "grain" in the Virtual Actors Model.
 * The proxy helps in communicating with the grain without directly
 * interacting with it.
 */
// export function createGrainProxy<T extends new (...args: any[]) => T>(
//   grainInterface: InstanceType<T>,
//   silo: Silo
// ): InstanceType<T> {
export function createGrainProxy<IGrain>(grain: IGrain, silo: Silo): IGrain {
  // `handler` is an object that defines custom behavior for the grain proxy.
  // In this case, it only has one method called `get`.
  const handler: ProxyHandler<IGrain> = {
    // const handler = {
    // The `get` method is called when a property is accessed on the grain proxy.
    // `target` is the grain object, and `prop` is the property being accessed.
    get(target, prop, receiver) {
      if (typeof target[prop] === 'function') {
        // The method returns an asynchronous function that gets called
        // when the property is invoked as a method.
        return async (...args: any[]) => {
          // // `grainName` is the name of the grain interface/class.
          // const grainName = target.constructor.name;
          // // `methodName` is the name of the method being called on the grain.
          // const methodName = prop.toString();

          // // `silo.sendMessage` sends a message to the grain to execute
          // // the specified method. `grainName`, `methodName`, and `args` are passed
          // // as parameters. The result is then returned to the caller.
          // return silo.sendMessage(grainName, methodName, args);
          return target[prop](...args);
        };
      } else {
        console.log(`Accessed grain property: ${prop.toString()}`);
        return Reflect.get(target, prop, receiver);
      }
    },
    set(target, prop, value, receiver) {
      console.log(`Set grain property: ${prop.toString()} to value: ${value}`);
      return Reflect.set(target, prop, value, receiver);
    },
  };

  // `Proxy` is a built-in JavaScript class that creates a new object
  // with the specified custom behavior. Here, we pass `grainInterface`
  // as the target object and `handler` as the object defining custom behavior.
  // The resulting proxy object is then returned.
  return new Proxy(grain, handler);
}

// // Usage of `createGrainProxyB`
// // grainInterface.ts
// export interface IExampleGrain {
//   doSomething(param: string): Promise<string>;
// }
// import { IExampleGrain } from './grainInterface';
// import { createGrainProxy } from './grainProxyFactory';
// import { GrainFactory } from './grain_factory';
// const grainFactory = new GrainFactory(/* ... */);
// const exampleGrainProxy: IExampleGrain = createGrainProxy<IExampleGrain>(
//   {},
//   'exampleGrainId',
//   grainFactory
// );
// exampleGrainProxy.doSomething('test').then(console.log);

// export function createGrainProxyB<T>(
//   grainInterface: T,
//   grainId: string,
//   grainFactory: GrainFactory
// ): T {
//   return new Proxy(grainInterface, {
//     get(target, property) {
//       if (typeof target[property] === 'function') {
//         return async function (...args: any[]) {
//           return await grainFactory.invoke(
//             grainId,
//             property as string,
//             ...args
//           );
//         };
//       }

//       return target[property];
//     },
//   }) as T;
// }

export class GrainProxyRegistry {
  private static registry: Map<any, () => GrainProxy> = new Map();

  static register(target: any, factory: () => GrainProxy) {
    this.registry.set(target, factory);
  }

  static createProxy<T>(grainInterface: new (...args: any[]) => T): T {
    const factory = this.registry.get(grainInterface);
    if (!factory) {
      throw new Error(`No proxy registered for ${grainInterface}`);
    }
    return factory().createProxy<T>();
  }
}

interface StringManipulator {
  append(input: string, toAppend: string): string;
  prepend(input: string, toPrepend: string): string;
}

function createStringManipulatorProxy(): StringManipulator {
  const handler: ProxyHandler<StringManipulator> = {
    get(target, prop) {
      return (...args: any[]) => {
        console.log(`Called method: ${prop.toString()}`);
        return target[prop](...args);
      };
    },
  };

  const stringManipulator: StringManipulator = {
    append: (input, toAppend) => input + toAppend,
    prepend: (input, toPrepend) => toPrepend + input,
  };

  return new Proxy(stringManipulator, handler);
}
