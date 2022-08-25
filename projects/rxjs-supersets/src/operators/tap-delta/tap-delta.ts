import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { mapForEach } from '../../shared/map-for-each';

import { IdObject, MapDelta } from '../../types';

/**
 * Rxjs operator that performs side effects on the DeltaMap without changing its contents.
 * 
 * Takes a handleFunctions parameter that contains optional functions to be called for each
 * created, deleted or updated entry.
 */
export function tapDelta<V extends Readonly<IdObject<K>>, K = string>(handlerFunctions: {
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
    mapForEach(delta.deleted, handlerFunctions.delete);
    mapForEach(delta.updated, handlerFunctions.update);
    mapForEach(delta.created, handlerFunctions.create);
    if (handlerFunctions.after) {
      handlerFunctions.after();
    }
    return delta;
  });
}
