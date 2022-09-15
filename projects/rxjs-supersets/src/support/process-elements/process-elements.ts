import { mapForEach } from '../../shared/map-for-each';
import { IdObject, MapDelta } from '../../types';

/**
 * Utility function to make processing every element in a DeltaMap easier
 */
export function processElements<V extends IdObject<K>, K = string>(
  delta: MapDelta<K, V>,
  handlerFunctions: {
    add?: (value: Readonly<V>) => void,
    modify?: (value: Readonly<V>) => void,
    delete?: (value: Readonly<V>) => void,
  }): void {
  mapForEach(delta.deleted, handlerFunctions.delete);
  mapForEach(delta.modified, handlerFunctions.modify);
  mapForEach(delta.added, handlerFunctions.add);
}