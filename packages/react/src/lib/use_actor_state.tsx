import { useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { Actor } from './actor';

// The useActorState hook returns the current state of the actor,
// a sendMessage function to send messages to the actor,
// undo and redo functions, and canUndo and canRedo functions
// to check whether undo and redo operations are possible.
export function useActorState<State, Message>(
  actor: Actor<State, Message>
): [
  State,
  (message: Message) => void,
  () => void,
  () => void,
  () => boolean,
  () => boolean
] {
  // Memoize the getState function to prevent unnecessary re-renders
  const getState = useCallback(() => actor['state'], [actor]);

  // Memoize the subscribe function to prevent unnecessary re-renders
  const subscribe = useCallback(
    (callback: () => void) => actor.subscribe(callback),
    [actor]
  );

  // Use React's useSyncExternalStore hook to manage the state and subscription to the actor
  const state = useSyncExternalStore<State>(getState, subscribe);

  // Define a sendMessage function that sends a message to the actor
  const sendMessage = useCallback(
    (message: Message) => {
      actor.sendMessage(message);
    },
    [actor]
  );

  // Define undo and redo functions that call the corresponding methods on the actor instance
  const undo = useCallback(() => actor.undo(), [actor]);
  const redo = useCallback(() => actor.redo(), [actor]);

  // Define canUndo and canRedo functions to determine whether undo or redo operations are possible
  const canUndo = useCallback(() => actor.history.past.length > 0, [actor]);
  const canRedo = useCallback(() => actor.history.future.length > 0, [actor]);

  // Return the current state of the actor, the sendMessage function,
  // and the undo, redo, canUndo, and canRedo functions
  return [state, sendMessage, undo, redo, canUndo, canRedo];
}
