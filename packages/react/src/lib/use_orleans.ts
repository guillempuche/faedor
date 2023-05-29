import { useCallback } from 'react';
import { Grain, GrainReference } from '@faedor/orleans';
import { useSyncExternalStore } from 'react';

export function useFaedor<T extends Grain, R extends GrainReference>(
  grainFactory: () => { grain: T; grainReference: R }
): [T, R] {
  // Get the grain instance and grain reference from the grainFactory
  const grainInstance = grainFactory();

  // Create a memoized subscribe function using useCallback
  const subscribe = useCallback(
    (onStateChange: () => void) => {
      // Subscribe to the state changes in the grain
      grainInstance.grain.subscribe(onStateChange);

      // Return an unsubscribe function that removes the subscriber from the grain
      return () => {
        grainInstance.grain.unsubscribe(onStateChange);
      };
    },
    [grainInstance]
  );

  // Use the useSyncExternalStore hook to manage the grain's state
  // and force a re-render of the component when the state changes
  const [, forceRender] = useSyncExternalStore(
    () => grainInstance.grain.state,
    () => {},
    subscribe
  );

  // Return the grain instance and grain reference
  return [grainInstance.grain, grainInstance.grainReference];
}
