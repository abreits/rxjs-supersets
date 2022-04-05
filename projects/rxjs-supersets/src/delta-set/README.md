# DeltaSet <!-- omit in toc -->

The `DeltaSet` is a subclass of the [`DeltaMap`](../delta-set/README.md) class.

The `DeltaSet` contains items that implement the `IdObject` interface. Its `id` property uniquely defines the item for the `DeltaSet`. 
The id type defaults to string, but can be overriden by defining the IdType (`new DeltaSet<IdObjectType, IdType>()`).

## Table of contents <!-- omit in toc -->
- [Examples](#examples)
- [Methods and properties](#methods-and-properties)
  - [`add(entry: IdObject)`](#addentry-idobject)
  - [`addMultiple(entries: Iterable<IdObject>): void`](#addmultipleentries-iterableidobject-void)
  - [`replace(entries: Iterable<IdObject>): void`](#replaceentries-iterableidobject-void)

[back to main](../../README.md)

## Examples
``` typescript
// TODO: create DeltaSet examples
```
[back to top](#deltamap----omit-in-toc)


## Methods and properties

The `SuperSet` class has the following additions and modifications to its [`DeltaMap`](../delta-map/README.md) superclass:


### `add(entry: IdObject)`
<ul><li style="list-style-type: none;">

Adds a new or existing entry to the `DeltaSet`, updates the `delta$` subscribers. The `set` method of the `DeltaMap` still exists, but it redirects its `value` to the `add` method now.

[back to top](#deltaset----omit-in-toc)
</li></ul>


### `addMultiple(entries: Iterable<IdObject>): void`
<ul><li style="list-style-type: none;">

Adds multiple new and/or existing entries entries to the `DeltaSet`.
Sends the `delta$` subscribers only one update containing all changes (created and/or updated entries).

[back to top](#deltaset----omit-in-toc)
</li></ul>


### `replace(entries: Iterable<IdObject>): void`
<ul><li style="list-style-type: none;">

Replaces the whole contents of an `DeltaSet`.
Publishes the changes (deleted, created and/or updated entries) in one update to all `delta$` subscribers.

[back to top](#deltaset----omit-in-toc)
</li></ul>