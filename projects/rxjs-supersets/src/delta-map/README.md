# DeltaMap <!-- omit in toc -->

The `DeltaMap` extends the javascript core `Map` class. It provides a `delta$` property to allow subscribers to keep track of changes (additions, modifications and deletions) made to it.

## Table of contents <!-- omit in toc -->
- [Examples](#examples)
- [Methods and properties](#methods-and-properties)
  - [`constructor`](#constructor)
  - [`delta$: DeltaObservable<Key, Value>`](#delta-deltaobservablekey-value)
  - [`close()`](#close)
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
  isUpdated: (current, previous) => current.lastUpdated > previous.lastUpdated
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
  add: entry => processCreateElement(entry),
  modify: entry => processUpdateElement(entry),
  delete: entry => processDeleteElement(entry)
})).subscribe();
```
[back to top](#deltamap----omit-in-toc)

## Methods and properties

The `DeltaMap` class adds or changes the following properties and methods of the [javascript `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map):

### `constructor`
<ul><li style="list-style-type: none;">

  The constructor for the `DeltaMap` class (called in `new DeltaMap<Key, Value>()`) can be used the same way as the `Map` constructor. It also accepts a settings argument instead or after the `preFilled` content argument. The `DeltaMapSettings` structure can contain the following properties:

  - `isUpdated?: (T) => boolean` By default when an entry is `set` in the `DeltaMap` with an `Id` key that is already present, it is assumed that it is newer and the existing key will be modified to the `set` entry. 
  An `isUpdated` function can be added to only update the value when certain conditions have been met (e.g. the `date` property of the `set` entry must be more recent than the exisiting entry)

  - `publishEmpty?: boolean` Defaults to `true`, by default a `DeltaMap` always publishes initially, even when the `DeltaMap` is empty. 
  There are certain cases when you do not want to bother your subscriptions if the `DeltaMap` is initially empty.
  You can set `publishEmpty` to `false` when you do not want the empty `DeltaMap` to publish its initial state.

  - `copyAll?: boolean` Defaults to `false`, by default the `delta$` publishes the full existing map as `Readonly` in the `all` property for all `MapDelta` updates it publishes for efficiency reasons. Most of the time this is no problem, however if the full set changes before the mapDelta is processed this could become a problem in edge cases. If this property is set to `true` it publishes a shallow copy of the full map at the time of publication to prevent these problems from occuring. This of course can have a serious impact on larger maps.

  Possible call options:
  ``` typescript
  new DeltaMap<KeyType, ValueType>();
  new DeltaMap<KeyType, ValueType>(entries: Iterable<any>);
  new DeltaMap<KeyType, ValueType>(settings: DeltaMapSettings);
  new DeltaMap<KeyType, ValueType>(entries: Iterable<any>, settings: DeltaMapSettings);
  ```

  Examples
  ``` typescript
  const map1 = new DeltaMap<string, number>();

  const map2 = new DeltaMap<string, number>([['a', 1], ['b', 2], ['c', 3]]);

  const map3 = new DeltaMap<string, number>({
    isUpdated: (newValue, oldValue) => newValue != oldValue,
    publishEmpty: true
  });

  const map4 = new DeltaMap<string, number>([['a', 1], ['b', 2], ['c', 3]], {
    isUpdated: (newValue, oldValue) => newValue != oldValue,
    publishEmpty: true
  });
  ```
  [back to top](#deltamap----omit-in-toc)
</li></ul>

### `delta$: DeltaObservable<Key, Value>`
<ul><li style="list-style-type: none;">

  Publishes changes to the set added by the `get()`, `set()`, `delete()` and `clear()` methods.
  The changes are published in `MapDelta` format:

``` typescript
export interface MapDelta<Key, Value> {
  all: MapReader<Key, Value>;
  added: MapReader<Key, Value>;
  modified: MapReader<Key, Value>;
  deleted: SetReader<Key>;
}
```
Examples
``` typescript
map1.delta$.subscribe(delta => {
  console.log('received map delta update')
  console.log(`  all entries: ${delta.all}`);
  console.log(`  entries added: ${delta.added}`);
  console.log(`  entries modified: ${delta.modified}`);
  console.log(`  entries deleted: ${delta.deleted}`);
});

map1.delta$.pipe(processDelta()).subscribe(delta => {
  console.log('received map delta update')
  console.log(`  all entries: ${delta.all}`);
  console.log(`  entries added: ${delta.added}`); // equal to 'all' in first delta
  console.log(`  entries modified: ${delta.modified}`); // empty in first delta
  console.log(`  entries deleted: ${delta.deleted}`); // empty in first delta
});

map1.delta$.pipe(processDelta({
  add: entry => console.log(`added ${entry}`),
  modify: entry => console.log(`modified ${entry}`),
  delete: entry => console.log(`deleted ${entry}`),
})).subscribe();
```
[back to top](#deltamap----omit-in-toc)
</li></ul>

### `close()`
<ul><li style="list-style-type: none;">

Calls the `clear()` method and `complete`'s all delta$ subscriptions to the `DeltaMap`.
[back to top](#deltamap----omit-in-toc)
</li></ul>

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