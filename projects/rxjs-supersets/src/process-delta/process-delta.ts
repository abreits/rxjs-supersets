import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapDelta } from '../types';

/**
 * rxjs operator that passes _all_ entries in _added_ on the first passthrough
 * 
 * takes optional parameter that contains optional functions to be called for each
 * added, deleted or modified entry.
 */
export function processDelta<K, V>(handlerFunctions?: {
  add?: (value: Readonly<V>) => void,
  delete?: (value: Readonly<V>) => void,
  modify?: (value: Readonly<V>) => void,
  before?: () => void,
  after?: () => void
}): (delta: Observable<MapDelta<K, V>>) => Observable<MapDelta<K, V>> {
  let started = false;
  return map((delta: MapDelta<K, V>) => {
    if (!started) {
      // first pass we add all elements to added for correct initial state
      delta = {
        all: delta.all,
        added: delta.all,
        deleted: new Map<K, V>(),
        modified: new Map<K, V>()
      };
      started = true;
    }
    if (handlerFunctions) {
      if (handlerFunctions.before) {
        handlerFunctions.before();
      }
      handleEntries(delta.deleted, handlerFunctions.delete);
      handleEntries(delta.modified, handlerFunctions.modify);
      handleEntries(delta.added, handlerFunctions.add);
      if (handlerFunctions.after) {
        handlerFunctions.after();
      }
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
