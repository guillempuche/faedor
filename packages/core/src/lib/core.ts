import produce, { produceWithPatches, applyPatches, Draft, Patch } from 'immer';

// Define a base message interface for all messages sent to actors.
interface BaseMessage {
  type: string;
  version?: number;
}

// Define a change interface for Immer's patches.
interface Change {
  op: 'replace' | 'remove' | 'add';
  path: (string | number)[];
  value?: any;
}

interface StateChange<State> {
  state: State;
  inversePatches: Patch[];
}
interface History<StateChange> {
  past: StateChange[];
  future: StateChange[];
}

// Actor class representing the base class for all actors.
export abstract class Actor<
  State extends Readonly<{}>,
  Message extends Readonly<BaseMessage>
> {
  private readonly id: string;
  private readonly parent?: Actor<State, Message>;
  private readonly children: Actor<State, Message>[] = [];
  private state: State;
  private subscribers: ((state: State) => void)[] = [];
  private history: History<{ state: State; inversePatches: Patch[] }> = {
    past: [],
    future: [],
  };

  constructor(id: string, initialState: State, parent?: Actor<State, Message>) {
    this.id = id;
    this.parent = parent;
    this.state = initialState;
    this.onStart();
  }

  // Private setter method to update the children array while maintaining immutability
  private _setChildren(children: Actor<State, Message>[]): void {
    Object.defineProperty(this, 'children', {
      value: Object.freeze(children),
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  // onStart is called when the actor is created.
  protected onStart(): void {}

  // onStop is called when the actor is stopped.
  protected onStop(): void {}

  // onRestart is called when the actor is restarted.
  protected onRestart(): void {}

  // Subscribes a callback function to be called when the state changes.
  subscribe(callback: (state: State) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(
        (subscriber) => subscriber !== callback
      );
    };
  }

  // Sends a message to the actor, which is processed and may cause a state change.
  sendMessage(message: Message): void {
    // Enforce forward compatibility by handling unknown message types gracefully.
    if (!this.isMessageTypeValid(message.type)) {
      console.warn(`Unknown message type: ${message.type}`);
      return;
    }

    this.processMessage(message);
  }

  // Returns true if the message type is valid, false otherwise.
  protected abstract isMessageTypeValid(type: string): boolean;

  /**
   * Processes an incoming message, updates the state, and manages the undo/redo history.
   * @param message - The message to process.
   */
  private processMessage(message: Message) {
    // Use the Immer library's "produceWithPatches" function to create a new state
    // by applying the changes described in the "handleMessage" method, and obtain
    // the patches and inverse patches directly.
    const [newState, patches, inversePatches] = produceWithPatches(
      this.state,
      (draft: Draft<State>): void => {
        // Call the "handleMessage" method with the draft state and the input message.
        // "handleMessage" is an abstract method that needs to be implemented in each
        // concrete actor class. It defines how each specific message type should
        // affect the state.
        this.handleMessage(draft, message);
      }
    );

    // Update the state with the new state produced by "produceWithPatches".
    this.state = newState;

    // Use the patches and inverse patches to manage the undo/redo history.
    // The current state and inverse patches are pushed onto the "past" array in
    // the "history" object. The "future" array in the "history" object is
    // cleared since new changes have been made, making any previously undone
    // changes non-applicable.
    this.history.past.push({ state: this.state, inversePatches });

    // Clear future when new changes are made
    this.history.future = [];

    this.notifySubscribers();
  }

  // Handles the received message, modifying the draft state according
  // to the message type.
  protected abstract handleMessage(draft: Draft<State>, message: Message): void;

  // Notifies subscribers about state changes.
  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  // Undoes the last state change, moving the inverse changes from the history to the future.
  undo(): void {
    if (this.history.past.length === 0) {
      return;
    }

    const { state, inversePatches } = this.history.past.pop()!;
    const [newState, newPatches] = applyPatches(this.state, inversePatches);

    this.history.future.push({ state: this.state, inversePatches: newPatches });
    this.state = newState;
    this.notifySubscribers();
  }

  // Redoes the last undone state change, moving the inverse changes from the future to the history.
  redo(): void {
    if (this.history.future.length === 0) {
      return;
    }

    const { state, inversePatches } = this.history.future.pop()!;
    const [newState, newPatches] = applyPatches(this.state, inversePatches);

    this.history.past.push({ state: this.state, inversePatches: newPatches });
    this.state = newState;
    this.notifySubscribers();
  }

  // The createChild method is used to create a child actor with a given ID and initial state.
  // The factory function is provided to create a new instance of the desired actor class.
  createChild(
    id: string, // The unique ID for the child actor
    initialState: State, // The initial state of the child actor
    factory: (
      // A factory function that creates a new instance of an actor
      id: string,
      initialState: State,
      parent: Actor<State, Message>
    ) => Actor<State, Message>
  ): Actor<State, Message> {
    // Call the factory function to create the child actor with the provided ID, initial state, and parent
    const child = factory(id, initialState, this);

    // Produce a new children array with the new child actor added
    const newChildren = produce(this.children, (draft) => {
      draft.push(child);
    });

    this._setChildren(newChildren);

    // Return the created child actor
    return child;
  }

  // The removeChild method is used to remove a child actor by its ID.
  // If the child actor with the given ID is found, it will be removed from the list of children.
  removeChild(childId: string): boolean {
    // Find the index of the child actor with the given ID in the list of children
    const childIndex = this.children.findIndex(
      (child) => child.getId() === childId
    );

    // If the child actor is not found (i.e., childIndex is -1), return false to indicate that the removal was unsuccessful
    if (childIndex === -1) {
      return false;
    }

    // Produce a new children array with the child actor removed
    const newChildren = produce(this.children, (draft) => {
      draft.splice(childIndex, 1);
    });

    this._setChildren(newChildren);

    // Return true to indicate that the removal was successful
    return true;
  }

  // Returns the actor's unique ID.
  getId(): string {
    return this.id;
  }

  // Returns the actor's parent, if it has one.
  getParent(): Actor<State, Message> | undefined {
    return this.parent;
  }
}
