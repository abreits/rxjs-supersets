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

// create a new DeltaMap with a updated check
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
  if(delta.created.size > 0) ...
  if(delta.deleted.size > 0) ...
  if(delta.updated.size > 0) ...
});

// subscribe to DeltaMap updates with the processDelta operator
const subscription = deltaMap.delta$.pipe(processDelta({
  create: item => processCreateElement(item),
  update: item => processUpdateElement(item),
  delete: item => processDeleteElement(item)
})).subscribe();
```
[back to top](#deltamap----omit-in-toc)

## Methods and properties

The `DeltaMap` class adds or changes the following properties and methods of the [javascript `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map):

### `constructor`
<ul><li style="list-style-type: none;">

  The constructor for the `DeltaMap` class (called in `new DeltaMap<Key, Value>()`) can be used the same way as the `Map` constructor. It also accepts a settings argument instead or after the `preFilled` content argument. The `DeltaMapSettings` structure can contain the following two properties:

  - `isUpdated?: (T) => boolean` By default when an item is `set` in the `DeltaMap` with an `Id` key that is already present, it is assumed that it is newer and the existing key will be updated to the `set` item. 
  An `isUpdated` function can be created to only update the value when certain conditions have been met (e.g. the `date` property of the `set` item must be more recent than the exisiting item)

  - `publishEmpty?: boolean` By default a `DeltaMap` only publishes when someting changes from the default empty `DeltaMap`. 
  There are certain cases when a subscription wants to know if the `DeltaMap` is initially empty.
  You can set `publishempty` to `true` when you want the empty `DeltaMap` to publish its initial state, even if it is.

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

  Publishes changes to the set created by the `get()`, `set()`, `delete()` and `clear()` methods.
  The changes are published in `MapDelta` format:

``` typescript
export interface MapDelta<Key, Value> {
  all: MapReader<Key, Value>;
  created: MapReader<Key, Value>;
  updated: MapReader<Key, Value>;
  deleted: SetReader<Key>;
}
```
Examples
``` typescript
map1.delta$.subscribe(delta => {
  console.log('received map delta update')
  console.log(`  all items: ${delta.all}`);
  console.log(`  items created: ${delta.created}`);
  console.log(`  items updated: ${delta.updated}`);
  console.log(`  items deleted: ${delta.deleted}`);
});

map1.delta$.pipe(processDelta()).subscribe(delta => {
  console.log('received map delta update')
  console.log(`  all items: ${delta.all}`);
  console.log(`  items created: ${delta.created}`); // equal to 'all' in first delta
  console.log(`  items updated: ${delta.updated}`); // empty in first delta
  console.log(`  items deleted: ${delta.deleted}`); // empty in first delta
});

map1.delta$.pipe(processDelta({
  create: item => console.log(`created ${item}`),
  update: item => console.log(`updated ${item}`),
  delete: item => console.log(`deleted ${item}`),
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
If there are changes since the `pauseDelta()` it sends the `delta$` subscribers only one update containing all changes (created, deleted and/or updated entries).
[back to top](#deltamap----omit-in-toc)
</li></ul>