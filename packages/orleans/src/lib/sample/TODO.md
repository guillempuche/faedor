Create a package in Typescript mimicking the framework Orleans (.NET) functionalities and main features described here:
```
The fundamental building block in any Orleans application is a grain. Grains are entities comprising user-defined identity, behavior, and state. Grain identities are user-defined keys which make Grains always available for invocation. 

Grains can have volatile and/or persistent state that can be stored in any storage system. Grain state is kept in memory while the grain is active, leading to lower latency and less load on data stores.

Instantiation of grains is automatically performed on demand by the Orleans runtime. Grains which are not used for a while are automatically removed from memory to free up resources. This is possible because of their stable identity, which allows invoking grains whether they are already loaded into memory or not. This also allows for transparent recovery from failure because the caller does not need to know on which server a grain is instantiated on at any point in time. Grains have a managed lifecycle, with the Orleans runtime responsible for activating/deactivating, and placing/locating grains as needed. This allows the developer to write code as if all grains were always in-memory.

## Main features:
### Streams

Streams help developers to process series of data items in near-real time. Streams in Orleans are *managed*: streams do not need to be created or registered before a grain or client publishes to a stream or subscribes to a stream. This allows for greater decoupling of stream producers and consumers from each other and from the infrastructure. Stream processing is reliable: grains can store checkpoints (cursors) and reset to a stored checkpoint during activation or at any point afterwards.

### Grain persistence

Grains can have multiple named persistent data objects associated with them. These state objects are loaded from storage during grain activation so that they are available during requests. Grain persistence uses an extensible plugin model so that storage providers for any database can be used. This persistence model is designed for simplicity, and is not intended to cover all data access patterns. Grains can also access databases directly, without using the grain persistence model.

Grains interact with their persistent state using IPersistentState where `TState` is the serializable state type:
```csharp
public interface IPersistentState<TState> : IStorage<TState>
{
}

public interface IStorage<TState> : IStorage
{
    TState State { get; set; }
}

public interface IStorage
{
    string Etag { get; }

    bool RecordExists { get; }

    Task ClearStateAsync();

    Task WriteStateAsync();

    Task ReadStateAsync();
}
```
Instances of `IPersistentState<TState>` are injected into the grain as constructor parameters. These parameters can be annotated with a <xref:Orleans.Runtime.PersistentStateAttribute> attribute to identify the name of the state being injected and the name of the storage provider which provides it. The following example demonstrates this by injecting two named states into the `UserGrain` constructor:

```csharp
public class UserGrain : Grain, IUserGrain
{
    private readonly IPersistentState<ProfileState> _profile;
    private readonly IPersistentState<CartState> _cart;

    public UserGrain(
        [PersistentState("profile", "profileStore")] IPersistentState<ProfileState> profile,
        [PersistentState("cart", "cartStore")] IPersistentState<CartState> cart)
    {
        _profile = profile;
        _cart = cart;
    }
}
```

Different grain types can use different configured storage providers, even if both are the same type; for example, two different Azure Table Storage provider instances, connected to different Azure Storage accounts.

#### Read state

Grain state will automatically be read when the grain is activated, but grains are responsible for explicitly triggering the write for any changed grain state when necessary.

If a grain wishes to explicitly re-read the latest state for this grain from the backing store, the grain should call the <xref:Orleans.Grain%601.ReadStateAsync%2A> method. This will reload the grain state from the persistent store via the storage provider, and the previous in-memory copy of the grain state will be overwritten and replaced when the `Task` from `ReadStateAsync()` completes.

The value of the state is accessed using the `State` property. For example, the following method accesses the profile state declared in the code above:

```csharp
public Task<string> GetNameAsync() => Task.FromResult(_profile.State.Name);
```

There is no need to call `ReadStateAsync()` during normal operation; the state is loaded automatically during activation. However, `ReadStateAsync()` can be used to refresh state which is modified externally.

#### Write state

The state can be modified via the `State` property. The modified state is not automatically persisted. Instead, the developer decides when to persist state by calling the <xref:Orleans.Grain%601.WriteStateAsync%2A> method. For example, the following method updates a property on `State` and persists the updated state:

```csharp
public async Task SetNameAsync(string name)
{
    _profile.State.Name = name;
    await _profile.WriteStateAsync();
}
```

#### Clear state

The <xref:Orleans.Grain%601.ClearStateAsync%2A> method clears the grain's state in storage. Depending on the provider, this operation may optionally delete the grain state entirely.

Before a grain can use persistence, a storage provider must be configured on the silo.

First, configure storage providers, one for profile state and one for cart state:

#### Full example
```csharp
using IHost host = new HostBuilder()
    .UseOrleans(siloBuilder =>
    {
        siloBuilder.AddAzureTableGrainStorage(
            name: "profileStore",
            configureOptions: options =>
            {
                // Configure the storage connection key
                options.ConfigureTableServiceClient(
                    "DefaultEndpointsProtocol=https;AccountName=data1;AccountKey=SOMETHING1");
            })
            .AddAzureBlobGrainStorage(
                name: "cartStore",
                configureOptions: options =>
                {
                    // Configure the storage connection key
                    options.ConfigureTableServiceClient(
                        "DefaultEndpointsProtocol=https;AccountName=data2;AccountKey=SOMETHING2");
                });
    })
    .Build();
