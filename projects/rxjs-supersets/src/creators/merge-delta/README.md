# `mergeDelta<K, V>(...args: Observable<MapDelta<K,V>>): Observable<MapDelta<K,V>>`

The `mergeDelta` function merges the supplied `MapDelta` Observable arguments into a single `MapDelta` Observable.
It only subscribes to the source observable after the result observable is subscribed to.
It unsubscribes from the source observables after all result observable subscriptions are unsubscribed.

[back to main](../../../README.md)

## Examples

``` typescript
const set1 = new DeltaSet<IdObject>();
const set2 = new DeltaSet<IdObject>();
const set3 = new DeltaSet<IdObject>();

const merged = mergeDelta(set1.delta$, set2.delta$, set3.delta$);

merged.subscribe(delta => {
  // do something with the merged updates
});

```
[back to top](#filterdeltafilterfunction-entry--boolean)