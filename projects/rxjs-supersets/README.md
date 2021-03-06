# rxjs-supersets <!-- omit in toc -->

A collection of [Typescript](https://www.typescriptlang.org/) Maps and Sets that publish changes in their state (entries created, updated or deleted) using [RxJS](https://rxjs.dev/) Observables.

For the latest changes and the current version see the [Change log](./CHANGELOG.md).

# Table of contents <!-- omit in toc -->

- [Introduction](#introduction)
- [In detail](#in-detail)
  - [Maps and Sets](#maps-and-sets)
  - [RxJS operators](#rxjs-operators)
  - [DataTypes and Interfaces](#datatypes-and-interfaces)
- [Examples](#examples)
  - [DeltaMap example](#deltamap-example)
  - [processDelta example](#processdelta-example)
  - [DeltaSet example](#deltaset-example)
  - [settings example](#settings-example)
  - [SuperSet and SimpleSuperSet example](#superset-and-simplesuperset-example)
# Introduction

TODO: describe why it was created

`rxjs-supersets` contains a number of Typescript `Map` and `Set` subclasses that have an [RxJS](https://rxjs.dev/) `Observable` property `delta$` that you can subscribe to if you want to be informed of the changes taking place in the `Set` or `Map`. It keeps track of addition, modification and deletion of entries in the `Set` or `Map`.

`rxjs-supersets` has only one dependency ([tslib](https://github.com/Microsoft/tslib)) and one peer dependency ([rxjs](https://rxjs.dev/)).

The content changes are published in `MapDelta` format:

``` typescript
export interface MapDelta<K, V> {
  all: ReadonlyMap<K, Readonly<V>>;
  created: ReadonlyMap<K, Readonly<V>>;
  deleted: ReadonlyMap<K, Readonly<V>>;
  updated: ReadonlyMap<K, Readonly<V>>;
}
```

The entries returned in a `MapDelta` are defined as  `Readonly` in Typescript.
This is done as a precaution to prevent accidental in place updating of the entries. 
The correct way is to create a copy of the entry when updating its properties. There are excellent libraries for this, e.g. [Immer](https://immerjs.github.io/immer/), [immutable-js](https://immutable-js.com/) or [lodash](https://lodash.com/) just to name a few.

A `processDelta` rxjs operator is provided to help processing the resulting `MapDelta` changes.

[back to top](#rxjs-supersets----omit-in-toc)

# In detail

## Maps and Sets
- [DeltaMap](./src/delta-map/README.md), a basic observable map
- [DeltaSet](./src/delta-set/README.md), a set of IdObjects, objects with an 'id' property
- [SuperSet](./src/super-set/README.md), a set of IdMemberObjects, 'IdObjects' with a `memberOf` property that makes them member of one or more subsets within the `SuperSet` and provides automatic (sub)set operations and management. You can subscribe to the `delta$` of the individual subsets.
- [SimpleSuperSet](./src/simple-super-set/README.md), a simpler version of of the `SuperSet` that does not have subset subscription.

## RxJS operators
- [processDelta](./src/process-delta/README.md)


## DataTypes and Interfaces

See [types.ts](./src/types.ts) for the type definitions of the types and interfaces used


# Examples

This section contains example code demonstrating how the `rxjs-supersets` maps and sets can be used.

## DeltaMap example

DeltaMap is the basic class that provides the `delta$` observable, the other sets in `rxjs-supersets`
are based on this class.
``` typescript
const deltaMap = new DeltaMap<string, Date>();
deltaMap.set('item1', new Date());
deltaMap.set('item2', new Date());

// deltaMap.delta$ is a Replaysubject(1), it only returns the last update
deltaMap.delta$.subscribe(delta => {
  delta.all; // contains a map with both created entries
  delta.created; // contains a map with only the latest addition (item2)
  delta.updated; // contains a map with no entries (nothing updated)
  delta.deleted; // contains a map with no entries (nothing deleted)
});

// modify a DeltaMap entry 
deltaMap.set('item1', new Date());

// latest deltaMap.delta$ update now contains
deltaMap.delta$.subscribe(delta => {
  delta.all;     // a map with both entries
  delta.created; // a map with no entries (nothing created)
  delta.updated; // a map with item1
  delta.deleted; // a map with no entries (nothing deleted)
});

// delete a DeltaMap entry 
deltaMap.delete('item2');

// latest deltaMap.delta$ update now contains
deltaMap.delta$.subscribe(delta => {
  delta.all;     // a map with remaining entry (item1)
  delta.created; // a map with no entries (nothing created)
  delta.updated; // a map with no entries (nothing updated)
  delta.deleted; // a map with item2
});
```
[back to top](#rxjs-supersets----omit-in-toc)

## processDelta example

`processDelta` is an RxJS operator that makes sure that you get all entries created when you first subscribe to a `delta$`. It works for all `rxjs-supersets` Maps and Sets.
``` typescript
const deltaMap = new DeltaMap<string, Date>();
deltaMap.set('item1', new Date());
deltaMap.set('item2', new Date());

// if you want a new subscription to always start with all in the created property
// you can insert the processDelta() operator
deltaMap.delta$.pipe(processDelta()).subscribe(delta => {
  delta.all;     // contains a map with both created entries
  delta.created; // contains a map with all entries on the first update
  delta.updated; // contains a map with no entries on the first update
  delta.deleted; // contains a map with no entries on the first update
});

// if you do not want to iterate through the updates yourself
// you can also use the processDelta operator for this
deltaMap.delta$.pipe(processDelta({
  before: () => initUpdate(),     // call before update processing (optional)
  create: entry => doAdd(entry),    // processes both entries one at a time (optional)
  update: entry => doModify(entry), // ignored because there are no entries to process (optional)
  delete: entry => doDelete(entry), // ignored because there are no entries to process (optional)
  after: () => completeUpdate()   // call after update processing (optional)
})).subscribe();
```
[back to top](#rxjs-supersets----omit-in-toc)

## DeltaSet example

`DeltaSet` extends the `DeltaMap`, it treats its contents more as a Set, where the `id` property of its content uniquely identifies the entry in the Set.

``` typescript
// an IdObject class to demonstrate te DeltaSet
class IdContent implements IdObject {
  constructor (
    public id: string,
    public content: string
  ) { }
}
const item1 = new IdDate('id1','content1');
const item2 = new IdDate('id2','content2');
const item3 = new IdDate('id3','content3');

const deltaSet = new DeltaSet<string, IdContent>();
deltaSet.addMultiple([item1, item2, item3]);

// deltaSet.delta$ is a Replaysubject(1), it only returns the last update
deltaSet.delta$.subscribe(delta => {
  delta.all;     // a map with all created entries
  delta.created; // a map with only the latest addition (item3)
  delta.updated; // a map with no entries (nothing updated)
  delta.deleted; // a map with no entries (nothing deleted)
});

// update an existing entry
const item2b = new IdDate('id2','content2b');
deltaSet.add(item2b); // item2 is replaced with item2b

// a subscription would receve the following
deltaSet.delta$.subscribe(delta => {
  delta.all;     // a map with all current entries
  delta.created; // a map with no entries (nothing updated)
  delta.updated; // a map with item2b
  delta.deleted; // a map with no entries (nothing deleted)
});

```
[back to top](#rxjs-supersets----omit-in-toc)


## settings example

All `rxjs-supersets` Maps and Sets can have settings created to modify their behaviour.

``` typescript
// an IdObject class to demonstrate te DeltaSet
class IdContent implements IdObject {
  constructor (
    public id: string,
    public content: string
  ) { }
}
const item1 = new IdDate('id1','content1');
const item2 = new IdDate('id2','content2');
const item3 = new IdDate('id3','content3');

const deltaSet = new DeltaSet<string, IdContent>({
  isUpdated: (newItem, existingItem) => newItem.content === existingItem.content,
  publishEmpty: true
});

// normally a delta$ subscription only starts receiving updates if the set is not empty.
// if 'publishEmpty' is set to true, initially empty sets also publish updates
deltaSet.delta$.subscribe(delta => {
  delta.all;      // a map with no entries (nothing present)
  delta.created;    // a map with no entries (nothing created)
  delta.updated; // a map with no entries (nothing updated)
  delta.deleted;  // a map with no entries (nothing deleted)
});

deltaSet.addMultiple([item1, item2, item3]);
// entries created and updates sent to delta$ subscriptions

const item2b = new IdDate('id2','content2');
deltaSet.add(item2b);
// item2b will not replace item2 because 'isUpdated' returns false
// delta$ subscriptions will not receive an update because nothing was changed

```
[back to top](#rxjs-supersets----omit-in-toc)


## SuperSet and SimpleSuperSet example

The `SuperSet` is a collection of entries that each are member of one or more of its subsets.
It extends the `DeltaSet`. The difference between `SuperSet` and `SimpleSuperSet` is that you can 
subscribe to the subset `delta$` to receive updates whereas with the `SimpleSuperSet` you cannot do that. 

``` typescript
// a MemberObject class to demonstrate te SuperSet
class MemberContent implements MemberObject {
  public memberOf: Set<string>
  constructor (
    public id: string,
    memberOf: string[],
    public content: string
  ) {
    this.memberOf = new Set(memberOf);
  }
}
const item1 = new MemberContent('id1', ['subset1'], 'content1');
const item2 = new MemberContent('id2', ['subset1'], 'content2');
const item3 = new MemberContent('id3', ['subset1'], 'content3');
const item4 = new MemberContent('id4', ['subset1', 'subset2'], 'content4');
const item5 = new MemberContent('id5', ['subset2'], 'content5');
const item6 = new MemberContent('id6', ['subset1', 'subset3'], 'content6');

const superSet = new SuperSet<string, MemberContent>();
const supersetSubscription = superSet.delta$.subscribe();

// subscribing to an emty subset creates it
const subset2Subscription = superSet.subsets.get('subset2').delta$.subscribe();

superSet.addMultiple([item1, item2, item3, item4, item5, item6]);
// 'subset2Subscription' receives a delta that tells that MemberContent entries with 
// id4 and id5 have been created.
// 'superSetSubscription' receives a delta that tells that MemberContent entries with
// id1, id2, id3, id4, id5 and id6 have been created.

// Subscribing to an exisiting subset returns its members directly after the subscription.
const subset1Subscription = superSet.subsets.get('subset1').delta$.subscribe();
// 'subset1Subscription' receives a delta that tells that MemberContent entries with 
// id1, id2, id3, id4 and id6 are present (in `all` property).

superset.deleteSubsetItems('subset3');
// All entries in subset3 are removed from the superset and also 
// removed from all other subsets they are member of.
// Both 'superSetSubscription' and 'subset1Subscription' receive a delta that tells 
// that MemberContent entries with id6 was deleted.

superset.subsets.empty('subset2');
// All entries in subset 2 are removed from the subset, 
// entries that are no longer in a subset are also removed from the SuperSet.
// 'subset2Subscription' receives a delta that tells that MemberContent entries with
// id4 and id5 were deleted.
// 'superSetSubscription' receives a delta that tells that MemberContent entries with
// id5 was deleted.

superset.subsets.delete('subset1');
// All entries in subset 1 are removed from the subset, its `delta` observable is closed,
// the subset is removed from the SuperSet.
// 'subset1Subscription' receives a delta that tells that MemberContent entries with
// id1, id2, id3 and id4 were deleted, after that the subscription is closed.
// 'superSetSubscription' receives a delta that tells that MemberContent entries with
// id1, id2, id3 and id4 were deleted.

```
[back to top](#rxjs-supersets----omit-in-toc)
