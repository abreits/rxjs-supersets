import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { MapDelta } from '../../types';

/**
 * Rxjs operator that performs side effects on the DeltaMap without changing its contents.
 * 
 * Takes a handleFunctions parameter that contains optional functions to be called for each
 * created, deleted or updated entry.
 */
export function tapDelta<K, V>(handlerFunctions: {
  before?: () => void,
  create?: (value: Readonly<V>) => void,
  update?: (value: Readonly<V>) => void,
  delete?: (value: Readonly<V>) => void,
  after?: () => void
}): (delta: Observable<MapDelta<K, V>>) => Observable<MapDelta<K, V>> {
  return tap((delta: MapDelta<K, V>) => {
    if (handlerFunctions.before) {
      handlerFunctions.before();
    }
    handleEntries(delta.deleted, handlerFunctions.delete);
    handleEntries(delta.updated, handlerFunctions.update);
    handleEntries(delta.created, handlerFunctions.create);
    if (handlerFunctions.after) {
      handlerFunctions.after();
    }
    return delta;
  });

  function handleEntries<K, V>(set: ReadonlyMap<K, V>, fn?: (value: V) => void) {
    if (fn) {
      for (const entry of set.values()) {
        fn(entry);
      }
    }
  }
}
