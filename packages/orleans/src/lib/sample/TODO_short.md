Create Typescript code mimicking the framework Orleans (.NET).

The fundamental building block in any Orleans application is a grain. Grains are entities comprising user-defined identity, behavior, and state. Grain identities are user-defined keys which make Grains always available for invocation.

Grains can have volatile and/or persistent state that can be stored in any storage system. Grain state is kept in memory while the grain is active, leading to lower latency and less load on data stores.

Instantiation of grains is automatically performed on demand by the Orleans runtime. Grains which are not used for a while are automatically removed from memory to free up resources. This is possible because of their stable identity, which allows invoking grains whether they are already loaded into memory or not. This also allows for transparent recovery from failure because the caller does not need to know on which server a grain is instantiated on at any point in time. Grains have a managed lifecycle, with the Orleans runtime responsible for activating/deactivating, and placing/locating grains as needed. This allows the developer to write code as if all grains were always in-memory.

More information about grains here https://learn.microsoft.com/en-us/dotnet/orleans/grains/.

## Runtime
The Orleans runtime is what implements the programming model for applications. The main component of the runtime is the silo, which is responsible for hosting grains. Typically, a group of silos run as a cluster for scalability and fault-tolerance. When run as a cluster, silos coordinate with each other to distribute work, detect and recover from failures. The runtime enables grains hosted in the cluster to communicate with each other as if they are within a single process.

In addition to the core programming model, the silo provides grains with a set of runtime services, such as timers, reminders (persistent timers), persistence, transactions, streams, and more. See the features section below for more detail.

Web frontends and other external clients call grains in the cluster using the client library which automatically manages network communication. Clients can also be co-hosted in the same process with silos for simplicity.

## Main features


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

## Requirements:
- All classes, all methods and many class properties should has a full JSDoc.
- Logic inside methods should contain helpful comments, not be irrelevent but provide extra information.
- A library to use when trying to replicate the attributes concept of .NET, use the decorators with the library `tsyringe`.
- Before writing down each file, think twice to spot errors.
