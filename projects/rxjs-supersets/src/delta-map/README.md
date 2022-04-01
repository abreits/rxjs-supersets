# DeltaMap <!-- omit in toc -->

The `DeltaMap` is a subclass of the javascript core `Map` class that uses the `delta$` property to publish changes made to it.

## Table of contents <!-- omit in toc -->
- [Examples](#examples)
- [Methods and properties](#methods-and-properties)
  - [`constructor`](#constructor)
  - [`delta$: DeltaObservable<Key, Value>`](#delta-deltaobservablekey-value)
  - [`destroy()`](#destroy)
  - [`observed`](#observed)
  - [`pauseDelta()`](#pausedelta)
  - [`resumeDelta()`](#resumedelta)

[back to main](../../README.md)

## Examples
``` typescript
// create a new DeltaMap 
const deltaMap = new DeltaMap<string, string>();

// create a new DeltaMap with a modified check
interface TimedObject {
  lastUpdated: Date;
  // other properties
}
const modifyCheckMap = new DeltaMap<string, TimedObject>({
  isModified: (current, previous) => current.lastUpdated > previous.lastUpdated
})

// subscribe to raw DeltaMap updates
const subscription = deltaMap.delta$.subscribe(delta => {
  // do something with the MapDelta delta
  if(delta.all.size > 0) ...
  if(delta.added.size > 0) ...
  if(delta.deleted.size > 0) ...
  if(delta.modified.size > 0) ...
});

// subscribe to DeltaMap updates with the processDelta operator
const subscription = deltaMap.delta$.pipe(processDelta({
  add: element => processAddElement(entry),
  modify: element => processModifyElement(element),
  delete: element => processDeleteElement(element)
})).subscribe();
```
[back to top](#deltamap----omit-in-toc)

## Methods and properties

The `DeltaMap` class has the following additions and modifications to its `Map<Key, Value>` superclass:

### `constructor`
<ul><li style="list-style-type: none;">

  The constructor for the `DeltaMap` class (called in `new DeltaMap<Key, Value>()`) can be used the same way as the `Map` constructor. It also accepts a settings argument instead or after the `preFilled` content argument. The `DeltaMapSettings` structure can contain the following two properties:

  - `isModified?: (T) => boolean` By default when an item is `set` in the `DeltaMap` with an `Id` key that is already present, it is assumed that it is newer and the existing key will be updated to the `set` item. 
  An `isModified` function can be added to only update the value when certain conditions have been met (e.g. the `date` property of the `set` item must be more recent than the exisiting item)

  - `publishEmpty?: boolean` By default a `DeltaMap` only publishes when someting changes from the default empty `DeltaMap`. 
  There are certain cases when a subscription wants to know if the `DeltaMap` is initially empty.
  You can set `publishempty` to `true` when you want the empty `DeltaMap` to publish its initial state, even if it is.

  Possible call options:
  ``` typescript
  new DeltaMap<KeyType, ValueType>()
  new DeltaMap<KeyType, ValueType>(entries: Iterable<any>)
  new DeltaMap<KeyType, ValueType>(settings: DeltaMapSettings)
  new DeltaMap<KeyType, ValueType>(entries: Iterable<any>, settings: DeltaMapSettings)
  ```
  [back to top](#deltamap----omit-in-toc)
</li></ul>

### `delta$: DeltaObservable<Key, Value>`
<ul><li style="list-style-type: none;">

  Publishes changes to the set created by the `get()`, `set()`, `delete()` and `clear()` methods.
  The changes are published in `MapDelta` format:

``` typescript
export interface MapDelta<Key, Value> {
  all: MapReader<Key, Value>;
  added: MapReader<Key, Value>;
  deleted: SetReader<Key>;
  modified: MapReader<Key, Value>;
}
```
[back to top](#deltamap----omit-in-toc)
</li></ul>

### `destroy()`
<ul><li style="list-style-type: none;">

Calls the `clear()` method and `complete`'s all delta$ subscriptions to the `DeltaMap`.

### `observed`
<ul><li style="list-style-type: none;">

Returns `true` if there are `delta$` subscribers to the `DeltaMap`.
[back to top](#deltamap----omit-in-toc)
</li></ul>

### `pauseDelta()`
<ul><li style="list-style-type: none;">

Pauses `delta$` update publication.
Changes will be collected, but updates will only be sent after `resumeCategoryDeltas()` is called.
This can be used to reduce the number of published.
[back to top](#deltamap----omit-in-toc)
</li></ul>

### `resumeDelta()`
<ul><li style="list-style-type: none;">

Resumes a the category updates again after a `pauseDelta()`.
If there are changes since the `pauseDelta()` it sends the `delta$` subscribers only one update containing all changes (added, deleted and/or modified entries).
[back to top](#deltamap----omit-in-toc)
</li></ul>