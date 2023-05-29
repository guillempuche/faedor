import { IDisposable } from './IDisposable';
import { IGrainContext } from './IGrainContext';
import { IGrainRuntime } from './IGrainRuntime';
import { IGrainFactory } from './IGrainFactory';
import { IServiceProvider } from './IServiceProvider';
import { IStorage } from './IStorage';
import { IGrainLifecycle } from './IGrainLifecycle';
import { GrainLifecycleStage } from './GrainLifecycleStage';

// https://github.com/dotnet/orleans/blob/main/src/Orleans.Core.Abstractions/Core/Grain.cs
export abstract class Grain {
  protected grainContext: IGrainContext | null = null;
  protected runtime: IGrainRuntime | null = null;

  protected get grainFactory(): IGrainFactory | null {
    return this.runtime?.grainFactory || null;
  }

  protected get serviceProvider(): IServiceProvider | null {
    return (
      this.grainContext?.activationServices ||
      this.runtime?.serviceProvider ||
      null
    );
  }

  constructor(grainContext?: IGrainContext, grainRuntime?: IGrainRuntime) {
    if (grainContext) {
      this.grainContext = grainContext;
    }
    if (grainRuntime) {
      this.runtime = grainRuntime;
    }
  }

  // Other methods and properties

  protected registerTimer(
    asyncCallback: (state: any) => Promise<void>,
    state: any,
    dueTime: number,
    period: number
  ): IDisposable {
    if (!asyncCallback) {
      throw new Error('asyncCallback is required.');
    }

    this.ensureRuntime();
    return this.runtime!.timerRegistry.registerTimer(
      this.grainContext,
      asyncCallback,
      state,
      dueTime,
      period
    );
  }

  protected deactivateOnIdle(): void {
    this.ensureRuntime();
    this.runtime!.deactivateOnIdle(this.grainContext);
  }

  protected delayDeactivation(timeSpan: number): void {
    this.ensureRuntime();
    this.runtime!.delayDeactivation(this.grainContext, timeSpan);
  }

  protected ensureRuntime(): void {
    if (!this.runtime) {
      throw new Error(
        'Grain was created outside of the Orleans creation process and no runtime was specified.'
      );
    }
  }
}

export class GrainWithState<TGrainState> extends Grain {
  private storage: IStorage<TGrainState>;

  protected get state(): TGrainState {
    return this.storage.state;
  }

  protected set state(value: TGrainState) {
    this.storage.state = value;
  }

  constructor(storage: IStorage<TGrainState>) {
    super();
    this.storage = storage;
  }

  protected clearState(): Promise<void> {
    return this.storage.clearState();
  }

  protected writeState(): Promise<void> {
    return this.storage.writeState();
  }

  protected readState(): Promise<void> {
    return this.storage.readState();
  }

  public participate(lifecycle: IGrainLifecycle): void {
    lifecycle.subscribe(
      this.constructor.name,
      GrainLifecycleStage.SetupState,
      this.onSetupState.bind(this)
    );
  }

  private onSetupState(): Promise<void> {
    this.storage = this.runtime!.getStorage<TGrainState>(this.grainContext!);
    return this.readState();
  }
}