```

```csharp
var host = new HostBuilder()
    .UseOrleans(siloBuilder =>
    {
        siloBuilder.AddAzureTableGrainStorage(
            name: "profileStore",
            configureOptions: options =>
            {
                // Use JSON for serializing the state in storage
                options.UseJson = true;

                // Configure the storage connection key
                options.ConnectionString =
                    "DefaultEndpointsProtocol=https;AccountName=data1;AccountKey=SOMETHING1";
            })
            .AddAzureBlobGrainStorage(
                name: "cartStore",
                configureOptions: options =>
                {
                    // Use JSON for serializing the state in storage
                    options.UseJson = true;

                    // Configure the storage connection key
                    options.ConnectionString =
                        "DefaultEndpointsProtocol=https;AccountName=data2;AccountKey=SOMETHING2";
                });
    })
    .Build();
```

Now that a storage provider has been configured with the name `"profileStore"`, we can access this provider from a grain.

The persistent state can be added to a grain in two primary ways:

1. By injecting `IPersistentState<TState>` into the grain's constructor.
2. By inheriting from <xref:Orleans.Grain%601>.

The recommended way to add storage to a grain is by injecting `IPersistentState<TState>` into the grain's constructor with an associated `[PersistentState("stateName", "providerName")]` attribute. For details on [`Grain<TState>`, see below](#using-graintstate-to-add-storage-to-a-grain). This is still supported but is considered a legacy approach.

Declare a class to hold our grain's state:

```csharp
public class ProfileState
{
    public string Name { get; set; }

    public Date DateOfBirth
}
```

Inject `IPersistentState<ProfileState>` into the grain's constructor:

```csharp
public class UserGrain : Grain, IUserGrain
{
    private readonly IPersistentState<ProfileState> _profile;

    public UserGrain(
        [PersistentState("profile", "profileStore")]
        IPersistentState<ProfileState> profile)
    {
        _profile = profile;
    }
}
```

> [!IMPORTANT]
> The profile state will not be loaded at the time it is injected into the constructor, so accessing it is invalid at that time. The state will be loaded before <xref:Orleans.Grain.OnActivateAsync%2A> is called.

Now that the grain has a persistent state, we can add methods to read and write the state:

```csharp
public class UserGrain : Grain, IUserGrain
{
    private readonly IPersistentState<ProfileState> _profile;

    public UserGrain(
        [PersistentState("profile", "profileStore")]
        IPersistentState<ProfileState> profile)
    {
        _profile = profile;
    }

    public Task<string> GetNameAsync() => Task.FromResult(_profile.State.Name);

    public async Task SetNameAsync(string name)
    {
        _profile.State.Name = name;
        await _profile.WriteStateAsync();
    }
}
```

There are two parts to the state persistence APIs: the API exposed to the grain via `IPersistentState<T>` or `Grain<T>`, and the storage provider API, which is centered around `IGrainStorage` — the interface which storage providers must implement:

```csharp
/// <summary>
/// Interface to be implemented for a storage able to read and write Orleans grain state data.
/// </summary>
public interface IGrainStorage
{
    /// <summary>Read data function for this storage instance.</summary>
    /// <param name="stateName">Name of the state for this grain</param>
    /// <param name="grainId">Grain ID</param>
    /// <param name="grainState">State data object to be populated for this grain.</param>
    /// <typeparam name="T">The grain state type.</typeparam>
    /// <returns>Completion promise for the Read operation on the specified grain.</returns>
    Task ReadStateAsync<T>(
        string stateName, GrainId grainId, IGrainState<T> grainState);

