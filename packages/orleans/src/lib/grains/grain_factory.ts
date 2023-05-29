// import { Grain, GrainReference, IGrainMessage } from '.';

// /**
//  * The GrainFactory is a mechanism for creating and obtaining references to grains.
//  * It helps to manage the creation and activation of grains, as well as providing
//  * a way to get references to existing grains. It simplifies the process of
//  * working with grains and abstracts away the complexities of grain management.
//  */
// export abstract class GrainFactory<Grain, GrainReference> {
//   /**
//    * This method is responsible for creating a grain instance.
//    * It takes the grain ID as an input and returns an instance of the grain with the given ID.
//    * It abstracts away the complexities of grain activation and helps in managing grain instances.
//    */
//   abstract createGrain: (id: string) => Grain;

//   /**
//    * This method is responsible for creating a grain reference.
//    * It takes the grain ID as an input and returns a reference to the grain with the given ID.
//    * In Orleans, this functionality is provided by the GrainFactory.
//    */
//   abstract createGrainReference: (id: string) => GrainReference;

//   private static registry = new GrainRegistry();

//   // Get a reference to a grain using its unique identifier.
//   public static getGrain<GrainReference>(
//     id: string,
//     grainCreator: () => GrainReference
//   ): GrainReference {
//     const grainReference: GrainReference = {
//       sendMessage: async (message: IGrainMessage) => {
//         const grain = GrainFactory.registry.activateGrain(id, grainCreator);
//         return await grain.processMessage(message);
//       },
//     };

//     return grainReference;
//   }
// }

import { IGrain, createGrainProxy } from '.';
import { Silo } from '../silo/silo';

/**
 * Functionality for creating references to grains.
 *
 * https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Core/IGrainFactory.cs
 */
export interface IGrainFactory {
  /**
   * Gets the grain's interface.
   *
   * @param {string} grainReference - Grain identifier.
   */
  getGrain(grainReference: string): IGrain;
}

/**
 * Grain Factory is responsible for creating grain proxies, which are used to
 * communicate with grains from either a client or another grain.
 */
export class GrainFactory {
  // export class GrainFactory implements IGrainFactory {
  constructor(private silo: Silo) {}

  getGrain(
    grainClass: new (...args: any[]) => IGrain,
    grainArgs: any[]
  ): IGrain {
    const grainProxy = createGrainProxy<IGrain>(
      new grainClass(grainArgs),
      this.silo
    );
    this.silo.activateGrain(grainProxy);
    return grainProxy;
  }
}
