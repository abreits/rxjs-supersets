# SimpleSuperSet <!-- omit in toc -->

The `SimpleSuperSet` is a subclass of the [`DeltaSet`](../delta-set/README.md) class.

The `SimpleSuperSet` is a simplified version of [`SuperSet`](../super-set/README.md) that does not allow subset subscriptions. 
The entries still implement the `MemberObject` interface. Its `memberOf` property defines the subsets that the entry is a member of.
If an entry no longer is member of any subset it is also removed from the simple superset.

The SimpleSuperSet `delta$` still publishes changes of all its content.

## Table of contents <!-- omit in toc -->
- [Examples](#examples)
- [Methods and properties](#methods-and-properties)
  - [`add(entry: T, addExistingSubSets = false)`](#additem-t-addexistingsubsets--false)
  - [`deleteSubSetItems(subSetId: SubSetId): void`](#deletesubsetitemssubsetid-subsetid-void)
  - [`subsets: SubsetMap<SubsetId, ReadonlyDeltaMap<ItemId, Item>>`](#subsets-subsetmapsubsetid-readonlydeltamapitemid-entry)
  - [`subsets.get(SubsetId): ReadonlyDeltaMap<ItemId, Item>>`](#subsetsgetsubsetid-readonlydeltamapitemid-entry)
  - [`subsets.empty(subSetId: SubSetId): void`](#subsetsemptysubsetid-subsetid-void)
  - [`subsets.delete(subSetId: SubSetId): void`](#subsetsdeletesubsetid-subsetid-void)

[back to main](../../README.md)

## Examples
``` typescript
// TODO: create SimpleSuperSet examples
```
[back to top](#simplesuperset----omit-in-toc)


## Methods and properties

The `SimpleSuperSet` class has the following additions and modifications to its [`DeltaSet`](../delta-set/README.md) superclass:


### `add(entry: T, addExistingSubSets = false)`
<ul><li style="list-style-type: none;">

Adds a new entry to the `SimpleSuperSet`.
If `addExistingSubSets` is `true` any existing `SubSetId`'s from an existing entry with the same Id will be merged into this entry.
If an entry is not member of a subset (the `memberOf` set is empty) the entry will be deleted.

[back to top](#simplesuperset----omit-in-toc)
</li></ul>

### `deleteSubSetItems(subSetId: SubSetId): void`
<ul><li style="list-style-type: none;">

Deletes all entries containing `subSetId` in their `subset` property from the `SimpleSuperSet`.

Sends an update to all `subset`'s that have elements removed.

[back to top](#simplesuperset----omit-in-toc)
</li></ul>

### `subsets: SubsetMap<SubsetId, ReadonlyDeltaMap<ItemId, Item>>`
<ul><li style="list-style-type: none;">

Returns the `SubsetMap` of this `SimpleSuperSet`. This is a `ReadonlyMap`, extended with the methods described below.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.get(SubsetId): ReadonlyDeltaMap<ItemId, Item>>`
<ul><li style="list-style-type: none;">

If a subset does not already exist, the `get` method creates a new empty `ReadonlyDeltaMap<ItemId, Item>` so you can subscribe to its `delta$`.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.empty(subSetId: SubSetId): void`
<ul><li style="list-style-type: none;">

Removes the subSetId from the `subSet` property of all entries in the `SimpleSuperSet`.

If the resulting entry `subSet` property is empty (it is no longer member of a subSet), the entry is also deleted.
Sends an update to the subscribers of the `subset.delta$` involved and to subscribers of 
the `SuperSet.delta$` itself.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.delete(subSetId: SubSetId): void`
<ul><li style="list-style-type: none;">

Does a `clearSubSet`, followed by `complete`-ing all its subscriptions and finally deleting the category from the `SimpleSuperSet`.

[back to top](#superset----omit-in-toc)
</li></ul>