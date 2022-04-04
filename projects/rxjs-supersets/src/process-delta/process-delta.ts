import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MapDelta } from '../types';

/**
 * rxjs operator that passes _all_ entries in _added_ on the first passthrough
 * 
 * takes optional parameter that contains optional functions to be called for each
 * created, deleted or updated entry.
 */
export function processDelta<K, V>(handlerFunctions?: {
  before?: () => void,
  create?: (value: Readonly<V>) => void,
  update?: (value: Readonly<V>) => void,
  delete?: (value: Readonly<V>) => void,
  after?: () => void
}): (delta: Observable<MapDelta<K, V>>) => Observable<MapDelta<K, V>> {
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
    if (handlerFunctions) {
      if (handlerFunctions.before) {
        handlerFunctions.before();
      }
      handleEntries(delta.deleted, handlerFunctions.delete);
      handleEntries(delta.updated, handlerFunctions.update);
      handleEntries(delta.created, handlerFunctions.create);
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
