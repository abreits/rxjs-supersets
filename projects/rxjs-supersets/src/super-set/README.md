# SuperSet <!-- omit in toc -->

The `SuperSet` is a subclass of the [`DeltaSet`](../delta-set/README.md) class.

The `SuperSet` contains items that are member of one or more subsets.
The items implement the `MemberObject` interface. Its `memberOf` property defines the subsets that the item is a member of. If an item no longer is member of any subset it is removed from the superset also.

The SuperSet `delta$` publishes changes of all its content.

The SuperSet also allows you to subscribe to changes of a specific subset by subscribing to the subset's `delta$`.

## Table of contents <!-- omit in toc -->
- [Examples](#examples)
- [Methods and properties](#methods-and-properties)
  - [`constructor`](#constructor)
  - [`add(item: T, addExistingSubSets = false)`](#additem-t-addexistingsubsets--false)
  - [`deleteSubSetItems(subSetId: SubSetId): void`](#deletesubsetitemssubsetid-subsetid-void)
  - [`subsets: SubsetMap<SubsetId, ReadonlyDeltaMap<ItemId, Item>>`](#subsets-subsetmapsubsetid-readonlydeltamapitemid-item)
  - [`subsets.get(SubsetId): ReadonlyDeltaMap<ItemId, Item>>`](#subsetsgetsubsetid-readonlydeltamapitemid-item)
  - [`subsets.empty(subSetId: SubSetId): void`](#subsetsemptysubsetid-subsetid-void)
  - [`subsets.delete(subSetId: SubSetId): void`](#subsetsdeletesubsetid-subsetid-void)
  - [`subsets.pauseDeltas()`](#subsetspausedeltas)
  - [`subsets.resumeDeltas()`](#subsetsresumedeltas)

[back to main](../../README.md)

## Examples
``` typescript
// TODO: create SuperSet examples
```
[back to top](#superset----omit-in-toc)


## Methods and properties

The `SuperSet` class has the following additions and modifications to its [`DeltaSet`](../delta-set/README.md) superclass:


### `constructor`
<ul><li style="list-style-type: none;">

The constructor for the `DeltaMap` class (called in `new DeltaMap<Key, Value>()`) can contain a `subsets` setting property.
This property defines the `delta$` behaviour of the subsets. 
It can contain the same properties as defined in the [`DeltaMap`](../delta-map/README.md).

[back to top](#superset----omit-in-toc)
</li></ul>


### `add(item: T, addExistingSubSets = false)`
<ul><li style="list-style-type: none;">

Adds a new item to the `SuperSet`.
If `addExistingSubSets` is `true` any existing `SubSetId`'s from an existing item with the same Id will be merged into this item.
If an item is not member of a subset (the `memberOf` set is empty) the entry will be deleted.

[back to top](#superset----omit-in-toc)
</li></ul>

### `deleteSubSetItems(subSetId: SubSetId): void`
<ul><li style="list-style-type: none;">

Deletes all items containing `subSetId` in their `subset` property from the `SuperSet`.

Sends an update to all `SubSet`'s that have elements removed.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets: SubsetMap<SubsetId, ReadonlyDeltaMap<ItemId, Item>>`
<ul><li style="list-style-type: none;">

Returns the `SubsetMap` of this `SuperSet`. This is a `ReadonlyMap`, extended with the methods described below.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.get(SubsetId): ReadonlyDeltaMap<ItemId, Item>>`
<ul><li style="list-style-type: none;">

If a subset does not already exist, the `get` method creates a new empty `ReadonlyDeltaMap<ItemId, Item>` so you can subscribe to its `delta$`.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.empty(subSetId: SubSetId): void`
<ul><li style="list-style-type: none;">

Removes the subSetId from the `subSet` property of all items in the `SuperSet`.

If the resulting item `subSet` property is empty (it is no longer member of a subSet), the item is also deleted.
Sends an update to the subscribers of the `SubSet.delta$` involved and to subscribers of 
the `SuperSet.delta$` itself.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.delete(subSetId: SubSetId): void`
<ul><li style="list-style-type: none;">

Does a `clearSubSet`, followed by `complete`-ing all its subscriptions and finally deleting the category from the `SuperSet`.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.pauseDeltas()`
<ul><li style="list-style-type: none;">

Pauses the category updates for all categories of the `SuperSet`.
Changes will be collected, but updates will only be sent after `subsets.resumeDeltas()` is called.
This can be used to reduce the number of delta$ updates published.

[back to top](#superset----omit-in-toc)
</li></ul>

### `subsets.resumeDeltas()`
<ul><li style="list-style-type: none;">

Resumes the category updates again after a `subsets.pauseDeltas()`.

[back to top](#superset----omit-in-toc)
</li></ul>
