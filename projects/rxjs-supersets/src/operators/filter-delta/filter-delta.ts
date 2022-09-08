import { Observable } from 'rxjs';
import { DeltaSet } from '../../delta-set/delta-set';

import { DeltaObservable, IdObject } from '../../types';

/**
 * Rxjs operator that filters _created_ and _updated_ elements.
 */
export function filterDelta<
  V extends Readonly<IdObject<K>>,
  K = string
>(filterFunction: (entry: V) => boolean): (delta: DeltaObservable<K, V>) => DeltaObservable<K, V> {
  const filterSet = new DeltaSet<V, K>();
  filterSet.pauseDelta();

  return function (source: DeltaObservable<K, V>): DeltaObservable<K, V> {
    return new Observable(subscriber => {
      const subscription = source.subscribe({
        next(delta) {
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
          if (newDelta.created.size > 0 || newDelta.updated.size > 0 || newDelta.deleted.size > 0) {
            subscriber.next(newDelta);
          }
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        }
      });
      return () => subscription.unsubscribe();
    });
  };

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
