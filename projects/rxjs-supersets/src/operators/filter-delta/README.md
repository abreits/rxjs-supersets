# `filterDelta(filterFunction: (entry) => boolean)`

The `filterDelta` RxJS operator operates on `MapDelta` structures.
It returns `added` and `modified` entries in the `MapDelta` that return _true_ for the filterFunction.
Entries returning _false_ are added to `deleted`.

[back to main](../../../README.md)

## Examples

``` typescript
// if you only want to process certain elements of a MapDelta
// you can use the filterDelta() operator
deltaMap.delta$.pipe(startDelta(
  filterDelta(element => element < Date.now())
)).subscribe(delta => {
  delta.all;     // contains a map with both added entries
  delta.added; // contains a map with all entries on the first update
  delta.modified; // contains a map with no entries on the first update
  delta.deleted; // contains a map with no entries on the first update
});
```
[back to top](#filterdeltafilterfunction-entry--boolean)