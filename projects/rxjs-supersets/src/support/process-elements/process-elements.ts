import { mapForEach } from '../../shared/map-for-each';
import { IdObject, MapDelta } from '../../types';

/**
 * Utility function to make processing every element in a DeltaMap easier
 */
export function processElements<V extends IdObject<K>, K = string>(
  delta: MapDelta<K, V>,
  handlerFunctions: {
    create?: (value: Readonly<V>) => void,
    update?: (value: Readonly<V>) => void,
    delete?: (value: Readonly<V>) => void,
  }): void {
  mapForEach(delta.deleted, handlerFunctions.delete);
  mapForEach(delta.updated, handlerFunctions.update);
  mapForEach(delta.created, handlerFunctions.create);
}