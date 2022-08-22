import { Observable } from 'rxjs';
import { DeltaSet } from '../../delta-set/delta-set';
import { map } from 'rxjs/operators';

import { IdObject, MapDelta } from '../../types';

/**
 * Rxjs operator that filters _created_ and _updated_ elements.
 */
export function filterDelta<V extends IdObject<K>, K = string>(filterFunction: (entry: V) => boolean): (delta: Observable<MapDelta<K, V>>) => Observable<MapDelta<K, V>> {
  const filterSet = new DeltaSet<V, K>();
  filterSet.pauseDelta();

  return map((delta: MapDelta<K, V>) => {
    if (delta.all.size === 0) {
      // optimization for empty source map
      filterSet.clear();
    } else {
      filterEntries(delta.updated);
      filterEntries(delta.created);
      deleteEntries(delta.deleted);
    }
    const newDelta = filterSet.getDelta();
    filterSet.clearDelta();
    return newDelta;
  });

  function filterEntries(set: ReadonlyMap<K, V>) {
    for (const entry of set.values()) {
      if (filterFunction(entry)) {
        filterSet.add(entry);
      } else {
        filterSet.delete(entry.id);
      }
    }
  }

  function deleteEntries(set: ReadonlyMap<K, V>) {
    for (const entry of set.values()) {
      filterSet.delete(entry.id);
    }
  }
}