    /// <summary>Write data function for this storage instance.</summary>
    /// <param name="stateName">Name of the state for this grain</param>
    /// <param name="grainId">Grain ID</param>
    /// <param name="grainState">State data object to be written for this grain.</param>
    /// <typeparam name="T">The grain state type.</typeparam>
    /// <returns>Completion promise for the Write operation on the specified grain.</returns>
    Task WriteStateAsync<T>(
        string stateName, GrainId grainId, IGrainState<T> grainState);

    /// <summary>Delete / Clear data function for this storage instance.</summary>
    /// <param name="stateName">Name of the state for this grain</param>
    /// <param name="grainId">Grain ID</param>
    /// <param name="grainState">Copy of last-known state data object for this grain.</param>
    /// <typeparam name="T">The grain state type.</typeparam>
    /// <returns>Completion promise for the Delete operation on the specified grain.</returns>
    Task ClearStateAsync<T>(
        string stateName, GrainId grainId, IGrainState<T> grainState);
}
```

```csharp
/// <summary>
/// Interface to be implemented for a storage able to read and write Orleans grain state data.
/// </summary>
public interface IGrainStorage
{
    /// <summary>Read data function for this storage instance.</summary>
    /// <param name="grainType">Type of this grain [fully qualified class name]</param>
    /// <param name="grainReference">Grain reference object for this grain.</param>
    /// <param name="grainState">State data object to be populated for this grain.</param>
    /// <returns>Completion promise for the Read operation on the specified grain.</returns>
    Task ReadStateAsync(
        string grainType, GrainReference grainReference, IGrainState grainState);

    /// <summary>Write data function for this storage instance.</summary>
    /// <param name="grainType">Type of this grain [fully qualified class name]</param>
    /// <param name="grainReference">Grain reference object for this grain.</param>
    /// <param name="grainState">State data object to be written for this grain.</param>
    /// <returns>Completion promise for the Write operation on the specified grain.</returns>
    Task WriteStateAsync(
        string grainType, GrainReference grainReference, IGrainState grainState);

    /// <summary>Delete / Clear data function for this storage instance.</summary>
    /// <param name="grainType">Type of this grain [fully qualified class name]</param>
    /// <param name="grainReference">Grain reference object for this grain.</param>
    /// <param name="grainState">Copy of last-known state data object for this grain.</param>
    /// <returns>Completion promise for the Delete operation on the specified grain.</returns>
    Task ClearStateAsync(
        string grainType, GrainReference grainReference, IGrainState grainState);
}
```

Create a custom storage provider by implementing this interface and [registering](#register-a-storage-provider) that implementation. For an example of an existing storage provider implementation, see [`AzureBlobGrainStorage`](https://github.com/dotnet/orleans/blob/af974d37864f85bfde5dc02f2f60bba997f2162d/src/Azure/Orleans.Persistence.AzureStorage/Providers/Storage/AzureBlobStorage.cs).

### Timers and reminders

Reminders are a durable scheduling mechanism for grains. They can be used to ensure that some action is completed at a future point even if the grain is not currently activated at that time. Timers are the non-durable counterpart to reminders and can be used for high-frequency events which do not require reliability. For more information, see [Microsoft Orleans: Timers and reminders](https://docs.microsoft.com/dotnet/orleans/grains/timers-and-reminders).

### Grain versioning

Application code evolves over time and upgrading live, production systems in a manner which safely accounts for these changes can be challenging, particularly in stateful systems. Grain interfaces in Orleans can be optionally versioned. For more information, see [Microsoft Orleans: Grain interface versioning](https://docs.microsoft.com/dotnet/orleans/grains/grain-versioning/grain-versioning).

### Stateless workers

Stateless workers are specially marked grains which do not have any associated state and can be activated on multiple silos simultaneously. This enables increased parallelism for stateless functions. For more information, see [Microsoft Orleans: Stateless worker grains](https://docs.microsoft.com/dotnet/orleans/grains/stateless-worker-grains) documentation.


## Other requirements:
- All classes, all methods and many class properties should has a full JSDoc.
- Logic inside methods should contain helpful comments, not be irrelevent but provide extra information.
- A library to use when trying to replicate the attributes concept of .NET, use the decorators with the library `tsyringe`.
- Before writing down each file, think twice to spot errors.
