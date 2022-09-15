# `produceDelta(mappingFunction: (entry) => modifiedEntry)`


The `produceDelta` RxJS operator is a shorthand for `mapDelta(x => produce(x, y => ...))` when it returns the same object type.

It uses the [Immer](https://immerjs.github.io/immer/) library to guarantee that the original element remains immutable.

As with [mapDelta()](../map-delta/README.md), it performs the specified map operation to all `created` and `updated` items in the `MapDelta`.

[back to main](../../../README.md)

``` typescript
// an IdObject class to demonstrate the mapDelta() operator
class IdContent implements IdObject {
  constructor (
    public id: string,
    public content: string,
    public extra?: string
  ) { }
}
const item1 = new IdContent('id1','content1');
const item2 = new IdContent('id2','content2');
const item3 = new IdContent('id3','content3');

const deltaSet = new DeltaSet<string, IdContent>();
deltaSet.addMultiple([item1, item2, item3]);

// you can change (map) the content of all MapDelta elements using the produceDelta() operator.
deltaSet.delta$.pipe(
  produceDelta(draft => {
    draft.id += 'm'; // you can even change it's id
    draft.extra = 'mapped!'; 
  })
).subscribe(delta => {
  delta.all;     // a map with all mapped entries
  delta.added; // a map with new mapped entries
  delta.modified; // a map with updated mapped entries
  delta.deleted; // a map with deleted mapped entries
});

```
[back to top](#producedeltamappingfunction-entry--modifiedentry)
