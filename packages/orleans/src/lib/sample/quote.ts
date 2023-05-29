import { None, Ok, Result } from 'ts-results';
import '@abraham/reflection';
import { container, inject, injectable } from 'tsyringe';

import {
  Grain,
  IGrainState,
  IPersistentState,
  PersistentState,
} from '../grains/';

const simulateLoad: (timeMs?: number) => Promise<void> = async (timeMs) =>
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise((_) => setTimeout(() => {}, timeMs ?? 1000));

interface IQuoteGrain {
  getText(): Result<string, void>;
  setText(text: string): Promise<Result<None, void>>;
}

interface QuoteState {
  text: string;
}

// Define a token for the UserState
const QuoteStateToken = Symbol('QuoteState');

// Register the UserState as a singleton
container.register<QuoteState>(QuoteStateToken, {
  useValue: {
    text: '',
  },
});

@injectable()
class QuoteGrain implements Grain, IQuoteGrain {
  // private readonly _state: IPersistentState<Quote>;
  // constructor(state: IPersistentState<Quote>) {
  //   this._state = state;
  // }
  constructor(
    @inject(PersistentState('quoteState', 'quotes'))
    private quoteState?: QuoteState
  ) {
    super();
  }

  getText(): string {
    return '';
    // return Ok(this._state.state.text);
  }

  async setText(text: string): Promise<void> {
    // await simulateLoad();
    // this._state.state.text = text;
    // this._state.writeState();
    return;
  }
}
