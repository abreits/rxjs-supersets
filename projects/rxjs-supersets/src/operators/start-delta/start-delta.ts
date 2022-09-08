import { map } from 'rxjs/operators';

import { DeltaObservable, IdObject, MapDelta } from '../../types';

/**
 * rxjs operator that passes _all_ entries in _added_ on the first passthrough
 */
export function startDelta<
  V extends Readonly<IdObject<K>>,
  K = string
>(): (delta: DeltaObservable<K, V>) => DeltaObservable<K, V> {
  let started = false;
  return map((delta: MapDelta<K, V>) => {
    if (!started) {
      // first pass, we add all elements to created for correct initial state
      delta = {
        all: delta.all,
        created: delta.all,
        deleted: new Map<K, V>(),
        updated: new Map<K, V>()
      };
      started = true;
    }
    return delta;
  });
}
