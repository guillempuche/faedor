# orleans

## Building

Run `nx build orleans` to build the library.

## Running unit tests

Run `nx test orleans` to execute the unit tests via [Jest](https://jestjs.io).

## Faedor

Based on Orleans, a .NET Virtual Actor Model.


### State and events

#### Differences between subscriptions of state and events:

- State changes:
  - When the Todo app wants to receive real-time updates about a specific Todo item's state, such as its title or completion status, it would subscribe to state changes for that item. This would allow the app to stay up-to-date with the latest information without having to constantly query or refresh the data.
  - When the Todo app wants to track the progress of a particular Todo item, such as the percentage of completion, it would subscribe to state changes for that item. This would enable the app to continuously monitor the progress and provide real-time updates to users.
- Streams:
  - If the Todo app wants to receive notifications about new Todo items being created, it would subscribe to a stream that publishes events related to the creation of new items. This way, the app can update its user interface or take some other action whenever a new item is added.
  - If the Todo app needs to receive updates about the changes in the priority of Todo items or their assignments to different users, it would subscribe to a stream that publishes these events. This way, the app can react to any reordering, assignment changes, or other modifications in real-time.