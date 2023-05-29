/**
 * The StreamProvider interface defines methods for creating event producers and
 * consumers.
 *
 * Namespaces are used to logically group and differentiate streams based on their
 * purpose or the data they carry. They can help you organize and manage streams
 * more effectively, especially when you have many streams in your application.
 * Namespaces are also useful for separating streams with different access permissions,
 * retention policies, or other configurations.Some examples of using namespaces:
 * - Grouping streams by the type of data they carry, such as "user_events", "order_events", or "product_updates".
 * - Separating streams based on the departments or teams responsible for them, like "sales", "marketing", or "engineering".
 * - Isolating streams with different access permissions, for instance, "public", "internal", or "admin".
 */
export interface StreamProvider<E> {
  createProducer(
    streamId: string,
    namespace: string
  ): Promise<EventProducer<E>>;
  createConsumer(
    streamId: string,
    namespace: string
  ): Promise<EventConsumer<E>>;
}

/**
 * The EventProducer interface defines methods for producing events in a stream.
 *
 * Namespaces are used to logically group and differentiate streams based on their
 * purpose or the data they carry. They can help you organize and manage streams
 * more effectively, especially when you have many streams in your application.
 * Namespaces are also useful for separating streams with different access permissions,
 * retention policies, or other configurations.Some examples of using namespaces:
 * - Grouping streams by the type of data they carry, such as "user_events", "order_events", or "product_updates".
 * - Separating streams based on the departments or teams responsible for them, like "sales", "marketing", or "engineering".
 * - Isolating streams with different access permissions, for instance, "public", "internal", or "admin".
 */
export interface EventProducer<E> {
  streamId: string;
  namespace: string;
  produce(event: E): Promise<void>;
}

/**
 * The EventConsumer interface defines methods for consuming events from a stream.
 */
export interface EventConsumer<E> {
  streamId: string;
  namespace: string;
  subscribe(callback: (event: E) => void): void;
  unsubscribe(callback: (event: E) => void): void;
}

/**
 * The InMemoryStreamProvider class implements the StreamProvider interface and
 * provides an in-memory implementation for creating event producers and consumers.
 *
 * Called in-memory because it stores the events and streams in the memory of the
 * application rather than using a separate, external storage system like a database
 * or a message broker. This means that the stream data is not persisted across
 * application restarts or crashes and is only available as long as the application
 * is running. In-memory stream providers are usually used for development, testing,
 * or scenarios where persistence and durability of the stream data are not crucial.
 */
export class InMemoryStreamProvider<E> implements StreamProvider<E> {
  /**
   * Store in-memory streams.
   */
  private streams: Map<string, InMemoryStream<E>> = new Map();

  /**
   * The method creates an event producer for a specific stream and namespace.
   */
  async createProducer(
    streamId: string,
    namespace: string
  ): Promise<EventProducer<E>> {
    const streamKey = this.getStreamKey(streamId, namespace);
    let stream = this.streams.get(streamKey);

    if (!stream) {
      stream = new InMemoryStream(streamId, namespace);
      this.streams.set(streamKey, stream);
    }

    return stream.createProducer();
  }

  /**
   * The method creates an event consumer for a specific stream and namespace.
   */
  async createConsumer(
    streamId: string,
    namespace: string
  ): Promise<EventConsumer<E>> {
    const streamKey = this.getStreamKey(streamId, namespace);
    let stream = this.streams.get(streamKey);

    if (!stream) {
      stream = new InMemoryStream(streamId, namespace);
      this.streams.set(streamKey, stream);
    }

    return stream.createConsumer();
  }

  /**
   * The method generates a unique key for a stream using its streamId and
   * namespace.
   */
  private getStreamKey(streamId: string, namespace: string): string {
    return `${namespace}-${streamId}`;
  }
}

/**
 * The InMemoryStream represents a single in-memory stream that can be used for
 * publishing and consuming events.
 *
 * Called in-memory because it stores the events and streams in the memory of the
 * application rather than using a separate, external storage system like a database
 * or a message broker. This means that the stream data is not persisted across
 * application restarts or crashes and is only available as long as the application
 * is running. In-memory stream providers are usually used for development, testing,
 * or scenarios where persistence and durability of the stream data are not crucial.
 */
class InMemoryStream<E> implements EventProducer<E>, EventConsumer<E> {
  /**
   * A Set to store subscribers' callbacks.
   */
  private subscribers: Set<(event: E) => void> = new Set();

  constructor(public streamId: string, public namespace: string) {}

  /**
   * The method produces an event and sends it to all subscribers.
   */
  async produce(event: E): Promise<void> {
    this.subscribers.forEach((subscriber) => subscriber(event));
  }

  subscribe(callback: (event: E) => void): void {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: (event: E) => void): void {
    this.subscribers.delete(callback);
  }

  /**
   * The method returns the current instance as an EventProducer.
   */
  createProducer(): EventProducer<E> {
    return this;
  }

  /**
   * The method returns the current instance as an EventConsumer.
   */
  createConsumer(): EventConsumer<E> {
    return this;
  }
}
