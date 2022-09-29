import { map } from 'rxjs/operators';

import { DeltaObservable, IdObject, MapDelta } from '../../types';

/**
 * RxJS convenience operator that combines the _startDelta()_ and _tapDelta()_ operators
 * 
 * Advised to use the _startDelta(), tapDelta()_ operator combination instead or use the
 * _startDelta()_ operator and process the elements in the _subscribe()_ with the _processElements()_ function.
 **/
export function processDelta<
  V extends Readonly<IdObject<K>>,
  K = string
>(handlerFunctions?: {
  before?: (delta: MapDelta<K, V>) => void,
  add?: (value: Readonly<V>) => void,
  modify?: (value: Readonly<V>) => void,
  delete?: (value: Readonly<V>) => void,
  after?: (delta: MapDelta<K, V>) => void
}): (delta: DeltaObservable<K, V>) => DeltaObservable<K, V> {
  let started = false;
  return map((delta: MapDelta<K, V>) => {
    if (!started) {
      // first pass, we add all elements to added for correct initial state
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
        handlerFunctions.before(delta);
      }
      handleEntries(delta.deleted, handlerFunctions.delete);
      handleEntries(delta.modified, handlerFunctions.modify);
      handleEntries(delta.added, handlerFunctions.add);
      if (handlerFunctions.after) {
        handlerFunctions.after(delta);
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
