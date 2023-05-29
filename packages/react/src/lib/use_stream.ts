import { useEffect, useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store';
import { StreamProvider, EventProducer, EventConsumer } from '@faedor/orleans';

// This custom hook connects Faedor stream processing to your React app.
export function useFaedorStream<Event>(
  streamProvider: StreamProvider<Event>, // The stream provider instance
  streamId: string, // The stream ID to connect
  namespace: string // The namespace for the stream
): [Array<Event>, (event: Event) => void] {
  // Store the data and subscribers.
  const store = {
    events: [] as Event[],
    subscribers: new Set<(data: Event[]) => void>(),
  };

  const readEvents = () => store.events;

  // Function to handle new events
  const handleNewEvent = (newEvent: Event) => {
    const updatedEvents = [...store.events, newEvent];
    store.events = updatedEvents;
    store.subscribers.forEach((callback) => callback(updatedEvents));
  };

  const subscribe: (callback: (events: Event[]) => void) => void = (
    callback
  ) => {
    store.subscribers.add(callback);
  };

  const unsubscribe = (callback: (data: Event[]) => void) => {
    store.subscribers.delete(callback);
  };

  // Memoize the streamProvider to avoid unnecessary re-creations
  const memoizedStreamProvider = useMemo(() => streamProvider, []);

  // Sync the external store with the component.
  const [events] = useSyncExternalStore(subscribe, unsubscribe, readEvents);

  // Set up the producer and consumer for the stream.
  useEffect(() => {
    let producer: EventProducer<Event>;
    let consumer: EventConsumer<Event>;

    const setup = async () => {
      // Create an event producer and consumer
      producer = await memoizedStreamProvider.createProducer(
        streamId,
        namespace
      );
      consumer = await memoizedStreamProvider.createConsumer(
        streamId,
        namespace
      );

      // Define a callback function to handle incoming events
      const onEvent = (event: Event) => {
        handleNewEvent(event);
      };

      // Subscribe to the event consumer with the callback function
      consumer.subscribe(onEvent);

      // Cleanup function: unsubscribe from the consumer when the component is unmounted
      return () => {
        consumer.unsubscribe(onEvent);
      };
    };

    // Call the setup function to initialize producer and consumer
    setup();
  }, [memoizedStreamProvider, streamId, namespace]);

  // Define a function to produce new events
  const produceEvent = useCallback(
    async (event: Event) => {
      if (!producer) {
        producer = await memoizedStreamProvider.createProducer(
          streamId,
          namespace
        );
      }
      await producer.produce(event);
    },
    [memoizedStreamProvider, streamId, namespace]
  );

  // Return the list of events and the function to produce new events
  return [events, produceEvent];
}
