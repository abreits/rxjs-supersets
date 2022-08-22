import { Observable } from 'rxjs';
import { DeltaSet } from '../../delta-set/delta-set';
import { map } from 'rxjs/operators';

import { IdObject, MapDelta } from '../../types';

/**
 * RxJS operator that executes the specified _mappingFunction_ to all _created_ and _updated_ elements.
 */
export function mapDelta<V1 extends IdObject<K>, V2 extends IdObject<K>, K = string>(mappingFunction: (entry: V1) => V2): (delta: Observable<MapDelta<K, V1>>) => Observable<MapDelta<K, V2>> {
  const mapSet = new DeltaSet<V2, K>();
  mapSet.pauseDelta();

  return map((delta: MapDelta<K, V1>) => {
    if (delta.all.size === 0) {
      // optimization for empty source map
      mapSet.clear();
    } else {
      mapEntries(delta.updated);
      mapEntries(delta.created);
      deleteEntries(delta.deleted);
    }
    const newDelta = mapSet.getDelta();
    mapSet.clearDelta();
    return newDelta;
  });

  function mapEntries(set: ReadonlyMap<K, V1>) {
    for (const entry of set.values()) {
      mapSet.add(mappingFunction(entry));
    }
  }

  function deleteEntries(set: ReadonlyMap<K, V1>) {
    for (const entry of set.values()) {
      mapSet.delete(mappingFunction(entry).id);
    }
  }
}
