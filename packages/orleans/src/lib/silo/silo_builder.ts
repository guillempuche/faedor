import { BrokerOptions } from 'moleculer';

import { ApplicationPartManager, Silo, SiloConfig } from './silo';

export class ClientBuilder {
  private siloConfig: SiloConfig;

  constructor() {
    this.siloConfig = {
      applicationPartManager: new ApplicationPartManager(),
      services: [],
      streamProvider: new CustomStreamProvider(),
      storageProvider: new CustomStorageProvider(),
    };
  }

  useSiloConfig(config: Partial<SiloConfig>): ClientBuilder {
    this.siloConfig = { ...this.siloConfig, ...config };
    return this;
  }

  async connect(): Promise<Silo> {
    const brokerOptions: BrokerOptions = {
      // Configure Moleculer broker options
    };

    const silo = new Silo(this.siloConfig, brokerOptions);
    await silo.start();
    return silo;
  }
}
