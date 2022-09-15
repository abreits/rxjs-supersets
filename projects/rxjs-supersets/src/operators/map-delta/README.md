# `mapDelta(mappingFunction: (entry) => modifiedEntry)`

The `mapDelta` RxJS operator operates on `MapDelta` structures.
It performs the specified map operation to all `added` and `modified` items in the `MapDelta`.

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

// you can change (map) the content of all MapDelta elements using the mapDelta() operator.
// It is best used along the 'immer' library
import { produce } from 'immer';
deltaSet.delta$.pipe(
  mapDelta(element => produce(element, draft => {
    draft.id += 'm'; // you can even change it's id
    draft.extra = 'mapped!'; 
  }))
).subscribe(delta => {
  delta.all;     // a map with all mapped entries
  delta.added; // a map with new mapped entries
  delta.modified; // a map with modified mapped entries
  delta.deleted; // a map with deleted mapped entries
});

```
[back to top](#mapdeltamappingfunction-entry--modifiedentry)
